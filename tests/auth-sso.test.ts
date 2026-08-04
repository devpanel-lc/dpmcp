import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { createHash } from 'node:crypto';
import { createServer, type IncomingHttpHeaders } from 'node:http';
import type { AddressInfo } from 'node:net';
import { config } from '../src/config.js';
import {
  buildAuthorizeUrl, buildState, decodeIdToken, decodeState, exchangeCodeForTokens, generatePkce, refreshTokens,
} from '../src/auth/cognito.js';
import {
  clearSession, ensureFresh, getAccessToken, getLoginUrl, getOwnerId, getSession, refreshNow,
  saveSession, storeTokensFromCognito,
} from '../src/auth/session.js';
import { beginLogin, getLoginServer, startLoginServer } from '../src/auth/login-server.js';
import { RealDevPanelClient } from '../src/clients/real-devpanel.js';
import { TokenScopedDevPanelClient } from '../src/clients/token-scoped-client.js';

const TEST_SUB = 'c979c90e-9081-7091-a748-b2e15604c2ef';
const TEST_EMAIL = 'lc@devpanel.com';

function makeIdToken(claims: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${header}.${payload}.signature`;
}

function makeTokens(overrides: Record<string, unknown> = {}) {
  return {
    access_token: 'access-token-001',
    id_token: makeIdToken({ sub: TEST_SUB, email: TEST_EMAIL, exp: Math.floor(Date.now() / 1000) + 3600 }),
    refresh_token: 'refresh-token-001',
    expires_in: 3600,
    token_type: 'Bearer',
    ...overrides,
  };
}

function makeSession(overrides: Partial<Parameters<typeof saveSession>[0]> = {}) {
  return {
    accessToken: 'access-token-001',
    idToken: makeIdToken({ sub: TEST_SUB, email: TEST_EMAIL }),
    refreshToken: 'refresh-token-001',
    sub: TEST_SUB,
    email: TEST_EMAIL,
    expiresAt: Date.now() + 60_000,
    ...overrides,
  };
}

interface FetchCall { url: string; init?: RequestInit }

function stubFetch(handler: (call: FetchCall) => { ok: boolean; status?: number; text: () => Promise<string> }) {
  const fn = vi.fn(async (url: unknown, init?: RequestInit) => {
    const result = handler({ url: String(url), init });
    return {
      ok: result.ok,
      status: result.status ?? (result.ok ? 200 : 401),
      text: result.text,
    };
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

beforeEach(() => {
  config.cognito.clientId = 'test-client-id';
  config.cognito.domain = 'http://cognito.test';
  config.cognito.clientSecret = '';
  clearSession();
});

afterEach(() => {
  vi.unstubAllGlobals();
  clearSession();
});

describe('cognito authorize URL and PKCE', () => {
  it('builds a hosted-UI login URL with PKCE, identity_provider, state and DevPanel scopes', () => {
    const url = new URL(buildAuthorizeUrl('state-abc', 'challenge-xyz'));
    expect(url.origin + url.pathname).toBe(`${config.cognito.domain}/login`);
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBe(config.cognito.clientId);
    expect(url.searchParams.get('redirect_uri')).toBe(config.cognito.redirectUri);
    expect(url.searchParams.get('identity_provider')).toBe('COGNITO');
    expect(url.searchParams.get('scope')).toContain('phone');
    expect(url.searchParams.get('scope')).toContain('offline_access');
    expect(url.searchParams.get('state')).toBe('state-abc');
    expect(url.searchParams.get('code_challenge')).toBe('challenge-xyz');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  });

  it('generates a verifier whose S256 hash matches the challenge', () => {
    const { verifier, challenge } = generatePkce();
    expect(createHash('sha256').update(verifier).digest('base64url')).toBe(challenge);
  });

  it('buildState encodes the return URL; decodeState round-trips it through a URL', () => {
    const returnUrl = 'http://localhost:3100/review/plan-1';
    const state = buildState(returnUrl);
    expect(state).not.toContain(returnUrl);
    // Round-trip through URLSearchParams (form-URL decoding turns + into spaces).
    const parsed = new URLSearchParams(new URLSearchParams({ state }).toString()).get('state')!;
    expect(decodeState(parsed)).toBe(returnUrl);
  });

  it('decodeState restores + characters lost to form-URL decoding', () => {
    const state = Buffer.from([0xFF, 0xE0, 0x00]).toString('base64'); // "/+AA" — contains '+'
    expect(state).toContain('+');
    expect(decodeState(state.replace(/\+/g, ' '))).toBe(Buffer.from([0xFF, 0xE0, 0x00]).toString('utf8'));
  });

  it('decodes sub/email/exp from an id_token', () => {
    const claims = decodeIdToken(makeIdToken({ sub: TEST_SUB, email: TEST_EMAIL, exp: 1234567890 }));
    expect(claims.sub).toBe(TEST_SUB);
    expect(claims.email).toBe(TEST_EMAIL);
    expect(claims.exp).toBe(1234567890);
  });

  it('rejects a malformed id_token', () => {
    expect(() => decodeIdToken('not-a-jwt')).toThrow('Malformed id_token');
    expect(() => decodeIdToken(`${'a'.repeat(10)}.${'b'.repeat(10)}`)).toThrow('Malformed id_token');
  });
});

describe('token endpoint auth', () => {
  it('public client sends client_id in the form body and no Authorization header', async () => {
    const fetchMock = stubFetch(() => ({ ok: true, text: async () => JSON.stringify(makeTokens()) }));
    config.cognito.clientSecret = '';
    await exchangeCodeForTokens('the-code', 'the-verifier');
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const body = new URLSearchParams(init.body as string);
    expect(fetchMock.mock.calls[0][0]).toBe(`${config.cognito.domain}/oauth2/token`);
    expect(init.method).toBe('POST');
    expect(init.headers).not.toHaveProperty('authorization');
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('code')).toBe('the-code');
    expect(body.get('redirect_uri')).toBe(config.cognito.redirectUri);
    expect(body.get('code_verifier')).toBe('the-verifier');
    expect(body.get('client_id')).toBe(config.cognito.clientId);
  });

  it('confidential client uses Basic auth and omits client_id from the body', async () => {
    const fetchMock = stubFetch(() => ({ ok: true, text: async () => JSON.stringify(makeTokens()) }));
    config.cognito.clientSecret = 'super-secret';
    await exchangeCodeForTokens('the-code', 'the-verifier');
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const body = new URLSearchParams(init.body as string);
    const headers = init.headers as Record<string, string>;
    expect(headers.authorization).toBe(`Basic ${Buffer.from(`${config.cognito.clientId}:super-secret`).toString('base64')}`);
    expect(body.get('client_id')).toBeNull();
  });

  it('refresh grant posts grant_type=refresh_token', async () => {
    const fetchMock = stubFetch(() => ({ ok: true, text: async () => JSON.stringify(makeTokens()) }));
    config.cognito.clientSecret = '';
    await refreshTokens('refresh-token-abc');
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const body = new URLSearchParams(init.body as string);
    expect(body.get('grant_type')).toBe('refresh_token');
    expect(body.get('refresh_token')).toBe('refresh-token-abc');
  });

  it('throws a descriptive error on a non-OK token response', async () => {
    stubFetch(() => ({ ok: false, status: 400, text: async () => JSON.stringify({ error: 'invalid_grant', error_description: 'expired code' }) }));
    await expect(exchangeCodeForTokens('bad-code', 'v')).rejects.toThrow('expired code');
  });
});

describe('session store', () => {
  it('holds the session in memory and derives identity from the id_token', () => {
    stubFetch(() => ({ ok: true, text: async () => JSON.stringify(makeTokens()) }));
    const session = storeTokensFromCognito(makeTokens());
    expect(session.sub).toBe(TEST_SUB);
    expect(session.email).toBe(TEST_EMAIL);
    expect(session.accessToken).toBe('access-token-001');
    expect(session.refreshToken).toBe('refresh-token-001');
    expect(session.expiresAt).toBeGreaterThan(Date.now());
    expect(session.expiresAt).toBeLessThanOrEqual(Date.now() + 3600 * 1000);

    expect(getOwnerId()).toBe(TEST_SUB);
    expect(getAccessToken()).toBe('access-token-001');
    expect(getSession()?.email).toBe(TEST_EMAIL);
  });

  it('refreshNow renews an expired access token', async () => {
    saveSession(makeSession({ accessToken: 'old-access', expiresAt: Date.now() - 1000 }));
    const fetchMock = stubFetch((call) => {
      if (call.url.includes('/oauth2/token')) {
        return { ok: true, text: async () => JSON.stringify(makeTokens({ access_token: 'fresh-access', refresh_token: 'refresh-rt' })) };
      }
      return { ok: false, status: 500, text: async () => 'unexpected' };
    });
    expect(await refreshNow()).toBe(true);
    const body = new URLSearchParams((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.get('grant_type')).toBe('refresh_token');
    expect(body.get('refresh_token')).toBe('refresh-token-001');
    expect(getAccessToken()).toBe('fresh-access');
  });

  it('refreshNow with force=true refreshes an unexpired token', async () => {
    saveSession(makeSession({ accessToken: 'old-access', expiresAt: Date.now() + 60_000 }));
    stubFetch((call) => {
      if (call.url.includes('/oauth2/token')) {
        return { ok: true, text: async () => JSON.stringify(makeTokens({ access_token: 'fresh-access', refresh_token: 'refresh-rt' })) };
      }
      return { ok: false, status: 500, text: async () => 'unexpected' };
    });
    expect(await refreshNow(true)).toBe(true);
    expect(getAccessToken()).toBe('fresh-access');
  });

  it('refreshNow clears the session when refresh fails', async () => {
    saveSession(makeSession({ accessToken: 'old-access', expiresAt: Date.now() - 1000 }));
    stubFetch(() => ({ ok: false, status: 400, text: async () => JSON.stringify({ error: 'invalid_grant' }) }));
    expect(await refreshNow()).toBe(false);
    expect(getSession()).toBeNull();
  });

  it('clearSession drops the session', () => {
    saveSession(makeSession());
    expect(getSession()).not.toBeNull();
    clearSession();
    expect(getSession()).toBeNull();
  });

  it('ensureFresh is a no-op while the token has more than 60s of life', async () => {
    saveSession(makeSession({ expiresAt: Date.now() + 120_000 }));
    const fetchMock = stubFetch(() => ({ ok: true, text: async () => JSON.stringify(makeTokens()) }));
    expect(await ensureFresh()).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('login callback server', () => {
  let cognitoMock: { url: string; close: () => Promise<void>; requests: Array<{ url: string; headers: IncomingHttpHeaders; body: string }> };

  beforeAll(async () => {
    const requests: Array<{ url: string; headers: IncomingHttpHeaders; body: string }> = [];
    const server = createServer(async (req, res) => {
      let body = '';
      for await (const chunk of req) body += String(chunk);
      requests.push({ url: req.url ?? '', headers: req.headers, body });
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(makeTokens()));
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const port = (server.address() as AddressInfo).port;
    cognitoMock = {
      url: `http://127.0.0.1:${port}`,
      close: () => new Promise<void>((resolve) => server.close(() => resolve())),
      requests,
    };
  });

  afterAll(async () => {
    await cognitoMock.close();
  });

  beforeEach(() => {
    config.cognito.domain = cognitoMock.url;
  });

  it('startLoginServer binds to 127.0.0.1', async () => {
    const server = await startLoginServer(0);
    const addr = server.address();
    expect(typeof addr).toBe('object');
    expect((addr as AddressInfo).address).toBe('127.0.0.1');
  });

  it('also binds ::1 when IPv6 is available', async () => {
    const server = await startLoginServer(0);
    const port = (server.address() as AddressInfo).port;
    const v6 = await fetch(`http://[::1]:${port}/callback?error=access_denied`).catch(() => null);
    if (v6) expect(v6.status).toBe(400);
  });

  it('GET /login on the loopback listener renders the sign-in page and arms an attempt', async () => {
    await startLoginServer(0);
    clearSession();
    const port = (getLoginServer()!.address() as AddressInfo).port;
    const res = await fetch(`http://127.0.0.1:${port}/login`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('Sign in');
    expect(getLoginUrl()).toContain(`${config.cognito.domain}/login?`);
    expect(getLoginUrl()).toContain('identity_provider=COGNITO');
    expect(getLoginUrl()).toContain('state=');
    expect(getLoginUrl()).toContain('redirect_uri=');
  });

  it('callback with matching state stores the session and returns no-store', async () => {
    await startLoginServer(0);
    await beginLogin();
    const state = new URL(getLoginUrl()).searchParams.get('state')!;
    expect(state).toBeTruthy();
    const port = (getLoginServer()!.address() as AddressInfo).port;
    const res = await fetch(`http://127.0.0.1:${port}/callback?code=login-code&state=${state}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = await res.text();
    expect(body).toContain('Login successful');
    expect(getSession()?.sub).toBe(TEST_SUB);
    expect(getSession()?.accessToken).toBe('access-token-001');
    // Token exchange hit the real mock Cognito endpoint with the auth code grant.
    expect(cognitoMock.requests.some((r) => r.body.includes('grant_type=authorization_code'))).toBe(true);
  });

  it('callback with mismatched state returns 400 and stores nothing', async () => {
    await startLoginServer(0);
    await beginLogin();
    const port = (getLoginServer()!.address() as AddressInfo).port;
    const res = await fetch(`http://127.0.0.1:${port}/callback?code=login-code&state=wrong-state`);
    expect(res.status).toBe(400);
    expect(await res.text()).toContain('state');
    expect(getSession()).toBeNull();
  });

  it('callback with an error query returns 400', async () => {
    await startLoginServer(0);
    const port = (getLoginServer()!.address() as AddressInfo).port;
    const res = await fetch(`http://127.0.0.1:${port}/callback?error=access_denied&error_description=user+denied`);
    expect(res.status).toBe(400);
    expect(await res.text()).toContain('user denied');
  });
});

