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

const wsOpt = {
  workspaceId: z.string().default(config.defaultWorkspaceId)
    .transform(v => v || config.defaultWorkspaceId),
};

export function registerTools(server: McpServer, dp: DevPanelClient, store: PlanStore): void {
  const plans = new PlanService(dp, store);
  const executor = new ExecutionService(dp, store);
  const resolver = new ApplicationResolver(dp);

  const elicitationFn = server.server.elicitInput.bind(server.server);
  const approvalService = new ApprovalService(store, elicitationFn, elicitationFn);

  // ---- Discovery tools ----

  server.registerTool('devpanel_list_workspaces', {
    description: 'Read-only. List all DevPanel workspaces accessible to the authenticated user.',
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async () => text(await dp.listWorkspaces()));

  server.registerTool('devpanel_list_environments', {
    description: 'Read-only. List DevPanel environments (Kubernetes clusters), optionally filtered by search string. Environment IDs are required to plan workspace creation. If none exist, the environment must be created in the DevPanel UI first -- provisioning is not yet supported via MCP.',
    inputSchema: { search: z.string().optional() },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ search }) => {
    const environments = await dp.listEnvironments(search);
    if (environments.length === 0) {
      return text({
        status: 'no_environments',
        message: 'No environments found. Environment (cluster) creation is not yet supported via MCP -- create an environment in the DevPanel UI first, then list environments again to get its ID.',
      });
    }
    return text(environments);
  });

  server.registerTool('devpanel_list_projects', {
    description: 'Read-only. List all DevPanel projects in a workspace.',
    inputSchema: { workspaceId: z.string().min(1) },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ workspaceId }) => text(await dp.listProjects(workspaceId)));

  server.registerTool('devpanel_list_project_types', {
    description: 'Read-only. List available DevPanel project types (e.g. lamp, drupal11_v2, wordpress_v2).',
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async () => text(await dp.listProjectTypes()));

  server.registerTool('devpanel_list_applications', {
    description: 'Read-only. List DevPanel applications in a workspace, optionally filtered by search string.',
    inputSchema: { ...wsOpt, search: z.string().optional() },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ workspaceId, search }) => text(await dp.listApplications(workspaceId, search)));

  server.registerTool('devpanel_list_project_applications', {
    description: 'Read-only. List applications in a specific project within a workspace.',
    inputSchema: { workspaceId: z.string().min(1), projectId: z.string().min(1) },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ workspaceId, projectId }) => text(await dp.listProjectApplications(workspaceId, projectId)));

  // ---- Git provider tools ----

  server.registerTool('devpanel_list_git_owners', {
    description: 'Read-only. List connected Git providers and organizations (e.g. GitHub orgs/users). Requires OAuth or personal token to be configured first.',
    inputSchema: { provider: z.enum(['GITHUB', 'GITLAB', 'BITBUCKET']).default('GITHUB') },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ provider }) => text(await dp.listGitOwners(provider)));

  server.registerTool('devpanel_list_repositories', {
    description: 'Read-only. Search accessible Git repositories from connected providers.',
    inputSchema: { owner: z.string().optional(), provider: z.enum(['GITHUB', 'GITLAB', 'BITBUCKET']).default('GITHUB') },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ owner, provider }) => text(await dp.listRepositories(owner, provider)));

  server.registerTool('devpanel_list_repository_branches', {
    description: 'Read-only. List branches for a specific Git repository. Returns only the first page (max 50 branches, no pagination). repoId is a DevPanel-internal id and is ignored by the provider. Requires a personal token with repo scope for private repositories.',
    inputSchema: { owner: z.string().min(1), repoName: z.string().min(1), repoId: z.string().min(1), provider: z.enum(['GITHUB', 'GITLAB', 'BITBUCKET', 'DRUPALCODE']).default('GITHUB') },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ owner, repoName, repoId, provider }) => text(await dp.listRepositoryBranches(owner, repoName, repoId, provider)));

  server.registerTool('devpanel_set_git_token', {
    description: 'MUTATION. Set or update a personal Git access token for a provider (e.g. github, gitlab, bitbucket). Required for private repositories.',
    inputSchema: { token: z.string().min(1), provider: z.enum(['GITHUB', 'GITLAB', 'BITBUCKET']).default('GITHUB'), username: z.string().min(1) },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ token, provider, username }) => { await dp.setGitToken(token, provider, username); return text({ status: 'ok' }); });

  server.registerTool('devpanel_remove_git_token', {
    description: 'MUTATION. Remove a personal Git access token for a provider.',
    inputSchema: { provider: z.enum(['GITHUB', 'GITLAB', 'BITBUCKET']).default('GITHUB') },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
  }, async ({ provider }) => { await dp.removeGitToken(provider); return text({ status: 'ok' }); });

  // ---- Application detail tools ----

  server.registerTool('devpanel_get_application', {
    description: 'Read-only. Resolve an application by ID or unique search string and return normalized details.',
    inputSchema: { ...wsOpt, application: z.string().min(1) },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ application, workspaceId }) => text(await resolver.resolve(application, workspaceId)));

  server.registerTool('devpanel_get_application_activities', {
    description: 'Read-only. Get activity history for an application.',
    inputSchema: { ...wsOpt, application: z.string().min(1) },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ application, workspaceId }) => { const app = await resolver.resolve(application, workspaceId); return text(await dp.getApplicationActivities(app)); });

  server.registerTool('devpanel_get_activity_logs', {
    description: 'Read-only. Get HTTP access logs for an application container.',
    inputSchema: { ...wsOpt, application: z.string().min(1), containerName: z.string().default('php'), pageSize: z.number().default(100) },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ application, workspaceId, containerName, pageSize }) => { const app = await resolver.resolve(application, workspaceId); return text(await dp.getApplicationLogs(app, containerName, pageSize)); });

  server.registerTool('devpanel_list_backups', {
    description: 'Read-only. List backups for an application.',
    inputSchema: { ...wsOpt, application: z.string().min(1) },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ application, workspaceId }) => { const app = await resolver.resolve(application, workspaceId); return text(await dp.listBackups(app)); });

  // ---- Plan creation tools ----

  server.registerTool('devpanel_plan_create_application', {
    description: 'PLAN ONLY. Validate inputs and create an immutable proposed plan to create a DevPanel application. Does not change DevPanel. After this plan succeeds, read the created application status: if UNDEPLOY_APPLICATION_SUCCESS, create and execute an activate plan to deploy to K8s; if it is already DEPLOY_APPLICATION_SUCCESS, it is already serving traffic and no activation is needed.',
    inputSchema: {
      ...wsOpt,
      name: z.string().min(1).describe('Project/application display name'),
      repositoryOwner: z.string().min(1), repositoryName: z.string().min(1),
      repositoryProvider: z.enum(['GITHUB', 'GITLAB', 'BITBUCKET']).default('GITHUB'), repositoryId: z.string().optional(),
      branch: z.string().default('main'), projectType: z.string().min(1), repositoryType: z.string().optional(),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async (args) => text({ plan: await plans.createApplicationPlan(args, currentOwnerId()), next: 'Plan created. Call devpanel_approve_and_execute_plan with the plan ID to request human approval and execute.' }));

  server.registerTool('devpanel_plan_activate_application', {
    description: 'PLAN ONLY. Create an immutable proposed plan to activate (deploy to K8s) an existing DevPanel application. The application must be in UNDEPLOY_APPLICATION_SUCCESS status; if it is already in DEPLOY_APPLICATION_SUCCESS status, no activation is needed.',
    inputSchema: {
      workspaceId: z.string().optional().describe('Restrict application lookup to this workspace'),
      application: z.string().min(1).describe('Application ID, name, or search query'),
      groupType: z.enum(['spot', 'on-demand']).default('on-demand'),
      capacity: z.string().default('micro'),
      capacityLimit: z.string().optional(),
      isFromGit: z.boolean().default(true),
      appRoot: z.string().default('/var/www/html'),
      webRoot: z.string().default('/var/www/html'),
      containerImage: z.string().optional(),
      isEnableEditor: z.boolean().default(false),
      isEnablePMA: z.boolean().default(false),
      isEnableBasicAuth: z.boolean().default(false),
      storage: z.number().optional(),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async (args) => {
    const activateConfig = {
      groupType: args.groupType,
      capacity: args.capacity,
      capacityLimit: args.capacityLimit,
      isFromGit: args.isFromGit,
      appRoot: args.appRoot,
      webRoot: args.webRoot,
      containerImage: args.containerImage,
      isEnableEditor: args.isEnableEditor,
      isEnablePMA: args.isEnablePMA,
      isEnableBasicAuth: args.isEnableBasicAuth,
      storage: args.storage,
    };
    return text({ plan: await plans.activatePlan(args.application, activateConfig, currentOwnerId(), args.workspaceId), next: 'Plan created. Call devpanel_approve_and_execute_plan with the plan ID to request human approval and execute.' });
  });

  server.registerTool('devpanel_plan_backup_application', {
    description: 'PLAN ONLY. Create a proposed manual-backup plan. Does not change DevPanel.',
    inputSchema: { ...wsOpt, application: z.string().min(1) },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ application, workspaceId }) => text({ plan: await plans.backupPlan(application, currentOwnerId()) }));

  server.registerTool('devpanel_plan_restore_application', {
    description: 'PLAN ONLY. Create a proposed restore plan for a specific or latest backup. Does not change DevPanel.',
    inputSchema: { ...wsOpt, application: z.string().min(1), backupId: z.string().optional() },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ application, workspaceId, backupId }) => text({ plan: await plans.restorePlan(application, backupId, currentOwnerId()) }));

  server.registerTool('devpanel_plan_delete_application', {
    description: 'PLAN ONLY. Create a proposed deletion plan after reading current application and backup state. Does not change DevPanel.',
    inputSchema: { ...wsOpt, application: z.string().min(1) },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ application, workspaceId }) => text({ plan: await plans.deletePlan(application, currentOwnerId()) }));

  server.registerTool('devpanel_plan_create_workspace', {
    description: 'PLAN ONLY. Create an immutable proposed plan to create a DevPanel workspace on an existing environment (no cluster provisioning). Obtain the environmentId from devpanel_list_environments. Does not change DevPanel until a human approves the plan.',
    inputSchema: {
      name: z.string().min(1).describe('Workspace name'),
      environmentId: z.string().min(1).describe('Existing environment ID (see devpanel_list_environments)'),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async (args) => text({ plan: await plans.createWorkspacePlan(args, currentOwnerId()), next: 'Plan created. Call devpanel_approve_and_execute_plan with the plan ID to request human approval and execute.' }));

  // ---- Plan inspection ----

  server.registerTool('devpanel_get_plan', {
    description: 'Read-only. Get an immutable change plan, its approval status, and any execution result.',
    inputSchema: { planId: z.string().min(1) },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ planId }) => { const plan = await store.get(planId); if (!plan) return errorText('PLAN_NOT_FOUND', `Plan not found: ${planId}`); return text(plan); });

  // ---- Approval + Execution ----

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
        const current = await store.get(planId);
        return errorText('EXECUTION_FAILED', message, { plan: current ?? plan });
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
        const current = await store.get(planId);
        return errorText('EXECUTION_FAILED', message, { plan: current ?? refreshedPlan });
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
