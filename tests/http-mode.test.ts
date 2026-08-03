import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer, request as httpRequest, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { config } from '../src/config.js';
import { startHttpServer } from '../src/http-server.js';
import { buildServer } from '../src/server.js';
import { MockDevPanelClient } from '../src/clients/mock-devpanel.js';
import { InMemoryPlanStore } from '../src/stores/plan-store.js';
import { clearSession, saveSession } from '../src/auth/session.js';
import { generatePkce } from '../src/auth/cognito.js';
import type { ChangePlan } from '../src/domain/types.js';

const TEST_SUB = 'c979c90e-9081-7091-a748-b2e15604c2ef';
const TEST_EMAIL = 'lc@devpanel.com';

function makeIdToken(claims: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${header}.${payload}.signature`;
}

function makeSession() {
  return {
    accessToken: 'cognito-access-token',
    idToken: makeIdToken({ sub: TEST_SUB, email: TEST_EMAIL }),
    refreshToken: 'cognito-refresh-token',
    sub: TEST_SUB,
    email: TEST_EMAIL,
    expiresAt: Date.now() + 3600_000,
  };
}

interface TestCtx {
  base: string;
  store: InMemoryPlanStore;
  close: () => Promise<void>;
}

let ctx: TestCtx | null = null;

async function reservePort(): Promise<number> {
  const s = createServer();
  await new Promise<void>((resolve) => s.listen(0, '127.0.0.1', () => resolve()));
  const port = (s.address() as AddressInfo).port;
  await new Promise<void>((resolve) => s.close(() => resolve()));
  return port;
}

async function startApp(): Promise<TestCtx> {
  const store = new InMemoryPlanStore();
  const port = await reservePort();
  config.httpPort = port;
  config.publicBaseUrl = `http://127.0.0.1:${port}`;
  config.approvalPublicBaseUrl = config.publicBaseUrl;
  const mcpServer = buildServer(new MockDevPanelClient(), store);
  const server = await startHttpServer(mcpServer, store);
  return {
    base: config.publicBaseUrl,
    store,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

function rawGet(port: number, path: string, host: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = httpRequest({ host: '127.0.0.1', port, path, headers: { host } }, (res) => {
      let body = '';
      res.on('data', (c) => (body += String(c)));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function registerClient(base: string): Promise<string> {
  const res = await fetch(`${base}/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      redirect_uris: ['http://127.0.0.1:9999/callback'],
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      client_name: 'test-client',
    }),
  });
  expect(res.status).toBe(201);
  const client = (await res.json()) as { client_id: string };
  return client.client_id;
}

async function authorizeAndConsent(base: string, clientId: string): Promise<{ code: string; verifier: string }> {
  const { verifier, challenge } = generatePkce();
  const authorize = (session: boolean) =>
    fetch(
      `${base}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent('http://127.0.0.1:9999/callback')}` +
        `&code_challenge=${challenge}&code_challenge_method=S256&state=s1`,
      { redirect: 'manual' },
    );

  // No DevPanel session yet → /login first.
  const loginRedirect = await authorize(false);
  expect(loginRedirect.status).toBe(302);
  const location = loginRedirect.headers.get('location') ?? '';
  expect(location).toMatch(/^\/login\?next=/);
  expect(decodeURIComponent(location)).toContain('/authorize?');

  // Sign in server-side, then authorize again → consent page.
  saveSession(makeSession());
  const consent = await authorize(true);
  expect(consent.status).toBe(200);
  const html = await consent.text();
  expect(html).toContain('Approve');
  const tokenMatch = html.match(/name="token" value="([^"]+)"/);
  expect(tokenMatch).not.toBeNull();
  const consentToken = tokenMatch![1];

  // Approve → redirect to client callback with code + state.
  const approved = await fetch(`${base}/authorize/consent`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token: consentToken, decision: 'approve' }).toString(),
    redirect: 'manual',
  });
  expect(approved.status).toBe(302);
  const callbackUrl = new URL(approved.headers.get('location') ?? '');
  expect(callbackUrl.hostname).toBe('127.0.0.1');
  expect(callbackUrl.searchParams.get('state')).toBe('s1');
  const code = callbackUrl.searchParams.get('code');
  expect(code).toBeTruthy();
  return { code: code!, verifier };
}

async function exchangeCode(base: string, clientId: string, code: string, verifier: string): Promise<{ access: string; refresh: string }> {
  const res = await fetch(`${base}/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      code_verifier: verifier,
      redirect_uri: 'http://127.0.0.1:9999/callback',
      client_id: clientId,
    }).toString(),
  });
  expect(res.status).toBe(200);
  const tokens = (await res.json()) as { access_token: string; refresh_token: string };
  expect(tokens.access_token).toBeTruthy();
  expect(tokens.refresh_token).toBeTruthy();
  return { access: tokens.access_token, refresh: tokens.refresh_token };
}

beforeEach(() => {
  config.mode = 'mock';
  config.transport = 'http';
  config.approvalMode = 'auto';
  config.cognito.clientId = 'test-cognito-client';
  config.cognito.domain = 'http://cognito.test';
  config.cognito.clientSecret = '';
  clearSession();
});

afterEach(async () => {
  if (ctx) {
    await ctx.close();
    ctx = null;
  }
  config.transport = 'stdio';
  config.publicBaseUrl = '';
  config.approvalPublicBaseUrl = 'http://127.0.0.1:8787';
  config.httpPort = 3000;
  clearSession();
});

describe('http transport server', () => {
  it('serves /healthz and rejects unknown Host headers', async () => {
    ctx = await startApp();
    const res = await fetch(`${ctx.base}/healthz`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('ok');

    const port = config.httpPort;
    const evil = await rawGet(port, '/healthz', 'evil.example');
    expect(evil.status).toBe(421);
    const allowed = await rawGet(port, '/healthz', '127.0.0.1');
    expect(allowed.status).toBe(200);
  });

  it('protects /mcp with bearer auth and advertises the resource metadata URL', async () => {
    ctx = await startApp();
    const res = await fetch(`${ctx.base}/mcp`, { method: 'POST', body: '{}' });
    expect(res.status).toBe(401);
    expect(res.headers.get('www-authenticate')).toContain('Bearer');
    expect(res.headers.get('www-authenticate')).toContain('/.well-known/oauth-protected-resource/mcp');
  });

  it('redirects /login to the Cognito hosted UI', async () => {
    ctx = await startApp();
    const res = await fetch(`${ctx.base}/login`, { redirect: 'manual' });
    expect(res.status).toBe(302);
    const location = res.headers.get('location') ?? '';
    expect(location).toContain('cognito.test/oauth2/authorize');
    expect(location).toContain('response_type=code');
  });

  it('runs the full MCP OAuth flow: register → authorize → consent → token', async () => {
    ctx = await startApp();
    const clientId = await registerClient(ctx.base);
    const { code, verifier } = await authorizeAndConsent(ctx.base, clientId);
    const tokens = await exchangeCode(ctx.base, clientId, code, verifier);
    expect(tokens.access.length).toBeGreaterThan(20);

    // Token is now valid for /mcp (401 → missing initialize, not 401).
    const res = await fetch(`${ctx.base}/mcp`, {
      method: 'POST',
      headers: { authorization: `Bearer ${tokens.access}`, 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'nope' }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects a code with the wrong PKCE verifier', async () => {
    ctx = await startApp();
    const clientId = await registerClient(ctx.base);
    const { code } = await authorizeAndConsent(ctx.base, clientId);
    const res = await fetch(`${ctx.base}/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code', code,
        code_verifier: 'definitely-wrong', redirect_uri: 'http://127.0.0.1:9999/callback', client_id: clientId,
      }).toString(),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('invalid_grant');
  });

  it('rotates tokens on refresh and revokes on /revoke', async () => {
    const c = await startApp();
    ctx = c;
    const clientId = await registerClient(c.base);
    const { code, verifier } = await authorizeAndConsent(c.base, clientId);
    const first = await exchangeCode(c.base, clientId, code, verifier);

    // Refresh → old access token dies, new pair issued.
    const refreshRes = await fetch(`${ctx.base}/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token', refresh_token: first.refresh, client_id: clientId,
      }).toString(),
    });
    expect(refreshRes.status).toBe(200);
    const rotated = (await refreshRes.json()) as { access_token: string; refresh_token: string };
    expect(rotated.access_token).not.toBe(first.access);

    const withToken = (token: string) =>
      fetch(`${c.base}/mcp`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'nope' }),
      });
    expect((await withToken(first.access)).status).toBe(401); // rotated away
    expect((await withToken(rotated.access_token)).status).toBe(400); // valid token, bad request

    // Revoke the fresh token → 401 again.
    const revoke = await fetch(`${c.base}/revoke`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token: rotated.access_token, token_type_hint: 'access_token', client_id: clientId,
      }).toString(),
    });
    expect(revoke.status).toBe(200);
    expect((await withToken(rotated.access_token)).status).toBe(401);
  });

  it('falls back to the external review URL when approval is requested over http', async () => {
    const c = await startApp();
    ctx = c;
    const clientId = await registerClient(c.base);
    const { code, verifier } = await authorizeAndConsent(c.base, clientId);
    const tokens = await exchangeCode(c.base, clientId, code, verifier);

    const mcp = async (sessionId: string | null, payload: Record<string, unknown>) => {
      const headers: Record<string, string> = {
        authorization: `Bearer ${tokens.access}`,
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      };
      if (sessionId) headers['mcp-session-id'] = sessionId;
      const res = await fetch(`${c.base}/mcp`, { method: 'POST', headers, body: JSON.stringify(payload) });
      const raw = await res.text();
      let body: Record<string, unknown>;
      if (res.headers.get('content-type')?.includes('text/event-stream')) {
        // SSE: events separated by blank lines; last `data:` line carries the JSON-RPC message.
        const dataLine = raw
          .split('\n\n')
          .map(e => e.split('\n').find(l => l.startsWith('data:')))
          .filter(Boolean)
          .at(-1);
        body = JSON.parse((dataLine ?? '').slice(5)) as Record<string, unknown>;
      } else {
        body = JSON.parse(raw) as Record<string, unknown>;
      }
      return { status: res.status, sessionId: res.headers.get('mcp-session-id'), body };
    };

    const init = await mcp(null, {
      jsonrpc: '2.0', id: 1, method: 'initialize',
      params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } },
    });
    expect(init.status).toBe(200);
    expect(init.sessionId).toBeTruthy();

    const created = await mcp(init.sessionId, {
      jsonrpc: '2.0', id: 2, method: 'tools/call',
      params: {
        name: 'devpanel_plan_create_application',
        arguments: { name: 'demo', repositoryOwner: 'acme', repositoryName: 'demo-repo', projectType: 'drupal11_v2' },
      },
    });
    expect(created.status).toBe(200);
    const createdText = JSON.parse(
      ((created.body as { result: { content: Array<{ text: string }> } }).result.content[0].text),
    ) as { plan: { id: string } };
    expect(createdText.plan.id).toBeTruthy();

    // Approval: native elicitation is unsupported over http → external review URL.
    const approved = await mcp(init.sessionId, {
      jsonrpc: '2.0', id: 3, method: 'tools/call',
      params: { name: 'devpanel_approve_and_execute_plan', arguments: { planId: createdText.plan.id } },
    });
    const approveText = JSON.parse(
      ((approved.body as { result: { content: Array<{ text: string }> } }).result.content[0].text),
    ) as { state: string; approval_url: string };
    expect(approveText.state).toBe('APPROVAL_REQUIRED');
    expect(approveText.approval_url).toBe(`${ctx.base}/review/${createdText.plan.id}`);
  });

  it('serves the external review UI and records approval', async () => {
    ctx = await startApp();
    const plan: ChangePlan = {
      id: 'plan-review-1',
      version: 1,
      action: 'BACKUP_APPLICATION',
      status: 'READY_FOR_REVIEW',
      risk: 'LOW',
      summary: 'Backup the demo app',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      hash: 'hash-abc',
      ownerId: 'local',
      target: { applicationName: 'demo' },
      proposedInput: {},
      steps: [{ order: 1, operation: 'createBackup', description: 'Create a manual backup', mutates: true }],
      preconditions: {},
      expectedResult: 'Backup created',
      rollback: 'Delete the backup',
    };
    await ctx.store.save(plan);

    const page = await fetch(`${ctx.base}/review/plan-review-1`);
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain('Backup the demo app');
    expect(html).toContain('Approve exact plan');

    const post = await fetch(`${ctx.base}/review/plan-review-1`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'decision=approve',
    });
    expect(post.status).toBe(200);
    expect(await post.text()).toContain('Approved');
    expect((await ctx.store.get(plan.id))?.approval?.decision).toBe('APPROVE');

    const missing = await fetch(`${ctx.base}/review/does-not-exist`);
    expect(missing.status).toBe(404);
  });
});
