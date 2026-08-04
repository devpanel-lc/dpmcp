import './env.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from './config.js';
import { MockDevPanelClient } from './clients/mock-devpanel.js';
import { RealDevPanelClient } from './clients/real-devpanel.js';
import { TokenScopedDevPanelClient } from './clients/token-scoped-client.js';
import type { DevPanelClient } from './clients/devpanel.js';
import { InMemoryPlanStore } from './stores/plan-store.js';
import { startApprovalReviewServer } from './approval/review-server.js';
import { buildServer } from './server.js';
import { beginLogin, startLoginServer } from './auth/login-server.js';
import { getSession, startAutoRefresh } from './auth/session.js';
import { startHttpServer } from './http-server.js';

const store = new InMemoryPlanStore();

let dp: DevPanelClient;
if (config.mode === 'mock') {
  dp = new MockDevPanelClient();
} else if (config.authMode === 'sso') {
  // Server-side Cognito SSO. The MCP server owns the token: it hosts the login
  // callback (loopback in stdio mode, /callback on the public app in http mode),
  // persists the session server-side, and forwards the Cognito access_token to
  // DevPanel. The MCP client never sees the Cognito token.
  if (config.transport === 'stdio') {
    await startLoginServer();
    if (!getSession()) await beginLogin();
  }
  startAutoRefresh();
  dp = new TokenScopedDevPanelClient();
} else {
  dp = new RealDevPanelClient(config.accessToken);
}

const server = buildServer(dp, store);

if (config.transport === 'http') {
  // Public HTTP server (Railway etc.). /mcp is protected by MCP OAuth; the
  // review UI is served publicly at /review/:planId; /login signs in to DevPanel.
  await startHttpServer(server, store);
  console.error(`[mcp] DevPanel Application MCP started in ${config.mode} mode via http (auth: ${config.authMode === 'sso' ? 'cognito-sso' : 'legacy-token'}, approval: ${config.approvalMode})`);
} else {
  startApprovalReviewServer(store);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[mcp] DevPanel Application MCP started in ${config.mode} mode via stdio (auth: ${config.authMode === 'sso' ? 'cognito-sso' : 'legacy-token'}, approval: ${config.approvalMode})`);
}
