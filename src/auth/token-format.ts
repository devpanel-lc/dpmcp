import { config } from '../config.js';

/**
 * Shared token rendering for the DP_DEBUG_AUTH logs.
 *
 * Lives apart from debug-log.ts so cognito.ts can use it: debug-log.ts imports
 * session.ts, which imports cognito.ts, so having cognito.ts import debug-log.ts
 * would close a cycle. This module imports nothing but config.
 *
 * SECURITY: everything here prints live credentials verbatim. Every entry point
 * is gated on config.debugAuth, which is off unless explicitly enabled.
 */

export interface JwtClaims {
  sub?: string;
  exp?: number;
  scope?: string;
  token_use?: string;
  client_id?: string;
  email?: string;
}

/** Best-effort JWT payload decode. Returns null for opaque (non-JWT) tokens. */
export function decodeClaims(token: string): JwtClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as Record<string, unknown>;
    const pick = (k: string): string | undefined => (typeof payload[k] === 'string' ? payload[k] as string : undefined);
    return {
      sub: pick('sub'),
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
      scope: pick('scope'),
      token_use: pick('token_use'),
      client_id: pick('client_id'),
      email: pick('email'),
    };
  } catch {
    return null;
  }
}

/**
 * `exp` arrives from a caller-supplied JWT, so it is not trustworthy: Date
 * rejects anything beyond ±8.64e15 ms and toISOString() throws RangeError on
 * it. That throw would happen inside a middleware and turn the 401 a request
 * has coming into a 500, so out-of-range values are reported verbatim rather
 * than formatted.
 */
const MAX_EPOCH_MS = 8.64e15;

export function describeExpiry(exp: number): string {
  const ms = exp * 1000;
  if (!Number.isFinite(ms) || Math.abs(ms) > MAX_EPOCH_MS) return `(unrepresentable: ${exp})`;
  const delta = ms - Date.now();
  const mins = Math.round(Math.abs(delta) / 60_000);
  const when = new Date(ms).toISOString();
  return delta >= 0 ? `${when} (in ${mins}m)` : `${when} (EXPIRED ${mins}m ago)`;
}

/** Render one labelled token block: the full value, then any decoded claims. */
export function tokenLines(label: string, token: string | undefined, absentNote = '(none)'): string[] {
  if (!token) return [`  ${label}: ${absentNote}`];
  const lines = [`  ${label}: ${token}`];
  const pad = ' '.repeat(label.length);
  const claims = decodeClaims(token);
  if (!claims) {
    lines.push(`  ${pad}  ^ opaque token (len ${token.length}), not a JWT`);
    return lines;
  }
  const detail = [
    claims.sub ? `sub=${claims.sub}` : undefined,
    claims.email ? `email=${claims.email}` : undefined,
    claims.scope ? `scope=${claims.scope}` : undefined,
    claims.token_use ? `token_use=${claims.token_use}` : undefined,
    claims.client_id ? `client_id=${claims.client_id}` : undefined,
  ].filter(Boolean).join(' ');
  if (detail) lines.push(`  ${pad}  ^ ${detail}`);
  if (claims.exp !== undefined) lines.push(`  ${pad}  ^ exp=${describeExpiry(claims.exp)}`);
  return lines;
}

const KNOWN_TOKEN_KEYS = new Set(['access_token', 'id_token', 'refresh_token', 'token_type', 'expires_in']);

/**
 * Log what Cognito actually returned from /oauth2/token (DP_DEBUG_AUTH=1).
 *
 * Covers both grants, which is the point: `refresh_token` is present on the
 * authorization_code exchange and absent on the refresh_token grant, and
 * reading that difference off the wire is the only way to tell "Cognito did not
 * return one" apart from "this server dropped it".
 */
export function logSsoTokenResponse(grantType: string, json: Record<string, unknown>): void {
  if (!config.debugAuth) return;

  const str = (k: string): string | undefined => (typeof json[k] === 'string' ? json[k] as string : undefined);
  const lines = [
    `[sso-debug] Cognito /oauth2/token response (grant=${grantType})`,
    ...tokenLines('access_token ', str('access_token')),
    ...tokenLines('id_token     ', str('id_token'), '(none — `openid` not in COGNITO_SCOPES)'),
    ...tokenLines(
      'refresh_token',
      str('refresh_token'),
      grantType === 'refresh_token'
        ? '(none — normal: Cognito only issues one at initial login)'
        : '(none — `offline_access` not in COGNITO_SCOPES)',
    ),
  ];

  const meta = [
    json.token_type !== undefined ? `token_type=${String(json.token_type)}` : undefined,
    json.expires_in !== undefined ? `expires_in=${String(json.expires_in)}s` : undefined,
  ].filter(Boolean).join(' ');
  if (meta) lines.push(`  ${meta}`);

  // Anything Cognito sent that this server does not model — e.g. a granted
  // `scope` narrower than requested, which is why a later API call 403s.
  const extra = Object.keys(json).filter(k => !KNOWN_TOKEN_KEYS.has(k));
  if (extra.length > 0) lines.push(`  other keys: ${extra.map(k => `${k}=${String(json[k])}`).join(' ')}`);

  console.error(lines.join('\n'));
}
