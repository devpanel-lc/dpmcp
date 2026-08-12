import { createHash, randomBytes } from 'node:crypto';
import { config } from '../config.js';
import { logSsoTokenResponse } from './token-format.js';

/**
 * Cognito hosted-UI client (OAuth 2.0 authorization code grant + PKCE).
 * The MCP server acts as the OAuth client: it builds the authorize URL,
 * exchanges the code at the token endpoint, and renews via the refresh grant.
 * DevPanel validates the access_token itself; this module does not verify JWTs.
 *
 * DevPanel SSO convention: entry point is `{domain}/login` with
 * `identity_provider=COGNITO`; the return URL travels base64-encoded in
 * `state`; the `+` character must be restored before base64-decoding state
 * (the convention is derived from the DevPanel frontend SSO implementation).
 */

export interface CognitoTokens {
  access_token: string;
  /** Only issued when COGNITO_SCOPES includes `openid` — the built-in default
   *  does, an `email`-only scope set does not. Optional either way. */
  id_token?: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface IdTokenClaims {
  sub: string;
  email?: string;
  email_verified?: boolean;
  exp?: number;
}

function domain(): string {
  const d = config.cognito.domain.replace(/\/$/, '');
  if (!d) throw new Error('Missing COGNITO_DOMAIN — set it in .env (Cognito hosted-UI domain)');
  return d;
}

function assertClientConfigured(): void {
  if (!config.cognito.clientId) {
    throw new Error('Missing COGNITO_CLIENT_ID — set it in .env (dedicated MCP Cognito app client)');
  }
}

/** URL for the hosted-UI login page (step 1 of the authorization code grant). */
export function buildAuthorizeUrl(state: string, codeChallenge: string): string {
  assertClientConfigured();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.cognito.clientId,
    redirect_uri: config.cognito.redirectUri,
    identity_provider: 'COGNITO',
    scope: config.cognito.scopes,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  return `${domain()}/login?${params.toString()}`;
}

/**
 * POST to the Cognito token endpoint.
 * - Public client (no secret): client_id in the form body.
 * - Confidential client (secret set): HTTP Basic auth, client_id omitted from body.
 */
async function postTokenForm(body: URLSearchParams): Promise<CognitoTokens> {
  assertClientConfigured();
  const headers: Record<string, string> = { 'content-type': 'application/x-www-form-urlencoded' };
  const params = new URLSearchParams(body);
  if (config.cognito.clientSecret) {
    headers.authorization = `Basic ${Buffer.from(`${config.cognito.clientId}:${config.cognito.clientSecret}`).toString('base64')}`;
  } else {
    params.set('client_id', config.cognito.clientId);
  }

  const response = await fetch(`${domain()}/oauth2/token`, {
    method: 'POST',
    headers,
    body: params.toString(),
  });
  const text = await response.text();
  let json: Record<string, unknown> = {};
  try {
    const parsed: unknown = text ? JSON.parse(text) : {};
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) json = parsed as Record<string, unknown>;
  } catch {
    /* keep text for the error message */
  }
  if (!response.ok) {
    const description = typeof json.error_description === 'string' ? json.error_description : '';
    const code = typeof json.error === 'string' ? json.error : '';
    const detail = description || code || text;
    throw new Error(`Cognito token endpoint ${response.status}: ${detail}`);
  }
  logSsoTokenResponse(params.get('grant_type') ?? 'unknown', json);
  return json as unknown as CognitoTokens;
}

/** Exchange the single-use authorization code for tokens (step 3). */
export async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<CognitoTokens> {
  return postTokenForm(
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.cognito.redirectUri,
      code_verifier: codeVerifier,
    }),
  );
}

/** Renew tokens with the refresh grant. */
export async function refreshTokens(refreshToken: string): Promise<CognitoTokens> {
  return postTokenForm(
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  );
}

/** Decode a Cognito JWT payload (no signature verification — DevPanel validates). */
function decodeJwtClaims(token: string | undefined, label: string): IdTokenClaims {
  const parts = (token ?? '').split('.');
  if (parts.length !== 3) throw new Error(`Malformed ${label}`);
  const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(payload) as Record<string, unknown>;
  } catch {
    throw new Error(`Malformed ${label} payload`);
  }
  const sub = typeof claims.sub === 'string' ? claims.sub : '';
  if (!sub) throw new Error(`${label} missing sub claim`);
  return {
    sub,
    email: typeof claims.email === 'string' ? claims.email : undefined,
    email_verified: typeof claims.email_verified === 'boolean' ? claims.email_verified : undefined,
    exp: typeof claims.exp === 'number' ? claims.exp : undefined,
  };
}

/** Decode identity claims from the id_token JWT payload. */
export function decodeIdToken(idToken: string): IdTokenClaims {
  return decodeJwtClaims(idToken, 'id_token');
}

/**
 * Identity claims for a token response.
 * Cognito only issues an id_token when `openid` is among the requested scopes
 * (see COGNITO_SCOPES — the built-in default includes it, an `email`-only
 * scope set does not). Without one, fall back to the access_token JWT: it
 * always carries `sub`, but never `email`, so `email` is absent in that case.
 */
export function decodeIdentityClaims(tokens: CognitoTokens): IdTokenClaims {
  return tokens.id_token
    ? decodeJwtClaims(tokens.id_token, 'id_token')
    : decodeJwtClaims(tokens.access_token, 'access_token');
}

/** PKCE pair (RFC 7636, S256). */
export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

/**
 * Encode the post-login return URL as the OAuth `state` parameter.
 * DevPanel SSO convention: the state is the standard-base64 of the absolute
 * return URL on our own host, never the raw URL in the query string. The
 * server still verifies `state === pending.state` on the callback, so the
 * equality check doubles as the CSRF guard.
 */
export function buildState(returnUrl: string): string {
  return Buffer.from(returnUrl, 'utf8').toString('base64');
}

/**
 * Decode the return URL from the `state` callback param.
 * Form-URL decoding turns `+` into a space; restore it before base64-decoding
 * (DevPanel SSO convention).
 */
export function decodeState(state: string): string {
  return Buffer.from(state.replace(/ /g, '+'), 'base64').toString('utf8');
}
