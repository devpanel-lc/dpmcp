import { spawn } from 'node:child_process';
import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { config } from '../config.js';
import { buildAuthorizeUrl, exchangeCodeForTokens, generatePkce, generateState } from './cognito.js';
import { clearSession, getSession, setLoginUrl, storeTokensFromCognito } from './session.js';

/**
 * Cognito login for the server-side DevPanel session.
 *
 * stdio mode: a loopback listener on 127.0.0.1/::1 hosts the callback so the
 * browser redirect lands back on this machine; tokens never touch the MCP client.
 *
 * http mode: the same handlers are mounted on the public express app
 * (/login → Cognito hosted UI, /callback → token exchange + redirect).
 */

interface Pending {
  state: string;
  codeVerifier: string;
  /** Where to send the browser after a successful login (http mode only). */
  next?: string;
}

let server: Server | null = null;
let ipv6Server: Server | null = null;
let pending: Pending | null = null;

function openBrowser(url: string): void {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) return; // never spawn browsers in tests
  const commands: Record<string, string[]> = {
    linux: ['xdg-open'],
    darwin: ['open'],
    win32: ['cmd', '/c', 'start'],
  };
  const command = commands[process.platform];
  if (!command) return;
  try {
    const [cmd, ...args] = command;
    spawn(cmd, [...args, url], { stdio: 'ignore', detached: true }).unref();
  } catch {
    /* best effort — the URL is always printed too */
  }
}

/**
 * Re-print the login URL while a login attempt is pending so a missed URL
 * (e.g. client tool timeouts) does not strand the login. Stops once a session
 * exists or the attempt is replaced.
 */
function startUrlReprompt(url: string): void {
  const timer = setInterval(() => {
    if (getSession() || !pending) {
      clearInterval(timer);
      return;
    }
    console.error('[sso] Login still pending — open this URL in your browser:');
    console.error('[sso]   ' + url);
  }, config.loginTimeoutMs);
  timer.unref();
}

function send(res: ServerResponse, status: number, contentType: string, body: string, extraHeaders: Record<string, string> = {}): void {
  res.writeHead(status, {
    'content-type': contentType,
    'cache-control': 'no-store',
    'pragma': 'no-cache',
    ...extraHeaders,
  });
  res.end(body);
}

/**
 * GET /login — start the Cognito hosted-UI login.
 * - http mode: 302 to Cognito; `next` survives the round trip so the flow
 *   continues (e.g. back to /authorize after sign-in).
 * - stdio mode: render the login URL page (the loopback listener is normally
 *   only hit by the browser callback, but a direct hit still works).
 */
export async function handleLoginRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const next = url.searchParams.get('next') || undefined;

  clearSession();
  const state = generateState();
  const { verifier, challenge } = generatePkce();
  pending = { state, codeVerifier: verifier, next };
  const loginUrl = buildAuthorizeUrl(state, challenge);
  setLoginUrl(loginUrl);
  console.error('[sso] Sign in to DevPanel required. Open this URL in your browser:');
  console.error('[sso]   ' + loginUrl);

  if (config.transport === 'http') {
    send(res, 302, 'text/plain', 'Redirecting…', { location: loginUrl });
    return;
  }

  openBrowser(loginUrl);
  startUrlReprompt(loginUrl);
  send(
    res,
    200,
    'text/html',
    `<!doctype html><html><head><meta charset="utf-8"></head><body><h2>DevPanel MCP — Sign in</h2>` +
      `<p>If your browser did not open automatically, <a href="${loginUrl}">open this link</a>.</p>` +
      `<p><code>${loginUrl}</code></p></body></html>`,
  );
}

/**
 * GET /callback — Cognito redirect target.
 * Verifies the CSRF state, exchanges the code for tokens, stores the session
 * server-side, then either redirects to `next` (http mode) or shows the
 * "login successful" page (stdio mode).
 */
export async function handleCallbackRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');

  const error = url.searchParams.get('error');
  if (error) {
    const description = url.searchParams.get('error_description') ?? '';
    console.error(`[sso] login failed: ${error}${description ? ` — ${description}` : ''}`);
    send(res, 400, 'text/plain', `Login failed: ${error}${description ? ` — ${description}` : ''}`);
    return;
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state || !pending || state !== pending.state) {
    console.error('[sso] callback rejected: missing or mismatched state (CSRF guard)');
    send(res, 400, 'text/plain', 'Invalid or missing state parameter');
    return;
  }

  try {
    const tokens = await exchangeCodeForTokens(code, pending.codeVerifier);
    const next = pending.next;
    pending = null;
    const session = storeTokensFromCognito(tokens);
    console.error(`[sso] login successful for user ${session.sub}${session.email ? ` (${session.email})` : ''}`);

    if (config.transport === 'http') {
      const redirect = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
      send(res, 302, 'text/plain', 'Login successful — redirecting…', { location: redirect });
      return;
    }

    send(
      res,
      200,
      'text/html',
      '<!doctype html><html><head><meta charset="utf-8"></head><body><h2>DevPanel MCP — Login successful</h2><p>You can close this window and return to your terminal.</p></body></html>',
    );
  } catch (err) {
    console.error('[sso] token exchange failed:', err instanceof Error ? err.message : err);
    send(res, 500, 'text/plain', 'Token exchange failed — see the MCP server logs');
  }
}

function requestHandler(req: IncomingMessage, res: ServerResponse): void {
  const path = req.url?.split('?')[0] ?? '';
  if (path === '/callback') {
    void handleCallbackRequest(req, res);
  } else if (path === '/login') {
    void handleLoginRequest(req, res);
  } else {
    send(res, 404, 'text/plain', 'Not found');
  }
}

/**
 * Start the loopback login listener (stdio mode, idempotent).
 * Binds the same port on both 127.0.0.1 (IPv4) and ::1 (IPv6) so the
 * `localhost` redirect target works on dual-stack machines. Port 0 picks an
 * ephemeral port (tests). Returns the IPv4 server.
 */
export async function startLoginServer(port: number = config.loginCallbackPort): Promise<Server> {
  if (server) return server;
  server = createServer(requestHandler);
  await new Promise<void>((resolve, reject) => {
    server!.listen(port, '127.0.0.1', () => resolve());
    server!.once('error', reject);
  });
  const address = server.address();
  const boundPort = typeof address === 'object' && address ? address.port : port;

  // Best-effort IPv6 companion on the same port (Cognito redirects to localhost,
  // which may resolve to ::1 first).
  try {
    ipv6Server = createServer(requestHandler);
    await new Promise<void>((resolve, reject) => {
      ipv6Server!.listen(boundPort, '::1', () => resolve());
      ipv6Server!.once('error', reject);
    });
  } catch {
    ipv6Server = null; // IPv6 unavailable — IPv4 alone is fine
  }

  console.error(`[sso] login callback listening on http://localhost:${boundPort}/callback`);
  return server;
}

export function getLoginServer(): Server | null {
  return server;
}

/** Print/open the hosted-UI login URL and arm the callback for this attempt (stdio mode). */
export async function beginLogin(): Promise<string> {
  clearSession();
  const state = generateState();
  const { verifier, challenge } = generatePkce();
  pending = { state, codeVerifier: verifier };
  const url = buildAuthorizeUrl(state, challenge);
  setLoginUrl(url);
  console.error('[sso] Sign in to DevPanel required. Open this URL in your browser:');
  console.error('[sso]   ' + url);
  openBrowser(url);
  startUrlReprompt(url);
  return url;
}
