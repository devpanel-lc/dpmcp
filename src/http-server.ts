import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { createServer as createSecureServer } from 'node:https';
import { readFileSync } from 'node:fs';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { tokenStorage } from './clients/token-scoped-client.js';
import { config } from './config.js';

function unauthorized(res: ServerResponse): void {
  res.statusCode = 401;
  res.setHeader('content-type', 'text/plain; charset=utf-8');
  res.end('Unauthorized: missing or malformed Authorization header. Expected: Authorization: Bearer <token>');
}

export async function startHttpServer(
  transport: StreamableHTTPServerTransport,
): Promise<Server> {
  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    try {
      if (req.method === 'GET') {
        await transport.handleRequest(req, res);
        return;
      }

      if (req.method === 'DELETE') {
        await transport.handleRequest(req, res);
        return;
      }

      const raw = Array.isArray(req.headers['authorization'])
        ? req.headers['authorization'][0]
        : req.headers['authorization'];
      if (!raw || !raw.startsWith('Bearer ')) {
        return unauthorized(res);
      }
      const token = raw.slice(7).trim();
      if (!token) return unauthorized(res);

      if (!req.headers['content-type']?.startsWith('application/json')) {
        res.statusCode = 415;
        res.setHeader('content-type', 'text/plain; charset=utf-8');
        res.end('Unsupported Media Type: expected application/json');
        return;
      }

      await tokenStorage.run(token, () => transport.handleRequest(req, res));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error('[http] request handler error:', message);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('content-type', 'text/plain; charset=utf-8');
        res.end(`Internal server error: ${message}`);
      }
    }
  };

  let proto: string;
  let httpServer: ReturnType<typeof createServer>;

  if (config.httpTlsEnabled) {
    if (!config.httpCertPath || !config.httpKeyPath) {
      throw new Error('DP_HTTP_TLS_ENABLED=true requires DP_HTTP_CERT_PATH and DP_HTTP_KEY_PATH');
    }
    httpServer = createSecureServer({
      cert: readFileSync(config.httpCertPath),
      key: readFileSync(config.httpKeyPath),
    }, handler);
    proto = 'https';
  } else {
    httpServer = createServer(handler);
    proto = 'http';
    console.error('[http] WARNING: TLS is not enabled. Bearer tokens will be sent in cleartext. Set DP_HTTP_TLS_ENABLED=true for production, or run behind a TLS-terminating reverse proxy.');
  }

  await new Promise<void>((resolve, reject) => {
    httpServer.listen(config.httpPort, config.httpHost, () => {
      console.error(`[http] MCP Streamable HTTP listening at ${proto}://${config.httpHost}:${config.httpPort}`);
      resolve();
    });
    httpServer.once('error', reject);
  });

  const shutdown = () => {
    console.error('[http] shutting down...');
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return httpServer;
}
