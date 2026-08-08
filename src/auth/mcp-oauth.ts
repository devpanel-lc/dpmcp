import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { config } from '../config.js';
import { getSession } from './session.js';
import { esc } from '../utils/escape.js';
import { InvalidGrantError, InvalidRequestError, InvalidTokenError } from '@modelcontextprotocol/sdk/server/auth/errors.js';
import { redirectUriMatches } from '@modelcontextprotocol/sdk/server/auth/handlers/authorize.js';
import type {
  OAuthServerProvider,
  AuthorizationParams,
} from '@modelcontextprotocol/sdk/server/auth/provider.js';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import type {
  OAuthClientInformationFull,
  OAuthTokens,
  OAuthTokenRevocationRequest,
} from '@modelcontextprotocol/sdk/shared/auth.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';

/**
 * In-memory OAuth 2.1 authorization server for the public /mcp endpoint.
 *
 * This is the SDK `OAuthServerProvider` implementation behind
 * `mcpAuthRouter` + `requireBearerAuth` in http mode. Tokens minted here
 * grant access to the MCP tools ONLY — they are never used against DevPanel.
 * DevPanel access stays with the server-side Cognito session, which the MCP
 * client never sees.
 *
 * Everything lives in process memory: a redeploy or restart drops all client
 * registrations, codes, and tokens (dynamic client re-registration is cheap).
 */

const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const AUTHORIZATION_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const CONSENT_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface StoredCode {
  clientId: string;
  codeChallenge: string;
  redirectUri: string;
  scopes: string[];
  expiresAt: number;
}

interface StoredGrant {
  clientId: string;
  scopes: string[];
  expiresAt: number;
}

interface PendingConsent {
  clientId: string;
  clientName: string;
  redirectUri: string;
  state?: string;
  scopes: string[];
  codeChallenge: string;
  expiresAt: number;
}

const clients = new Map<string, OAuthClientInformationFull>();
const codes = new Map<string, StoredCode>();
const grants = new Map<string, StoredGrant>();
const refreshToAccess = new Map<string, string>();
const pendingConsent = new Map<string, PendingConsent>();

const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * codes/grants/pendingConsent only get pruned when something happens to look
 * them up (a token verify, a consent POST); an abandoned OAuth attempt or an
 * unused expired code/grant otherwise sits in memory until the process
 * restarts. Sweep periodically instead. `clients` (RFC 7591 dynamic
 * registrations) are intentionally NOT swept -- they have no TTL by design.
 */
function sweepExpired(): void {
  const now = Date.now();
  for (const [code, stored] of codes) if (stored.expiresAt < now) codes.delete(code);
  for (const [token, grant] of grants) if (grant.expiresAt < now) grants.delete(token);
  for (const [refreshToken, accessId] of refreshToAccess) if (!grants.has(accessId)) refreshToAccess.delete(refreshToken);
  for (const [token, pending] of pendingConsent) if (pending.expiresAt < now) pendingConsent.delete(token);
}

/** Call once when the http transport starts. Matches session.ts's startAutoRefresh() pattern. */
export function startOAuthMapSweep(): NodeJS.Timeout {
  const timer = setInterval(sweepExpired, SWEEP_INTERVAL_MS);
  timer.unref();
  return timer;
}

function newToken(): string {
  return randomBytes(32).toString('base64url');
}

export class McpOAuthProvider implements OAuthServerProvider {
  /** Optional shared bearer token for off mode (no OAuth dance). Empty in sso mode. */
  private readonly staticToken: string;

  constructor(staticToken?: string) {
    this.staticToken = staticToken ?? '';
  }

  /** Read + dynamic registration (RFC 7591) of MCP clients (opencode etc.). */
  readonly clientsStore: OAuthRegisteredClientsStore = {
    getClient(clientId: string): OAuthClientInformationFull | undefined {
      return clients.get(clientId);
    },
    registerClient(client: OAuthClientInformationFull): OAuthClientInformationFull {
      clients.set(client.client_id, client);
      return client;
    },
  };

