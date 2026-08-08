import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DevPanelClient } from '../clients/devpanel.js';
import type { PlanStore } from '../stores/plan-store.js';
import { PlanService } from '../services/plan-service.js';
import { ExecutionService } from '../services/execution-service.js';
import { ApplicationResolver } from '../services/application-resolver.js';
import { ApprovalService } from '../approval/approval-service.js';
import type { ElicitFn } from '../approval/providers/form-elicitation.js';
import { config } from '../config.js';
import type { ErrorCode } from '../domain/types.js';
import { defineReadOnlyTool } from './read-only-tool.js';

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

/** Shared by tools that resolve a single application by id/name/search (activate,
 *  deactivate, and the code-server/phpMyAdmin toggle tools). */
const applicationLookupSchema = {
  workspaceId: z.string().optional().describe('Restrict application lookup to this workspace'),
  application: z.string().min(1).describe('Application ID, name, or search query'),
};

/**
 * Wrap client-native elicitation with a wait cap so a client that never
 * answers (doesn't implement elicitation, or opened no stream to receive the
 * request on) cannot hang the tool call forever. The SDK's own
 * `elicitInput()` already rejects per-client based on the capabilities the
 * connected client declared at `initialize` (`elicitation.form`/`.url`),
 * transport-independent — ApprovalService catches that rejection and falls
 * back to the external review URL (auto mode) or reports cancelled (form/url
 * modes), same as a timeout here.
 */
function withElicitationGuard(elicitation: ElicitFn): ElicitFn {
  return async (...args) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        elicitation(...args),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('elicitation timed out waiting for the client dialog')), config.elicitTimeoutMs);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  };
}

