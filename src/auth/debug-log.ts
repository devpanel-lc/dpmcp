import type { Request, RequestHandler, Response, NextFunction } from 'express';
import { config } from '../config.js';
import { getAccessToken, getSession } from './session.js';
import { describeExpiry, tokenLines } from './token-format.js';

/**
 * Bearer-token request logging for local debugging (DP_DEBUG_AUTH=1).
 *
 * Two tokens are in play on every /mcp call and confusing them makes auth
 * failures hard to read:
 *   - the *inbound* MCP bearer the client (opencode et al.) presents, minted by
 *     this server's own OAuth flow (sso mode) or supplied by the caller (token
 *     mode);
 *   - the *forwarded* DevPanel credential this server sends upstream, which in
 *     sso mode is the Cognito access token from the server-side session and is
 *     never seen by the MCP client.
 * Both are printed in full so they can be replayed with curl.
 *
 * SECURITY: these are live credentials in plaintext. The flag is off unless
 * explicitly set, and startHttpServer() warns loudly whenever it is on.
 */

/** The credential this server forwards to DevPanel for the current request. */
function forwardedDevPanelToken(inbound: string | undefined): string | undefined {
  switch (config.authMode) {
    case 'sso':   return getAccessToken();                 // server-side Cognito session
    case 'token': return inbound;                          // bring-your-own-token, forwarded 1:1
    default:      return config.accessToken || undefined;  // off mode: static token
  }
}

/**
 * Logs the *inbound* bearer for every /mcp request.
 *
 * Mounted BEFORE requireBearerAuth so rejected requests are logged too — a 401
 * with no log line is the case you most need to see. The response status is
 * appended on 'finish', once the auth layer has had its say.
 *
 * Only the caller's own token is printed here. The credential this server
 * forwards to DevPanel is deliberately NOT logged at this point: an
 * unauthenticated request reaches this middleware, so doing so would let any
 * anonymous prober force the signed-in human's Cognito token into the log.
 * That one is logged by logMcpForwardedTokenDebug(), behind the auth gate.
 */
export function logMcpAuthDebug(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!config.debugAuth) return next();

    const header = req.headers.authorization ?? '';
    const inbound = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : undefined;
    const lines = [
      `[auth-debug] ${req.method} ${req.originalUrl}`,
      ...tokenLines('mcp bearer  ', inbound),
    ];
    if (!inbound && header) lines.push(`  raw authorization header: ${header}`);
    console.error(lines.join('\n'));

    res.on('finish', () => {
      console.error(`[auth-debug] ${req.method} ${req.originalUrl} -> ${res.statusCode}`);
    });
    next();
  };
}

/**
 * Logs the DevPanel credential this server forwards upstream.
 * Mounted AFTER requireBearerAuth, so it only ever runs for a caller that
 * already presented a valid MCP bearer — an anonymous probe gets its 401
 * without this server's own token being written anywhere.
 */
export function logMcpForwardedTokenDebug(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!config.debugAuth) return next();
    const header = req.headers.authorization ?? '';
    const inbound = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : undefined;
    console.error(tokenLines('devpanel fwd', forwardedDevPanelToken(inbound)).join('\n'));
    next();
  };
}

/**
 * One-line snapshot of the server-side Cognito session for every request.
 *
 * Mounted app-wide rather than on /mcp alone: the session is created on
 * /callback and consumed on /authorize, so watching it across the whole SSO
 * round trip is the point — seeing "(none)" turn into a sub is how you confirm
 * sign-in actually landed. /healthz is registered ahead of this and returns
 * early, so probe traffic stays out of the log.
 *
 * Inert outside sso mode: off/token mode never populates a session, so logging
 * "SSO login required" there would send an operator chasing a sign-in that
 * mode does not have.
 */
export function logSessionDebug(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!config.debugAuth || config.authMode !== 'sso') return next();

    const s = getSession();
    if (!s) {
      console.error(`[session] ${req.method} ${req.originalUrl} -> (none — SSO login required)`);
      return next();
    }
    const detail = [
      `sub=${s.sub}`,
      `email=${s.email ?? '(none)'}`,
      // expiresAt is epoch ms; describeExpiry takes epoch seconds.
      `expires=${describeExpiry(Math.floor(s.expiresAt / 1000))}`,
      // 'no' means this session cannot renew and dies at `expires`. Expected
      // when COGNITO_SCOPES omits offline_access; under a scope set that
      // includes it (the built-in default does), 'no' is a bug worth chasing.
      `refresh=${s.refreshToken ? 'yes' : 'no'}`,
      `idToken=${s.idToken ? 'yes' : 'no'}`,
    ].join(' ');
    console.error(`[session] ${req.method} ${req.originalUrl} -> ${detail}`);
    next();
  };
}

/**
 * Logs which JSON-RPC method/tool a request carries. Separate from
 * logMcpAuthDebug() because it can only run after express.json(), which sits
 * behind the auth layer — so this never fires for a rejected request.
 */
export function logMcpRpcDebug(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!config.debugAuth) return next();
    const body = req.body as { method?: unknown; params?: { name?: unknown } } | undefined;
    if (body && typeof body.method === 'string') {
      const tool = typeof body.params?.name === 'string' ? ` (tool: ${body.params.name})` : '';
      console.error(`[auth-debug]   rpc: ${body.method}${tool}`);
    }
    next();
  };
}

/** Startup banner so an accidentally-enabled flag can't go unnoticed. */
export function warnIfAuthDebugEnabled(): void {
  if (!config.debugAuth) return;
  console.error(
    '[http] WARNING: DP_DEBUG_AUTH is on -- every /mcp request logs its bearer tokens IN FULL. ' +
    'These are live credentials: anyone reading this terminal or a captured log file can replay them. ' +
    'Unset DP_DEBUG_AUTH before running this server anywhere shared.',
  );
}
