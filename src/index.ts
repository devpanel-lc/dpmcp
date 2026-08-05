import './env.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from './config.js';
import { MockDevPanelClient } from './clients/mock-devpanel.js';
import { RealDevPanelClient } from './clients/real-devpanel.js';
import { TokenScopedDevPanelClient } from './clients/token-scoped-client.js';
import type { DevPanelClientFactory } from './clients/devpanel.js';
import { InMemoryPlanStore } from './stores/plan-store.js';
import { startApprovalReviewServer } from './approval/review-server.js';
import { buildServer } from './server.js';
import { beginLogin, startLoginServer } from './auth/login-server.js';
import { getSession, startAutoRefresh } from './auth/session.js';
import { startHttpServer } from './http-server.js';

const store = new InMemoryPlanStore();

let dpFactory: DevPanelClientFactory;
if (config.mode === 'mock') {
  const client = new MockDevPanelClient();
  dpFactory = () => client;
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
  const client = new TokenScopedDevPanelClient();
  dpFactory = () => client;
} else if (config.authMode === 'token') {
  // Bring-your-own-token: no shared secret on the server. Each MCP client's
  // own /mcp bearer is forwarded to DevPanel as its access token for that
  // session — only meaningful over http, where each session has its own
  // Authorization header.
  if (config.transport !== 'http') {
    throw new Error('DP_AUTH_MODE=token requires DP_TRANSPORT=http (stdio has no per-request bearer token)');
  }
  dpFactory = (token) => {
    if (!token) throw new Error('DP_AUTH_MODE=token: MCP session has no bearer token to forward to DevPanel');
    return new RealDevPanelClient(token, false, 'the bearer token sent to /mcp');
  };
} else {
  const client = new RealDevPanelClient(config.accessToken);
  dpFactory = () => client;
}

const authLabel = config.authMode === 'sso' ? 'cognito-sso' : config.authMode === 'token' ? 'bring-your-own-token' : 'legacy-token';

if (config.transport === 'http') {
  // Public HTTP server (Railway etc.). /mcp is protected by MCP OAuth; the
  // review UI is served publicly at /review/:planId; /login signs in to DevPanel.
  await startHttpServer(dpFactory, store);
  console.error(`[mcp] DevPanel Application MCP started in ${config.mode} mode via http (auth: ${authLabel}, approval: ${config.approvalMode})`);
} else {
  const server = buildServer(dpFactory(), store);
  startApprovalReviewServer(store);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[mcp] DevPanel Application MCP started in ${config.mode} mode via stdio (auth: ${authLabel}, approval: ${config.approvalMode})`);
}
