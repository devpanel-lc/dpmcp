function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

const callbackPort = Number(env('DP_LOGIN_CALLBACK_PORT', '8788'));
const approvalPort = Number(env('APPROVAL_PORT', '8787'));

/** stdio = local MCP client spawns this process (loopback login callback).
 *  http = public HTTP server (Railway etc.) with MCP OAuth for the /mcp endpoint. */
const transport = env('DP_TRANSPORT', 'stdio') as 'stdio' | 'http';

/** Public origin of the HTTP server, e.g. https://dpmcp.up.railway.app (no trailing slash). */
const publicBaseUrl = env('DP_PUBLIC_BASE_URL', '').replace(/\/+$/, '');

let derivedAllowedHosts = 'localhost,127.0.0.1';
if (publicBaseUrl) {
  try {
    derivedAllowedHosts = `${new URL(publicBaseUrl).host},${derivedAllowedHosts}`;
  } catch { /* ignore invalid public base URL; validated at startup */ }
}

/** Cognito redirect target: public callback in http mode, loopback in stdio mode. */
const ssoRedirectUri = process.env.COGNITO_REDIRECT_URI ??
  (transport === 'http' ? `${publicBaseUrl}/callback` : `http://localhost:${callbackPort}/callback`);

/** off = single shared DP_ACCESS_TOKEN; sso = server-side Cognito login; token = bring-your-own-token. */
const authMode = env('DP_AUTH_MODE', 'off') as 'off' | 'sso' | 'token';

// Static bearer for /mcp only applies in off mode. Computed once here (rather than
// independently re-derived per config field) so mcpBearerToken and
// mcpBearerTokenSource can't disagree about which env var won.
const dpMcpBearerTokenEnv = env('DP_MCP_BEARER_TOKEN', '');
const dpAccessTokenEnv = process.env.DP_ACCESS_TOKEN ?? '';
const mcpBearerTokenSource: 'DP_MCP_BEARER_TOKEN' | 'DP_ACCESS_TOKEN' | 'none' = authMode !== 'off'
  ? 'none'
  : dpMcpBearerTokenEnv ? 'DP_MCP_BEARER_TOKEN' : (dpAccessTokenEnv ? 'DP_ACCESS_TOKEN' : 'none');
const mcpBearerToken = authMode === 'off' ? (dpMcpBearerTokenEnv || dpAccessTokenEnv) : '';

export const config = {
  mode: env('DP_MODE', 'mock') as 'mock' | 'real',
  transport,
  /**
   * off   = single shared DP_ACCESS_TOKEN for every caller (legacy behavior).
   * sso   = server-side Cognito login; the MCP server owns the token and the
   *         MCP client never sees it. stdio transport only.
   * token = bring-your-own-token: each MCP client sends its own DevPanel
   *         access token as its /mcp bearer, forwarded 1:1 to DevPanel for
   *         that session. No shared secret lives on the server. http only.
   */
  authMode,
  apiBaseUrl: env('DP_API_BASE_URL', 'http://localhost.invalid'),
  accessToken: process.env.DP_ACCESS_TOKEN ?? '',
  /**
   * Static bearer token accepted by /mcp in off mode (no OAuth flow needed).
   * DP_MCP_BEARER_TOKEN wins; falls back to DP_ACCESS_TOKEN. Empty in sso and
   * token modes, which don't compare against a fixed server-side secret.
   */
  mcpBearerToken,
  /**
   * Which env var config.mcpBearerToken's value came from (startup diagnostic
   * log only). 'none' when authMode isn't 'off', or both vars are empty.
   */
  mcpBearerTokenSource,
  defaultWorkspaceId: env('DP_DEFAULT_WORKSPACE_ID', 'mock-workspace'),
  enableRealCreate: env('DP_ENABLE_REAL_CREATE', 'false') === 'true',
  createProfile: env('DP_CREATE_PROFILE', 'drupal11-demo'),
  approvalMode: env('APPROVAL_MODE', 'auto') as 'auto' | 'form' | 'url' | 'external',
  approvalHost: env('APPROVAL_HOST', '127.0.0.1'),
  approvalPort,
  approvalPublicBaseUrl: env(
    'APPROVAL_PUBLIC_BASE_URL',
    transport === 'http' ? publicBaseUrl : `http://127.0.0.1:${approvalPort}`,
  ),
  planTtlSeconds: Number(env('PLAN_TTL_SECONDS', '900')),
  /** Port the HTTP server binds in http mode (Railway sets PORT). */
  httpPort: Number(env('PORT', '3000')),
  /** Public origin of the HTTP server. Required in http mode. */
  publicBaseUrl,
  /** Host header allowlist for the http server (anti DNS-rebinding). */
  allowedHosts: env('DP_ALLOWED_HOSTS', derivedAllowedHosts),
  /** Loopback port the stdio-mode login callback listener binds (Cognito redirect target). */
  loginCallbackPort: callbackPort,
  /** How often to re-print the login URL while a login attempt is pending. */
  loginTimeoutMs: Number(env('DP_LOGIN_TIMEOUT_MS', '180000')),
  /** Cap on how long a client-native elicitation dialog may take before we fall back to the external review URL. */
  elicitTimeoutMs: Number(env('DP_ELICIT_TIMEOUT_MS', '60000')),
  cognito: {
    region: env('COGNITO_REGION', ''),
    clientId: env('COGNITO_CLIENT_ID', ''),
    clientSecret: process.env.COGNITO_CLIENT_SECRET ?? '',
    /** Cognito hosted-UI domain, e.g. https://mcp-client-domain.auth.us-west-1.amazoncognito.com */
    domain: env('COGNITO_DOMAIN', ''),
    scopes: env('COGNITO_SCOPES', 'phone email openid profile aws.cognito.signin.user.admin offline_access'),
    redirectUri: ssoRedirectUri,
  },
};
