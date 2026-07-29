import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DevPanelClient } from '../clients/devpanel.js';
import type { PlanStore } from '../stores/plan-store.js';
import { PlanService } from '../services/plan-service.js';
import { ExecutionService } from '../services/execution-service.js';
import { ApplicationResolver } from '../services/application-resolver.js';
import { ApprovalService } from '../approval/approval-service.js';
import { config } from '../config.js';
import type { ErrorCode } from '../domain/types.js';
import { currentOwnerId } from '../clients/token-scoped-client.js';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] });

function errorText(errorCode: ErrorCode, message: string, details?: Record<string, unknown>) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify({ isError: true, errorCode, message, ...details }, null, 2) }],
    isError: true as const,
  };
}

export function registerTools(server: McpServer, dp: DevPanelClient, store: PlanStore): void {
  const plans = new PlanService(dp, store);
  const executor = new ExecutionService(dp, store);
  const resolver = new ApplicationResolver(dp);

  // The MCP SDK's elicitInput dispatches based on the mode parameter in the call.
  // One function serves both form and URL elicitation.
  const elicitationFn = server.server.elicitInput.bind(server.server);
  const approvalService = new ApprovalService(store, elicitationFn, elicitationFn);

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
  }, async (args) => text({ plan: await plans.createApplicationPlan(args, currentOwnerId()), next: 'Plan created. Call devpanel_approve_and_execute_plan with the plan ID to request human approval and execute.' }));

  server.registerTool('devpanel_plan_backup_application', {
    description: 'PLAN ONLY. Create a proposed manual-backup plan. Does not change DevPanel.',
    inputSchema: { application: z.string().min(1) },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ application }) => text({ plan: await plans.backupPlan(application, currentOwnerId()) }));

  server.registerTool('devpanel_plan_restore_application', {
    description: 'PLAN ONLY. Create a proposed restore plan for a specific or latest backup. Does not change DevPanel.',
    inputSchema: { application: z.string().min(1), backupId: z.string().optional() },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ application, backupId }) => text({ plan: await plans.restorePlan(application, backupId, currentOwnerId()) }));

  server.registerTool('devpanel_plan_delete_application', {
    description: 'PLAN ONLY. Create a proposed deletion plan after reading current application and backup state. Does not change DevPanel.',
    inputSchema: { application: z.string().min(1) },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ application }) => text({ plan: await plans.deletePlan(application, currentOwnerId()) }));

  server.registerTool('devpanel_get_plan', {
    description: 'Read-only. Get an immutable change plan, its approval status, and any execution result.',
    inputSchema: { planId: z.string().min(1) },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ planId }) => { const plan = await store.get(planId); if (!plan) return errorText('PLAN_NOT_FOUND', `Plan not found: ${planId}`); return text(plan); });

  server.registerTool('devpanel_approve_and_execute_plan', {
    description: 'Requests human approval for an immutable plan and executes it if approved. The model cannot approve plans directly -- this tool triggers an MCP client-native approval dialog (Form Elicitation) or falls back to an external review URL. Only accepts planId.',
    inputSchema: { planId: z.string().min(1) },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
  }, async ({ planId }) => {
    const caller = currentOwnerId();
    const plan = await store.get(planId);
    if (!plan) return errorText('PLAN_NOT_FOUND', `Plan not found: ${planId}`);

    if (plan.ownerId !== caller) {
      return errorText('PLAN_OWNER_MISMATCH', 'Plan was created by a different user.', { plan, caller });
    }

    if (plan.status === 'STALE') {
      return errorText('PLAN_STALE', 'Plan is stale. The target has changed since planning. Create a new plan.', { plan });
    }
    if (plan.status === 'REJECTED') {
      return errorText('PLAN_REJECTED', 'Plan was rejected.', { plan });
    }
    if (plan.status === 'SUCCEEDED') {
      return errorText('PLAN_ALREADY_EXECUTED', 'Plan was already executed successfully.', { plan });
    }

    if (new Date(plan.expiresAt).getTime() <= Date.now()) {
      await store.setStatus(plan.id, 'STALE');
      return errorText('PLAN_EXPIRED', 'Plan has expired. Create and review a new plan.', { plan });
    }

    if (plan.approval && plan.approval.decision === 'APPROVE' && plan.approval.planHash === plan.hash) {
      try {
        const result = await executor.executeApprovedPlan(plan);
        return text(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return errorText('EXECUTION_FAILED', message, { plan });
      }
    }

    const outcome = await approvalService.requestApproval(plan, caller);

    if (outcome.status === 'approved') {
      const refreshedPlan = await store.get(planId);
      if (!refreshedPlan) return errorText('PLAN_NOT_FOUND', `Plan not found after approval: ${planId}`);
      try {
        const result = await executor.executeApprovedPlan(refreshedPlan);
        return text(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return errorText('EXECUTION_FAILED', message, { plan: refreshedPlan });
      }
    }

    if (outcome.status === 'declined') {
      await store.setApproval(planId, {
        decision: 'REJECT', planHash: plan.hash, approvedAt: new Date().toISOString(),
        approvedBy: caller, approvalMethod: outcome.approvalMethod,
      });
      return errorText('APPROVAL_REQUIRED', 'Human declined the plan.', { plan });
    }

    if (outcome.status === 'cancelled') {
      return errorText('APPROVAL_CANCELLED', 'Approval dialog was cancelled.', { plan });
    }

    if (outcome.status === 'url_fallback') {
      return text({
        state: 'APPROVAL_REQUIRED',
        plan,
        approval_method: 'external_url',
        approval_url: outcome.approvalUrl,
        instruction: 'The user must open this URL and approve the exact plan. Do not claim approval. After approval, call devpanel_approve_and_execute_plan again with the same planId.',
      });
    }

    return errorText('APPROVAL_REQUIRED', 'Approval required but no approval method available.', { plan });
  });
}
