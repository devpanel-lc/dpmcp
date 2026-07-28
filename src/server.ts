import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DevPanelClient } from './clients/devpanel.js';
import type { PlanStore } from './stores/plan-store.js';
import { registerTools } from './tools/register.js';

export function buildServer(dp: DevPanelClient, store: PlanStore): McpServer {
  const server = new McpServer({ name: 'devpanel-application-mcp', version: '0.1.0' });
  registerTools(server, dp, store);
  return server;
}
