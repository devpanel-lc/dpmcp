import './env.js';
import { randomUUID } from 'node:crypto';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { config } from './config.js';
import { MockDevPanelClient } from './clients/mock-devpanel.js';
import { RealDevPanelClient } from './clients/real-devpanel.js';
import { TokenScopedDevPanelClient } from './clients/token-scoped-client.js';
import type { DevPanelClient } from './clients/devpanel.js';
import { InMemoryPlanStore } from './stores/plan-store.js';
import { startApprovalReviewServer } from './approval/review-server.js';
import { buildServer } from './server.js';
import { startHttpServer } from './http-server.js';

const store = new InMemoryPlanStore();
startApprovalReviewServer(store);

let dp: DevPanelClient;
if (config.transport === 'http') {
  dp = new TokenScopedDevPanelClient();
} else if (config.mode === 'real') {
  dp = new RealDevPanelClient(config.accessToken);
} else {
  dp = new MockDevPanelClient();
}

const server = buildServer(dp, store);

if (config.transport === 'http') {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID() });
  await server.connect(transport);
  await startHttpServer(transport);
  console.error(`[mcp] DevPanel Application MCP started in ${config.mode} mode over HTTP (approval: ${config.approvalMode})`);
} else {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[mcp] DevPanel Application MCP started in ${config.mode} mode via stdio (approval: ${config.approvalMode})`);
}
