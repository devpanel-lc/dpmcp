import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from './config.js';
import { MockDevPanelClient } from './clients/mock-devpanel.js';
import { RealDevPanelClient } from './clients/real-devpanel.js';
import { InMemoryPlanStore } from './stores/plan-store.js';
import { startApprovalReviewServer } from './approval/review-server.js';
import { buildServer } from './server.js';

const store = new InMemoryPlanStore();
const dp = config.mode === 'real' ? new RealDevPanelClient() : new MockDevPanelClient();
startApprovalReviewServer(store);
const server = buildServer(dp, store);
const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[mcp] DevPanel Application MCP started in ${config.mode} mode (approval: ${config.approvalMode})`);
