import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { request as httpRequest } from 'node:http';
import type { Server, IncomingMessage, ServerResponse } from 'node:http';
import { startHttpServer } from '../src/http-server.js';
import { config } from '../src/config.js';

function mockTransport() {
  let handleRequest = vi.fn().mockImplementation(
    async (_req: IncomingMessage, res: ServerResponse) => {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true }));
    },
  );
  return { handleRequest };
}

function fetch(
  server: Server,
  method: string,
  headers: Record<string, string>,
  body?: string,
): Promise<{ status: number; body: string }> {
  const addr = server.address()!;
  const port = typeof addr === 'string' ? 0 : addr.port;
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      { hostname: '127.0.0.1', port, path: '/', method, headers },
      (res) => {
        let data = '';
        res.on('data', (c: Buffer) => (data += c.toString()));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }));
      },
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

describe('http-server auth and routing', () => {
  let transport: ReturnType<typeof mockTransport>;
  let server: Server;

  beforeEach(async () => {
    transport = mockTransport();
    const orig = config.httpPort;
    config.httpPort = 0;
    server = await startHttpServer(transport as never);
    config.httpPort = orig;
  });

  afterEach(() => {
    server.close();
  });

  it('GET passes through without Bearer token', async () => {
    const res = await fetch(server, 'GET', { accept: 'text/event-stream' });
    expect(res.status).toBe(200);
    expect(transport.handleRequest).toHaveBeenCalledTimes(1);
  });

  it('DELETE passes through without Bearer token', async () => {
    const res = await fetch(server, 'DELETE', {});
    expect(res.status).toBe(200);
    expect(transport.handleRequest).toHaveBeenCalledTimes(1);
  });

  it('POST without Bearer returns 401', async () => {
    const res = await fetch(server, 'POST', { 'content-type': 'application/json' }, '{}');
    expect(res.status).toBe(401);
    expect(transport.handleRequest).not.toHaveBeenCalled();
  });

  it('POST with empty Bearer returns 401', async () => {
    const res = await fetch(
      server, 'POST',
      { authorization: 'Bearer ', 'content-type': 'application/json' },
      '{}',
    );
    expect(res.status).toBe(401);
    expect(transport.handleRequest).not.toHaveBeenCalled();
  });

  it('POST with non-Bearer Authorization returns 401', async () => {
    const res = await fetch(
      server, 'POST',
      { authorization: 'Basic dG9rZW46', 'content-type': 'application/json' },
      '{}',
    );
    expect(res.status).toBe(401);
    expect(transport.handleRequest).not.toHaveBeenCalled();
  });

  it('POST without application/json returns 415', async () => {
    const res = await fetch(
      server, 'POST',
      { authorization: 'Bearer test-token' },
      '{}',
    );
    expect(res.status).toBe(415);
    expect(transport.handleRequest).not.toHaveBeenCalled();
  });

  it('POST with Bearer and application/json passes through', async () => {
    const body = JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', id: 1 });
    const res = await fetch(
      server, 'POST',
      { authorization: 'Bearer test-token', 'content-type': 'application/json' },
      body,
    );
    expect(res.status).toBe(200);
    expect(transport.handleRequest).toHaveBeenCalledTimes(1);
  });

  it('POST with Bearer token propagates to AsyncLocalStorage', async () => {
    transport.handleRequest = vi.fn().mockImplementation(
      async (req: IncomingMessage, res: ServerResponse) => {
        const { currentOwnerId } = await import('../src/clients/token-scoped-client.js');
        const ownerId = currentOwnerId();
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ownerId }));
      },
    );

    const res = await fetch(
      server, 'POST',
      { authorization: 'Bearer my-secret-token', 'content-type': 'application/json' },
      '{}',
    );
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.ownerId).toMatch(/^[a-f0-9]{64}$/);
    expect(body.ownerId).not.toBe('local');
  });
});
