import { createHash, randomBytes } from 'node:crypto';
import { config } from '../config.js';

/**
 * Cognito hosted-UI client (OAuth 2.0 authorization code grant + PKCE).
 * The MCP server acts as the OAuth client: it builds the authorize URL,
 * exchanges the code at the token endpoint, and renews via the refresh grant.
 * DevPanel validates the access_token itself; this module does not verify JWTs.
 *
 * Reference: docs/SSO-COGNITO.md, docs/cognito-sso-reference.md.
 */

export interface CognitoTokens {
  access_token: string;
  id_token: string;
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
    scope: config.cognito.scopes,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  return `${domain()}/oauth2/authorize?${params.toString()}`;
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

/** Decode identity claims from the id_token JWT payload (no signature verification — DevPanel validates). */
export function decodeIdToken(idToken: string): IdTokenClaims {
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('Malformed id_token');
  const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(payload) as Record<string, unknown>;
  } catch {
    throw new Error('Malformed id_token payload');
  }
  const sub = typeof claims.sub === 'string' ? claims.sub : '';
  if (!sub) throw new Error('id_token missing sub claim');
  return {
    sub,
    email: typeof claims.email === 'string' ? claims.email : undefined,
    email_verified: typeof claims.email_verified === 'boolean' ? claims.email_verified : undefined,
    exp: typeof claims.exp === 'number' ? claims.exp : undefined,
  };
}

/** PKCE pair (RFC 7636, S256). */
export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

/** Random CSRF state for the authorize request. */
export function generateState(): string {
  return randomBytes(16).toString('base64url');
}
