import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import express, { type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  getOAuthProtectedResourceMetadataUrl,
  mcpAuthRouter,
} from '@modelcontextprotocol/sdk/server/auth/router.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import { config } from './config.js';
import type { DevPanelClientFactory } from './clients/devpanel.js';
import { buildServer } from './server.js';
import type { PlanStore } from './stores/plan-store.js';
import { McpOAuthProvider } from './auth/mcp-oauth.js';
import { handleCallbackRequest, handleLoginRequest } from './auth/login-server.js';
import { createReviewHandler } from './approval/review-server.js';

/**
 * Public HTTP server (http transport).
 *
 * Routes:
 *   /healthz                        → liveness probe
 *   /.well-known/…, /register, /authorize, /token, /revoke → MCP OAuth endpoints
 *   /authorize/consent              → consent page POST
 *   /login, /callback               → server-side Cognito login for the DevPanel session
 *   /mcp                            → MCP endpoint, protected by MCP OAuth bearer tokens
 *   /review/:planId                 → external plan review/approval UI
 *
 * The MCP client authenticates with its own OAuth token for /mcp. The Cognito
 * access token never leaves the server process.
 */

/** Reject requests whose Host header is not in the allowlist (anti DNS-rebinding). */
function hostGuard(): RequestHandler {
  const allowed = new Set(
    config.allowedHosts
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean),
  );
  return (req: Request, res: Response, next: NextFunction) => {
    const host = req.headers.host;
    if (!host) {
      res.status(400).type('text/plain').send('Missing Host header');
      return;
    }
    let hostname: string;
    try {
      hostname = new URL(`http://${host}`).hostname.toLowerCase();
    } catch {
      hostname = host.split(':')[0].toLowerCase();
    }
    if (!allowed.has(hostname)) {
      res.status(421).type('text/plain').send('Host not allowed');
      return;
    }
    next();
  };
}

/**
 * Print which env var is guarding /mcp's static bearer auth (and a
 * non-secret fingerprint of it) so a token mismatch is diagnosable from the
 * startup log alone instead of reading source. Reads config.mcpBearerTokenSource,
 * the single computed source of truth for the DP_MCP_BEARER_TOKEN / DP_ACCESS_TOKEN
 * fallback rule.
 */
function logStaticBearerSource(): void {
  if (config.authMode === 'sso') {
    console.error('[http] /mcp static bearer: disabled (DP_AUTH_MODE=sso) — only OAuth-issued tokens accepted');
    return;
  }
  if (config.authMode === 'token') {
    console.error('[http] /mcp static bearer: disabled (DP_AUTH_MODE=token) — any bearer is accepted and forwarded to DevPanel as-is; DevPanel rejects invalid ones');
    return;
  }
  const fingerprint = (token: string) => `…${token.slice(-6)}`;
  switch (config.mcpBearerTokenSource) {
    case 'DP_MCP_BEARER_TOKEN':
      console.error(`[http] /mcp static bearer: DP_MCP_BEARER_TOKEN (${fingerprint(config.mcpBearerToken)})`);
      break;
    case 'DP_ACCESS_TOKEN':
      console.error(`[http] /mcp static bearer: DP_ACCESS_TOKEN fallback (${fingerprint(config.mcpBearerToken)}) — set DP_MCP_BEARER_TOKEN to use a separate token`);
      break;
    default:
      console.error('[http] /mcp static bearer: none (DP_MCP_BEARER_TOKEN/DP_ACCESS_TOKEN both empty) — only OAuth-issued tokens accepted');
  }
}

function isInitializeRequest(body: unknown): boolean {
  return typeof body === 'object' && body !== null && (body as { method?: unknown }).method === 'initialize';
}

/**
 * /mcp request handling with in-memory stateful sessions:
 * the first request must be `initialize` (creates the session + transport),
 * subsequent requests carry the mcp-session-id header.
 */