describe('DevPanel upstream auth', () => {
  beforeEach(() => {
    config.cognito.domain = 'http://cognito.test';
    config.apiBaseUrl = 'http://devpanel.test';
  });

  it('forwards the Cognito access_token as Bearer', async () => {
    const authHeaders: string[] = [];
    stubFetch((call) => {
      authHeaders.push((call.init?.headers as Record<string, string>)?.authorization ?? '');
      return { ok: true, text: async () => JSON.stringify({ workspaces: [] }) };
    });
    const client = new RealDevPanelClient('access-token-001');
    await client.listWorkspaces();
    expect(authHeaders[0]).toBe('Bearer access-token-001');
  });

  it('refreshes once on 401 and retries with the fresh token', async () => {
    saveSession(makeSession({ accessToken: 'expired-access', expiresAt: Date.now() - 1000 }));
    let devPanelCalls = 0;
    const authHeaders: string[] = [];
    stubFetch((call) => {
      if (call.url.includes('/oauth2/token')) {
        return { ok: true, text: async () => JSON.stringify(makeTokens({ access_token: 'fresh-access', refresh_token: 'refresh-rt' })) };
      }
      devPanelCalls += 1;
      authHeaders.push((call.init?.headers as Record<string, string>)?.authorization ?? '');
      if (devPanelCalls === 1) return { ok: false, status: 401, text: async () => 'Unauthorized' };
      return { ok: true, text: async () => JSON.stringify({ workspaces: [] }) };
    });
    const client = new RealDevPanelClient('expired-access');
    const result = await client.listWorkspaces();
    expect(result).toEqual([]);
    expect(authHeaders).toEqual(['Bearer expired-access', 'Bearer fresh-access']);
    expect(getAccessToken()).toBe('fresh-access');
  });

  it('throws and clears the session when the retried request is also 401', async () => {
    saveSession(makeSession({ accessToken: 'expired-access', expiresAt: Date.now() - 1000 }));
    stubFetch((call) => {
      if (call.url.includes('/oauth2/token')) {
        return { ok: true, text: async () => JSON.stringify(makeTokens({ access_token: 'fresh-access', refresh_token: 'refresh-rt' })) };
      }
      return { ok: false, status: 401, text: async () => 'Unauthorized' };
    });
    const client = new RealDevPanelClient('expired-access');
    await expect(client.listWorkspaces()).rejects.toThrow('re-login required');
    expect(getSession()).toBeNull();
  });

  it('TokenScopedDevPanelClient throws SSO login required in real mode without a session', async () => {
    const origMode = config.mode;
    config.mode = 'real';
    try {
      const client = new TokenScopedDevPanelClient();
      await expect(client.listWorkspaces()).rejects.toThrow('SSO login required');
    } finally {
      config.mode = origMode;
    }
  });
});