  /**
   * Entry point of the MCP OAuth flow. Only meaningful in sso mode, where a
   * human must be signed in to DevPanel (server-side Cognito session) before
   * consenting: without a session we send the browser to /login?next=… so
   * the consent step happens after sign-in. In off/token mode this flow is
   * refused entirely -- off mode is gated by a static bearer
   * (DP_MCP_BEARER_TOKEN) and token mode forwards each client's own DevPanel
   * token directly; minting an OAuth grant in either mode would bypass the
   * static-bearer gate (off) or hand out a token that isn't a real DevPanel
   * credential (token), so there is nothing safe for this flow to grant.
   */
  async authorize(client: OAuthClientInformationFull, params: AuthorizationParams, res: Response): Promise<void> {
    if (config.authMode !== 'sso') {
      const url = new URL(params.redirectUri);
      url.searchParams.set('error', 'unauthorized_client');
      url.searchParams.set('error_description', 'This server only supports the OAuth flow in DP_AUTH_MODE=sso. Use the static bearer token (off mode) or send your own DevPanel access token directly (token mode).');
      if (params.state) url.searchParams.set('state', params.state);
      res.redirect(302, url.toString());
      return;
    }
    if (!getSession()) {
      const next = buildAuthorizeNextUrl(client, params);
      res.redirect(302, `/login?next=${encodeURIComponent(next)}`);
      return;
    }

    const consentToken = newToken();
    pendingConsent.set(consentToken, {
      clientId: client.client_id,
      clientName: typeof client.client_name === 'string' ? client.client_name : client.client_id,
      redirectUri: params.redirectUri,
      state: params.state,
      scopes: params.scopes ?? [],
      codeChallenge: params.codeChallenge,
      expiresAt: Date.now() + CONSENT_TTL_MS,
    });

    res
      .status(200)
      .setHeader('content-type', 'text/html; charset=utf-8')
      .setHeader('cache-control', 'no-store')
      .send(consentHtml(consentToken, client.client_id, pendingConsent.get(consentToken)!));
  }

  /** POST /authorize/consent — the consent page posts here with a one-time token. */
  async handleConsentRequest(req: Request, res: Response): Promise<void> {
    const consentToken = typeof req.body?.token === 'string' ? req.body.token : '';
    const pending = consentToken ? pendingConsent.get(consentToken) : undefined;
    if (!pending || pending.expiresAt < Date.now()) {
      if (pending) pendingConsent.delete(consentToken);
      res.status(400).setHeader('content-type', 'text/plain; charset=utf-8').send(
        'Consent request is missing or expired. Close this tab and start the MCP connection again.',
      );
      return;
    }
    pendingConsent.delete(consentToken);

    if (req.body?.decision !== 'approve') {
      const url = new URL(pending.redirectUri);
      url.searchParams.set('error', 'access_denied');
      if (pending.state) url.searchParams.set('state', pending.state);
      res.redirect(302, url.toString());
      return;
    }

    const code = newToken();
    codes.set(code, {
      clientId: pending.clientId,
      codeChallenge: pending.codeChallenge,
      redirectUri: pending.redirectUri,
      scopes: pending.scopes,
      expiresAt: Date.now() + AUTHORIZATION_CODE_TTL_MS,
    });
    const url = new URL(pending.redirectUri);
    url.searchParams.set('code', code);
    if (pending.state) url.searchParams.set('state', pending.state);
    res.redirect(302, url.toString());
  }

