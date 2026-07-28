function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const config = {
  mode: env('DP_MODE', 'mock') as 'mock' | 'real',
  apiBaseUrl: env('DP_API_BASE_URL', 'http://localhost.invalid'),
  accessToken: process.env.DP_ACCESS_TOKEN ?? '',
  defaultWorkspaceId: process.env.DP_DEFAULT_WORKSPACE_ID ?? 'mock-workspace',
  enableRealCreate: env('DP_ENABLE_REAL_CREATE', 'false') === 'true',
  createProfile: env('DP_CREATE_PROFILE', 'drupal11-demo'),
  approvalHost: env('APPROVAL_HOST', '127.0.0.1'),
  approvalPort: Number(env('APPROVAL_PORT', '8787')),
  approvalPublicBaseUrl: env('APPROVAL_PUBLIC_BASE_URL', 'http://127.0.0.1:8787'),
  planTtlSeconds: Number(env('PLAN_TTL_SECONDS', '900')),
};
