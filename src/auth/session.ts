import { decodeIdToken, refreshTokens, type CognitoTokens } from './cognito.js';

/**
 * In-memory server-side session store for the Cognito credential.
 *
 * The MCP server (not the client) owns the Cognito tokens, held only in this
 * process's memory. Nothing is ever written to disk and nothing is ever handed
 * to the MCP client. A process restart means a fresh login: each MCP client
 * that spawns its own server signs in once.
 * DevPanel calls use `accessToken`; identity/ownership uses `sub` from the id_token.
 */

interface SessionData {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  sub: string;
  email?: string;
  expiresAt: number; // epoch ms, access-token expiry minus a refresh buffer
}

const REFRESH_BUFFER_MS = 60_000; // refresh when less than 60s of life remain
const AUTO_REFRESH_INTERVAL_MS = 60_000;

let memory: SessionData | null = null;
let loginUrl = '';

export function getSession(): SessionData | null {
  return memory;
}

/** Store a session in this process's memory. */
export function saveSession(data: SessionData): void {
  memory = data;
}

/** Drop the session from memory. Used on refresh failure / explicit logout. */
export function clearSession(): void {
  memory = null;
}

/** Build a SessionData from a Cognito token response (expires_at = now + expires_in - buffer). */
export function storeTokensFromCognito(tokens: CognitoTokens): SessionData {
  const claims = decodeIdToken(tokens.id_token);
  const expiresInSeconds = typeof tokens.expires_in === 'number' && Number.isFinite(tokens.expires_in) ? tokens.expires_in : 3600;
  const data: SessionData = {
    accessToken: tokens.access_token,
    idToken: tokens.id_token,
    refreshToken: tokens.refresh_token,
    sub: claims.sub,
    email: claims.email,
    expiresAt: Date.now() + Math.max(0, expiresInSeconds - 60) * 1000,
  };
  saveSession(data);
  return data;
}

/** Owner identity (Cognito sub). Falls back to 'local' with no session. */
export function getOwnerId(): string {
  return memory?.sub ?? 'local';
}

/** The access token to forward to DevPanel, if a session exists. */
export function getAccessToken(): string | undefined {
  return memory?.accessToken;
}

export function getLoginUrl(): string {
  return loginUrl;
}

export function setLoginUrl(url: string): void {
  loginUrl = url;
}

function isExpired(s: SessionData): boolean {
  return Date.now() >= s.expiresAt;
}

/**
 * Refresh the access token. By default only refreshes when the token is
 * expired/expiring; pass force=true to refresh unconditionally (e.g. after a
 * DevPanel 401). Returns true if a usable access token exists afterwards.
 * On refresh failure — or when an expired session has no refresh token — the
 * session is cleared (re-login required).
 */
export async function refreshNow(force = false): Promise<boolean> {
  const s = memory;
  if (!s) return false;
  if (!force && !isExpired(s)) return true;
  if (!s.refreshToken) {
    if (isExpired(s)) clearSession();
    return false;
  }
  try {
    const tokens = await refreshTokens(s.refreshToken);
    storeTokensFromCognito(tokens);
    console.error(`[sso] access token refreshed for user ${getOwnerId()}`);
    return true;
  } catch (err) {
    console.error('[sso] token refresh failed — clearing session:', err instanceof Error ? err.message : err);
    clearSession();
    return false;
  }
}

/** Ensure a fresh access token; no-op when the session is comfortably valid. */
export async function ensureFresh(): Promise<boolean> {
  const s = memory;
  if (!s) return false;
  if (s.expiresAt - Date.now() > REFRESH_BUFFER_MS) return true;
  return refreshNow();
}

/** Proactive background refresh so DevPanel calls rarely hit an expired token. */
export function startAutoRefresh(): NodeJS.Timeout {
  const timer = setInterval(() => {
    void ensureFresh().catch(() => {
      /* handled inside ensureFresh */
    });
  }, AUTO_REFRESH_INTERVAL_MS);
  timer.unref();
  return timer;
}
