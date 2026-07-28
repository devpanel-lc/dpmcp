import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DevPanelClient } from '../clients/devpanel.js';
import type { PlanStore } from '../stores/plan-store.js';
import { PlanService } from '../services/plan-service.js';
import { ExecutionService } from '../services/execution-service.js';
import { ApplicationResolver } from '../services/application-resolver.js';
import { config } from '../config.js';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] });

export function registerTools(server: McpServer, dp: DevPanelClient, store: PlanStore): void {
  const plans = new PlanService(dp, store);
  const executor = new ExecutionService(dp, store);
  const resolver = new ApplicationResolver(dp);

  server.registerTool('devpanel_list_applications', {
    description: 'Read-only. List DevPanel applications, optionally filtered by a search string.',
    inputSchema: { search: z.string().optional() },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ search }) => text(await dp.listApplications(search)));

  server.registerTool('devpanel_get_application', {
    description: 'Read-only. Resolve an application by ID or unique search string and return normalized details.',
    inputSchema: { application: z.string().min(1) },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ application }) => text(await resolver.resolve(application)));

  server.registerTool('devpanel_get_application_activities', {
    description: 'Read-only. Get activity history for an application.',
    inputSchema: { application: z.string().min(1) },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ application }) => { const app = await resolver.resolve(application); return text(await dp.getApplicationActivities(app.id)); });

  server.registerTool('devpanel_get_activity_logs', {
    description: 'Read-only. Get DevPanel logs for a known activity ID.',
    inputSchema: { activityId: z.string().min(1) },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ activityId }) => text(await dp.getApplicationLogs(activityId)));

  server.registerTool('devpanel_list_backups', {
    description: 'Read-only. List backups for an application.',
    inputSchema: { application: z.string().min(1) },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ application }) => { const app = await resolver.resolve(application); return text(await dp.listBackups(app)); });

  server.registerTool('devpanel_plan_create_application', {
    description: 'PLAN ONLY. Validate inputs and create an immutable proposed plan to create a DevPanel application. Does not change DevPanel.',
    inputSchema: {
      workspaceId: z.string().default(config.defaultWorkspaceId),
      repositoryOwner: z.string().min(1), repositoryName: z.string().min(1),
      repositoryProvider: z.string().default('github'), repositoryId: z.string().optional(),
      branch: z.string().default('main'), projectType: z.string().min(1), repositoryType: z.string().optional(),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async (args) => text({ plan: await plans.createApplicationPlan(args), next: 'Open the approval_url shown by devpanel_execute_plan, review the exact immutable plan, then approve or reject.' }));

  server.registerTool('devpanel_plan_backup_application', {
    description: 'PLAN ONLY. Create a proposed manual-backup plan. Does not change DevPanel.',
    inputSchema: { application: z.string().min(1) },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ application }) => text({ plan: await plans.backupPlan(application) }));

  server.registerTool('devpanel_plan_restore_application', {
    description: 'PLAN ONLY. Create a proposed restore plan for a specific or latest backup. Does not change DevPanel.',
    inputSchema: { application: z.string().min(1), backupId: z.string().optional() },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ application, backupId }) => text({ plan: await plans.restorePlan(application, backupId) }));

  server.registerTool('devpanel_plan_delete_application', {
    description: 'PLAN ONLY. Create a proposed deletion plan after reading current application and backup state. Does not change DevPanel.',
    inputSchema: { application: z.string().min(1) },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ application }) => text({ plan: await plans.deletePlan(application) }));

  server.registerTool('devpanel_get_plan', {
    description: 'Read-only. Get an immutable change plan, its approval status, and any execution result.',
    inputSchema: { planId: z.string().min(1) },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ planId }) => { const plan = await store.get(planId); if (!plan) throw new Error(`Plan not found: ${planId}`); return text(plan); });

  server.registerTool('devpanel_execute_plan', {
    description: 'The ONLY mutating MCP tool. Executes exactly the immutable plan identified by planId, but only after an external user approval record is bound to the plan hash. Never accepts approved=true or mutable action parameters.',
    inputSchema: { planId: z.string().min(1) },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
  }, async ({ planId }) => {
    const result = await executor.execute(planId);
    if (result.state === 'APPROVAL_REQUIRED') {
      return text({
        state: 'APPROVAL_REQUIRED', plan: result.plan,
        approval_url: `${config.approvalPublicBaseUrl}/review/${encodeURIComponent(planId)}`,
        instruction: 'The user must open this URL and approve the exact plan. Do not claim approval. After approval, call devpanel_execute_plan again with the same planId only.'
      });
    }
    return text(result);
  });
}