  async challengeForAuthorizationCode(client: OAuthClientInformationFull, authorizationCode: string): Promise<string> {
    const stored = codes.get(authorizationCode);
    if (!stored || stored.expiresAt < Date.now() || stored.clientId !== client.client_id) {
      codes.delete(authorizationCode);
      throw new InvalidGrantError('Invalid or expired authorization code');
    }
    return stored.codeChallenge;
  }

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    _codeVerifier?: string,
    redirectUri?: string,
    _resource?: URL,
  ): Promise<OAuthTokens> {
    const stored = codes.get(authorizationCode);
    if (!stored || stored.expiresAt < Date.now() || stored.clientId !== client.client_id) {
      codes.delete(authorizationCode);
      throw new InvalidGrantError('Invalid or expired authorization code');
    }
    codes.delete(authorizationCode);
    if (redirectUri !== undefined && !redirectUriMatches(stored.redirectUri, redirectUri)) {
      throw new InvalidGrantError('redirect_uri does not match the authorization request');
    }
    return this.issueTokens(client.client_id, stored.scopes);
  }

  async exchangeRefreshToken(
    client: OAuthClientInformationFull,
    refreshToken: string,
    scopes?: string[],
    _resource?: URL,
  ): Promise<OAuthTokens> {
    const accessId = refreshToAccess.get(refreshToken);
    if (accessId === undefined) throw new InvalidGrantError('Invalid refresh token');
    const grant = grants.get(accessId);
    if (!grant || grant.expiresAt < Date.now() || grant.clientId !== client.client_id) {
      refreshToAccess.delete(refreshToken);
      if (grant) grants.delete(accessId);
      throw new InvalidGrantError('Invalid refresh token');
    }
    if (scopes && !scopes.every(s => grant.scopes.includes(s))) {
      throw new InvalidRequestError('Requested scope exceeds the granted scopes');
    }
    // Rotate: the old access + refresh tokens die, a fresh pair is issued.
    grants.delete(accessId);
    refreshToAccess.delete(refreshToken);
    return this.issueTokens(grant.clientId, scopes ?? grant.scopes);
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    if (this.staticToken && token === this.staticToken) {
      return {
        token,
        clientId: 'static-token',
        scopes: [],
        expiresAt: Math.floor((Date.now() + ACCESS_TOKEN_TTL_MS) / 1000),
      };
    }
    if (config.authMode === 'token') {
      // Bring-your-own-token: this server has no shared secret to compare
      // against. The bearer is forwarded to DevPanel as-is per session;
      // DevPanel itself rejects invalid tokens on the first real API call.
      return {
        token,
        clientId: 'byot',
        scopes: [],
        expiresAt: Math.floor((Date.now() + ACCESS_TOKEN_TTL_MS) / 1000),
      };
    }
    if (config.authMode !== 'sso') {
      // off mode: authorize() refuses the OAuth flow entirely (see above), so
      // grants should always be empty here -- reject explicitly rather than
      // falling through to the grants lookup, as defense in depth against a
      // future change accidentally re-opening that path.
      throw new InvalidTokenError('Invalid access token');
    }
    const grant = grants.get(token);
    if (!grant) throw new InvalidTokenError('Invalid access token');
    if (grant.expiresAt < Date.now()) {
      grants.delete(token);
      throw new InvalidTokenError('Access token has expired');
    }
    return {
      token,
      clientId: grant.clientId,
      scopes: grant.scopes,
      expiresAt: Math.floor(grant.expiresAt / 1000),
    };
  }

  async revokeToken(client: OAuthClientInformationFull, request: OAuthTokenRevocationRequest): Promise<void> {
    const owns = (grant: StoredGrant | undefined) => grant?.clientId === client.client_id;
    const accessGrant = grants.get(request.token);
    if (accessGrant && owns(accessGrant)) {
      grants.delete(request.token);
      return;
    }
    const accessId = refreshToAccess.get(request.token);
    if (accessId) {
      const tokenGrant = grants.get(accessId);
      if (tokenGrant && owns(tokenGrant)) {
        refreshToAccess.delete(request.token);
        grants.delete(accessId);
      }
    }
  }

  private issueTokens(clientId: string, scopes: string[]): OAuthTokens {
    const accessToken = newToken();
    const refreshToken = newToken();
    grants.set(accessToken, {
      clientId,
      scopes,
      expiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
    });
    refreshToAccess.set(refreshToken, accessToken);
    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
      refresh_token: refreshToken,
      scope: scopes.join(' '),
    };
  }
}

/** Reconstruct an /authorize URL (relative) that preserves the original request across /login. */
function buildAuthorizeNextUrl(client: OAuthClientInformationFull, params: AuthorizationParams): string {
  const u = new URL('/authorize', config.publicBaseUrl);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('client_id', client.client_id);
  u.searchParams.set('redirect_uri', params.redirectUri);
  u.searchParams.set('code_challenge', params.codeChallenge);
  u.searchParams.set('code_challenge_method', 'S256');
  if (params.scopes && params.scopes.length > 0) u.searchParams.set('scope', params.scopes.join(' '));
  if (params.state) u.searchParams.set('state', params.state);
  if (params.resource) u.searchParams.set('resource', params.resource.toString());
  return `${u.pathname}${u.search}`;
}

function consentHtml(consentToken: string, clientId: string, pending: PendingConsent): string {
  const scopes = pending.scopes.length > 0
    ? pending.scopes.map(s => `<li>${esc(s)}</li>`).join('')
    : '<li>(default scopes)</li>';
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Authorize MCP client</title>
<style>body{font-family:system-ui;max-width:640px;margin:40px auto;padding:0 20px;color:#1a1a1a}code{background:#f5f5f5;padding:2px 6px;border-radius:4px}ul{line-height:1.7}.buttons{margin-top:24px}button{padding:12px 20px;font-size:16px;border-radius:8px;border:1px solid #ccc;cursor:pointer}button.approve{background:#0a7d2e;color:#fff;border-color:#0a7d2e;margin-right:10px}button.deny{background:#fff}</style>
</head><body><h1>Authorize MCP client</h1>
<p>A new MCP client wants to connect to this DevPanel MCP server:</p>
<p><strong>${esc(pending.clientName)}</strong> <code>${esc(clientId)}</code></p>
<p>It will receive an access token valid for <strong>MCP tools only</strong> (read plans, request approvals). It does <strong>not</strong> receive any DevPanel credentials. Sign-in to DevPanel is handled server-side.</p>
<h2>Requested scopes</h2><ul>${scopes}</ul>
<form method="post" action="/authorize/consent">
  <input type="hidden" name="token" value="${esc(consentToken)}">
  <div class="buttons">
    <button class="approve" name="decision" value="approve">Approve</button>
    <button class="deny" name="decision" value="deny">Deny</button>
  </div>
</form></body></html>`;
}