export function registerTools(server: McpServer, dp: DevPanelClient, store: PlanStore): void {
  const plans = new PlanService(dp, store);
  const executor = new ExecutionService(dp, store);
  const resolver = new ApplicationResolver(dp);
  // Per-dp-instance identity, not a global session singleton: in token auth
  // mode `dp` is scoped to this session's own forwarded bearer, so different
  // callers get different owner ids and can't approve/execute each other's
  // plans. See DevPanelClient.getCallerIdentity().
  const currentOwnerId = () => dp.getCallerIdentity();

  const elicitationFn = withElicitationGuard(server.server.elicitInput.bind(server.server));
  const approvalService = new ApprovalService(store, elicitationFn, elicitationFn);

  // ---- Discovery tools ----

  defineReadOnlyTool(server, 'devpanel_whoami',
    'Read-only. Get the DevPanel profile of whichever bearer token/session this MCP connection is authenticated as -- useful to confirm which DevPanel identity a token-mode session actually resolves to.',
    {},
    async () => text(await dp.whoami()));

  defineReadOnlyTool(server, 'devpanel_list_workspaces',
    'Read-only. List all DevPanel workspaces accessible to the authenticated user.',
    {},
    async () => text(await dp.listWorkspaces()));

  defineReadOnlyTool(server, 'devpanel_list_environments',
    'Read-only. List DevPanel environments (Kubernetes clusters), optionally filtered by search string. Environment IDs are required to plan workspace creation. If none exist, the environment must be created in the DevPanel UI first -- provisioning is not yet supported via MCP.',
    { search: z.string().optional() },
    async ({ search }) => {
      const environments = await dp.listEnvironments(search);
      if (environments.length === 0) {
        return text({
          status: 'no_environments',
          message: 'No environments found. Environment (cluster) creation is not yet supported via MCP -- create an environment in the DevPanel UI first, then list environments again to get its ID.',
        });
      }
      return text(environments);
    });

  defineReadOnlyTool(server, 'devpanel_list_projects',
    'Read-only. List all DevPanel projects in a workspace.',
    { workspaceId: z.string().min(1) },
    async ({ workspaceId }) => text(await dp.listProjects(workspaceId)));

  defineReadOnlyTool(server, 'devpanel_list_project_types',
    'Read-only. List available DevPanel project types (e.g. lamp, drupal11_v2, wordpress_v2).',
    {},
    async () => text(await dp.listProjectTypes()));

  defineReadOnlyTool(server, 'devpanel_list_applications',
    'Read-only. List DevPanel applications in a workspace, optionally filtered by search string.',
    { ...wsOpt, search: z.string().optional() },
    async ({ workspaceId, search }) => text(await dp.listApplications(workspaceId, search)));

  defineReadOnlyTool(server, 'devpanel_list_project_applications',
    'Read-only. List applications in a specific project within a workspace.',
    { workspaceId: z.string().min(1), projectId: z.string().min(1) },
    async ({ workspaceId, projectId }) => text(await dp.listProjectApplications(workspaceId, projectId)));

  // ---- Git provider tools ----

  defineReadOnlyTool(server, 'devpanel_list_git_owners',
    'Read-only. List connected Git providers and organizations (e.g. GitHub orgs/users). Requires OAuth or personal token to be configured first.',
    { provider: z.enum(['GITHUB', 'GITLAB', 'BITBUCKET']).default('GITHUB') },
    async ({ provider }) => text(await dp.listGitOwners(provider)));

  defineReadOnlyTool(server, 'devpanel_list_repositories',
    'Read-only. Search accessible Git repositories from connected providers.',
    { owner: z.string().optional(), provider: z.enum(['GITHUB', 'GITLAB', 'BITBUCKET']).default('GITHUB') },
    async ({ owner, provider }) => text(await dp.listRepositories(owner, provider)));

  defineReadOnlyTool(server, 'devpanel_list_repository_branches',
    'Read-only. List branches for a specific Git repository. Returns only the first page (max 50 branches, no pagination). repoId is a DevPanel-internal id and is ignored by the provider. Requires a personal token with repo scope for private repositories.',
    { owner: z.string().min(1), repoName: z.string().min(1), repoId: z.string().min(1), provider: z.enum(['GITHUB', 'GITLAB', 'BITBUCKET', 'DRUPALCODE']).default('GITHUB') },
    async ({ owner, repoName, repoId, provider }) => text(await dp.listRepositoryBranches(owner, repoName, repoId, provider)));

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

  defineReadOnlyTool(server, 'devpanel_get_application',
    'Read-only. Resolve an application by ID or unique search string and return normalized details.',
    { ...wsOpt, application: z.string().min(1) },
    async ({ application, workspaceId }) => text(await resolver.resolve(application, workspaceId)));

  defineReadOnlyTool(server, 'devpanel_get_application_activities',
    'Read-only. Get activity history for an application.',
    { ...wsOpt, application: z.string().min(1) },
    async ({ application, workspaceId }) => { const app = await resolver.resolve(application, workspaceId); return text(await dp.getApplicationActivities(app)); });

  defineReadOnlyTool(server, 'devpanel_get_activity_logs',
    'Read-only. Get HTTP access logs for an application container.',
    { ...wsOpt, application: z.string().min(1), containerName: z.string().default('php'), pageSize: z.number().default(100) },
    async ({ application, workspaceId, containerName, pageSize }) => { const app = await resolver.resolve(application, workspaceId); return text(await dp.getApplicationLogs(app, containerName, pageSize)); });

  defineReadOnlyTool(server, 'devpanel_list_backups',
    'Read-only. List backups for an application.',
    { ...wsOpt, application: z.string().min(1) },
    async ({ application, workspaceId }) => { const app = await resolver.resolve(application, workspaceId); return text(await dp.listBackups(app)); });

  defineReadOnlyTool(server, 'devpanel_get_backup_download_url',
    'Read-only. Get a pre-signed download URL (valid 1h) for a specific file from an application backup. Obtain backupId and fileId from devpanel_list_backups -- each backup\'s raw data has databaseFile, filesFile, and sourcecodeFile objects, each with an _id to pass as fileId. For PgDB-enabled applications the response also includes downloadPgsqlURL.',
    { ...wsOpt, application: z.string().min(1), backupId: z.string().min(1), fileId: z.string().min(1) },
    async ({ application, workspaceId, backupId, fileId }) => { const app = await resolver.resolve(application, workspaceId); return text(await dp.getBackupFile(app, backupId, fileId)); });

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
      ...applicationLookupSchema,
      groupType: z.enum(['spot', 'on-demand']).default('on-demand'),
      capacity: z.string().default('micro'),
      capacityLimit: z.string().optional(),
      copyDatabaseFilesType: z.string().optional().describe('Default empty string (no copied database)'),
      isEnablePgDb: z.boolean().optional(),
      isEnablePPA: z.boolean().optional(),
      filePermissionLevel: z.string().optional().describe('Default stricterPermission'),
      secretManager: z.string().optional().describe('Default empty string (no secret manager)'),
      isFromGit: z.boolean().default(true),
      appRoot: z.string().default('/var/www/html'),
      webRoot: z.string().default('/var/www/html/web'),
      containerImage: z.string().optional().describe('Default devpanel/php:8.3-base-rc'),
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
      copyDatabaseFilesType: args.copyDatabaseFilesType,
      isEnablePgDb: args.isEnablePgDb,
      isEnablePPA: args.isEnablePPA,
      filePermissionLevel: args.filePermissionLevel,
      secretManager: args.secretManager,
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

  server.registerTool('devpanel_plan_deactivate_application', {
    description: 'PLAN ONLY. Create an immutable proposed plan to deactivate (undeploy/pause, stop serving traffic) an existing DevPanel application. The application must be in DEPLOY_APPLICATION_SUCCESS status; if it is already in UNDEPLOY_APPLICATION_SUCCESS status, no deactivation is needed. Storage/data is preserved -- use devpanel_plan_activate_application to bring it back.',
    inputSchema: applicationLookupSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ application, workspaceId }) => text({ plan: await plans.deactivatePlan(application, currentOwnerId(), workspaceId), next: 'Plan created. Call devpanel_approve_and_execute_plan with the plan ID to request human approval and execute.' }));

  const toggleFeatureAnnotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false };
  const REAL_MODE_CAVEAT = 'Uses a confirmed real DevPanel request (PATCH .../applications/{id}/update with the app\'s full config, one field flipped). Other current settings (container image, capacity, storage) are read live and carried over unchanged; the execute step fails with a clear error if any of those cannot be read from DevPanel rather than guessing them.';

  server.registerTool('devpanel_plan_enable_code_server', {
    description: `PLAN ONLY. Create a proposed plan to enable the in-browser code server (VSCode) on a deployed application. Requires status DEPLOY_APPLICATION_SUCCESS. ${REAL_MODE_CAVEAT}`,
    inputSchema: applicationLookupSchema,
    annotations: toggleFeatureAnnotations,
  }, async ({ application, workspaceId }) => text({ plan: await plans.enableEditorPlan(application, currentOwnerId(), workspaceId), next: 'Plan created. Call devpanel_approve_and_execute_plan with the plan ID to request human approval and execute.' }));

  server.registerTool('devpanel_plan_disable_code_server', {
    description: `PLAN ONLY. Create a proposed plan to disable the in-browser code server (VSCode) on a deployed application. Requires status DEPLOY_APPLICATION_SUCCESS. ${REAL_MODE_CAVEAT}`,
    inputSchema: applicationLookupSchema,
    annotations: toggleFeatureAnnotations,
  }, async ({ application, workspaceId }) => text({ plan: await plans.disableEditorPlan(application, currentOwnerId(), workspaceId), next: 'Plan created. Call devpanel_approve_and_execute_plan with the plan ID to request human approval and execute.' }));

  server.registerTool('devpanel_plan_enable_phpmyadmin', {
    description: `PLAN ONLY. Create a proposed plan to enable phpMyAdmin on a deployed application. Requires status DEPLOY_APPLICATION_SUCCESS. ${REAL_MODE_CAVEAT}`,
    inputSchema: applicationLookupSchema,
    annotations: toggleFeatureAnnotations,
  }, async ({ application, workspaceId }) => text({ plan: await plans.enablePmaPlan(application, currentOwnerId(), workspaceId), next: 'Plan created. Call devpanel_approve_and_execute_plan with the plan ID to request human approval and execute.' }));

  server.registerTool('devpanel_plan_disable_phpmyadmin', {
    description: `PLAN ONLY. Create a proposed plan to disable phpMyAdmin on a deployed application. Requires status DEPLOY_APPLICATION_SUCCESS. ${REAL_MODE_CAVEAT}`,
    inputSchema: applicationLookupSchema,
    annotations: toggleFeatureAnnotations,
  }, async ({ application, workspaceId }) => text({ plan: await plans.disablePmaPlan(application, currentOwnerId(), workspaceId), next: 'Plan created. Call devpanel_approve_and_execute_plan with the plan ID to request human approval and execute.' }));

  server.registerTool('devpanel_plan_backup_application', {
    description: 'PLAN ONLY. Create a proposed manual-backup plan. Does not change DevPanel.',
    inputSchema: applicationLookupSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ application, workspaceId }) => text({ plan: await plans.backupPlan(application, currentOwnerId(), workspaceId) }));

  server.registerTool('devpanel_plan_restore_application', {
    description: 'DISABLED. Restoring a backup is not supported via DevPanel MCP or the DevPanel UI. Instead, get the database dump with devpanel_get_backup_download_url and import it into the application\'s database using phpMyAdmin.',
    inputSchema: { ...wsOpt, application: z.string().min(1), backupId: z.string().optional() },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async () => text({
    status: 'unsupported',
    warning: 'Restoring a backup is not supported via DevPanel MCP -- DevPanel has no UI restore feature either, so this endpoint\'s contract has never been verified against a real backend (see README.md).',
    manualSteps: [
      'Call devpanel_get_backup_download_url with the backup\'s databaseFile _id as fileId to get the database dump.',
      'Import that dump into the application\'s database using phpMyAdmin.',
    ],
  }));

  server.registerTool('devpanel_plan_delete_application', {
    description: 'PLAN ONLY. Create a proposed deletion plan after reading current application and backup state. Does not change DevPanel.',
    inputSchema: applicationLookupSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ application, workspaceId }) => text({ plan: await plans.deletePlan(application, currentOwnerId(), workspaceId) }));

  server.registerTool('devpanel_plan_delete_project', {
    description: 'PLAN ONLY. Create a proposed plan to delete a DevPanel project. If the project still has applications, this fails and lists them -- delete all of them first with devpanel_plan_delete_application (and devpanel_approve_and_execute_plan) before retrying.',
    inputSchema: { ...wsOpt, project: z.string().min(1).describe('Project ID or name') },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ project, workspaceId }) => text({ plan: await plans.deleteProjectPlan(workspaceId, project, currentOwnerId()), next: 'Plan created. Call devpanel_approve_and_execute_plan with the plan ID to request human approval and execute.' }));

  server.registerTool('devpanel_plan_delete_workspace', {
    description: 'PLAN ONLY. Create a proposed plan to delete a DevPanel workspace. If the workspace still has projects, this fails and lists them -- delete all of them first with devpanel_plan_delete_project (each project must itself have zero applications) before retrying.',
    inputSchema: { workspace: z.string().min(1).describe('Workspace ID or name') },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ workspace }) => text({ plan: await plans.deleteWorkspacePlan(workspace, currentOwnerId()), next: 'Plan created. Call devpanel_approve_and_execute_plan with the plan ID to request human approval and execute.' }));

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

  defineReadOnlyTool(server, 'devpanel_get_plan',
    'Read-only. Get an immutable change plan, its approval status, and any execution result.',
    { planId: z.string().min(1) },
    async ({ planId }) => { const plan = await store.get(planId); if (!plan) return errorText('PLAN_NOT_FOUND', `Plan not found: ${planId}`); return text(plan); });

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