function handleMcpRequest(dpFactory: DevPanelClientFactory, store: PlanStore): RequestHandler {
  const sessions = new Map<string, StreamableHTTPServerTransport>();
  // dpFactory(token) only actually varies by token in 'token' auth mode (each
  // session forwards its own DevPanel bearer); every other mode ignores the
  // argument and returns the same cached client. Build one shared McpServer
  // up front and reuse it across sessions there, instead of paying the full
  // registerTools() cost (~25 tool registrations) on every new session.
  const sharedServer = config.authMode === 'token' ? undefined : buildServer(dpFactory(), store);
  return async (req: Request, res: Response) => {
    const headerValue = req.headers['mcp-session-id'];
    const sessionId = typeof headerValue === 'string' && headerValue.length > 0 ? headerValue : undefined;
    const initialize = isInitializeRequest(req.body);
    let transport = sessionId ? sessions.get(sessionId) : undefined;

    try {
      if (!transport) {
        if (!initialize) {
          res.status(sessionId ? 404 : 400).json({
            jsonrpc: '2.0',
            error: { code: -32000, message: sessionId ? 'Unknown MCP session' : 'Missing MCP session — call initialize first' },
            id: null,
          });
          return;
        }
        let initializedSessionId: string | undefined;
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => {
            initializedSessionId = id;
            sessions.set(id, transport!);
          },
        });
        transport.onclose = () => {
          if (initializedSessionId) sessions.delete(initializedSessionId);
        };
        // req.auth is set by requireBearerAuth ahead of this handler; in
        // 'token' mode its .token IS the caller's own DevPanel credential.
        const srv = buildServer(dpFactory(req.auth?.token), store);
        await srv.connect(transport);
      }

      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error('[mcp] error handling request:', err);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: err instanceof Error ? err.message : String(err) },
          id: null,
        });
      }
    }
  };
}

export async function startHttpServer(dpFactory: DevPanelClientFactory, store: PlanStore): Promise<Server> {
  if (!config.publicBaseUrl) {
    throw new Error('DP_PUBLIC_BASE_URL is required in http transport mode (e.g. https://dpmcp.up.railway.app)');
  }
  const baseUrl = new URL(config.publicBaseUrl);
  const mcpUrl = new URL(`${config.publicBaseUrl}/mcp`);
  const provider = new McpOAuthProvider(config.mcpBearerToken || undefined);
  logStaticBearerSource();
  const app = express();
  app.disable('x-powered-by');

  app.use(hostGuard());

  app.get('/healthz', (_req, res) => {
    res.setHeader('cache-control', 'no-store');
    res.status(200).type('text/plain').send('ok');
  });

  // MCP OAuth authorization server (metadata, dynamic registration, authorize, token, revoke).
  app.use(
    mcpAuthRouter({
      provider,
      issuerUrl: baseUrl,
      baseUrl,
      resourceServerUrl: mcpUrl,
      resourceName: 'DevPanel Application MCP',
      scopesSupported: [],
    }),
  );

  // Consent page POST from the MCP OAuth flow.
  app.post('/authorize/consent', express.urlencoded({ extended: false }), (req, res) => {
    void provider.handleConsentRequest(req, res);
  });

  // Server-side Cognito login for the DevPanel session.
  app.get('/login', (req, res) => {
    void handleLoginRequest(req, res);
  });
  app.get('/callback', (req, res) => {
    void handleCallbackRequest(req, res);
  });

  // MCP endpoint — protected by MCP OAuth bearer tokens.
  app.use(
    '/mcp',
    requireBearerAuth({
      verifier: provider,
      resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(mcpUrl),
    }),
  );
  app.post('/mcp', express.json({ limit: '4mb' }), handleMcpRequest(dpFactory, store));
  app.get('/mcp', handleMcpRequest(dpFactory, store));
  app.delete('/mcp', handleMcpRequest(dpFactory, store));

  // External review UI (last: everything else 404s through its handler).
  app.use((req, res) => {
    void createReviewHandler(store)(req, res);
  });

  const server = await new Promise<Server>((resolve, reject) => {
    const s = app.listen(config.httpPort, '0.0.0.0', () => resolve(s));
    s.once('error', reject);
  });

  console.error(`[http] MCP endpoint: ${config.publicBaseUrl}/mcp (MCP OAuth)`);
  console.error(`[http] login: ${config.publicBaseUrl}/login`);
  console.error(`[http] listening on 0.0.0.0:${config.httpPort}`);
  return server;
}
