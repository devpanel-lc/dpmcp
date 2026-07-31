import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import type { ChangePlan, PlanAction, PlanStep, Preconditions, RiskLevel, ActivateConfig } from '../domain/types.js';
import type { DevPanelClient, CreateApplicationRequest, CreateWorkspaceRequest } from '../clients/devpanel.js';
import type { PlanStore } from '../stores/plan-store.js';
import { hashPlan } from '../utils/hash.js';
import { applicationFingerprint } from '../utils/fingerprint.js';
import { ApplicationResolver } from './application-resolver.js';

const OWNER_ID_LOCAL = 'local';

export class PlanService {
  private readonly resolver: ApplicationResolver;
  constructor(private readonly dp: DevPanelClient, private readonly store: PlanStore) {
    this.resolver = new ApplicationResolver(dp);
  }

  async createApplicationPlan(input: CreateApplicationRequest, ownerId = OWNER_ID_LOCAL): Promise<ChangePlan> {
    const existing = await this.dp.listApplications(input.workspaceId, input.repositoryName);
    const same = existing.find(a => (a.name ?? '').toLowerCase() === input.repositoryName.toLowerCase());
    if (same) throw new Error(`Application/project name conflict candidate already exists: ${same.name} (${same.id})`);
    return this.createPlan({
      action: 'CREATE_APPLICATION', risk: 'LOW', ownerId,
      summary: `Create application ${input.name} from ${input.repositoryOwner}/${input.repositoryName} (${input.branch})`,
      target: {
        workspaceId: input.workspaceId,
        repository: `${input.repositoryOwner}/${input.repositoryName}`,
        branch: input.branch,
        projectType: input.projectType,
      },
      proposedInput: input as unknown as Record<string, unknown>,
      steps: [
        step(1, 'CREATE_PROJECT', 'Create a DevPanel project using the verified create profile', true),
        step(2, 'WAIT_APPLICATION', 'Wait for the project application to appear', false),
        step(3, 'VERIFY_READY', 'Read the created application and report its status/URL', false),
        step(4, 'NOTE_ACTIVATE', 'After this plan succeeds, read the created application status: if UNDEPLOY_APPLICATION_SUCCESS, create and execute an ACTIVATE_APPLICATION plan to deploy to K8s; if it is already DEPLOY_APPLICATION_SUCCESS, it is already serving traffic and no activation is needed', false),
      ],
      preconditions: {},
      expectedResult: 'A new DevPanel application exists. If its status is UNDEPLOY_APPLICATION_SUCCESS it must be activated before it serves traffic; if DEPLOY_APPLICATION_SUCCESS it is already deployed.',
      rollback: 'Delete the newly-created application/project if creation partially succeeds and cleanup is safe.'
    });
  }

  async createWorkspacePlan(input: CreateWorkspaceRequest, ownerId = OWNER_ID_LOCAL): Promise<ChangePlan> {
    const envs = await this.dp.listEnvironments();
    const env = envs.find(e => e.id === input.environmentId);
    if (!env) {
      throw new Error(
        `Environment not found: ${input.environmentId}. List environments with devpanel_list_environments, or create one in the DevPanel UI first (environment provisioning is not yet supported via MCP).`
      );
    }
    return this.createPlan({
      action: 'CREATE_WORKSPACE', risk: 'LOW', ownerId,
      summary: `Create workspace ${input.name} on environment ${env.name ?? input.environmentId}`,
      target: { environmentId: input.environmentId, environmentName: env.name ?? null },
      proposedInput: input as unknown as Record<string, unknown>,
      steps: [
        step(1, 'VERIFY_ENVIRONMENT', 'Verify the target environment still exists', false),
        step(2, 'CREATE_WORKSPACE', 'Create the DevPanel workspace on the existing environment', true),
        step(3, 'VERIFY_WORKSPACE', 'List workspaces and confirm the new workspace is visible', false),
      ],
      preconditions: { environmentId: input.environmentId },
      expectedResult: `A new DevPanel workspace "${input.name}" exists on environment ${env.name ?? input.environmentId}.`,
      rollback: 'No delete-workspace API is confirmed; rollback is not guaranteed. The existing environment is not modified.'
    });
  }

  async activatePlan(application: string, activateConfig: ActivateConfig, ownerId = OWNER_ID_LOCAL, workspaceId?: string): Promise<ChangePlan> {
    const app = await this.resolver.resolve(application, workspaceId);
    if (app.status !== 'UNDEPLOY_APPLICATION_SUCCESS') {
      if (app.status === 'DEPLOY_APPLICATION_SUCCESS') {
        throw new Error(`Application ${app.name ?? app.id} is already deployed (DEPLOY_APPLICATION_SUCCESS); no activation is needed. Verify its status and URL with devpanel_list_applications or devpanel_get_application.`);
      }
      throw new Error(`Application ${app.name ?? app.id} has status "${app.status}". Activation requires status UNDEPLOY_APPLICATION_SUCCESS; check the current status with devpanel_get_application before retrying.`);
    }
    return this.createPlan({
      action: 'ACTIVATE_APPLICATION', risk: 'MEDIUM', ownerId,
      summary: `Activate (deploy) application ${app.name ?? app.id} to K8s`,
      target: appSummary(app),
      proposedInput: { ...appSummary(app), activateConfig },
      steps: [
        step(1, 'REVALIDATE', 'Verify application is still in UNDEPLOY_APPLICATION_SUCCESS status', false),
        step(2, 'ACTIVATE_APPLICATION', 'Deploy the application to Kubernetes via PATCH /activate', true),
        step(3, 'VERIFY_ACTIVATED', 'Poll application status until it reaches DEPLOY_APPLICATION_SUCCESS or fails', false),
      ],
      preconditions: snapshot(app),
      expectedResult: `Application ${app.name ?? app.id} is deployed to Kubernetes with status DEPLOY_APPLICATION_SUCCESS.`,
      rollback: 'Undeploy via the DevPanel deactivate endpoint (UI or API); a devpanel_deactivate_application MCP tool is not yet implemented.'
    });
  }

  async backupPlan(application: string, ownerId = OWNER_ID_LOCAL): Promise<ChangePlan> {
    const app = await this.resolver.resolve(application);
    return this.createPlan({
      action: 'BACKUP_APPLICATION', risk: 'LOW', ownerId, summary: `Create a manual backup of ${app.name ?? app.id}`,
      target: appSummary(app), proposedInput: { applicationId: app.id },
      steps: [step(1, 'CREATE_BACKUP', 'Create MANUAL application backup', true), step(2, 'VERIFY_BACKUP', 'List backups and verify the new backup is visible', false)],
      preconditions: snapshot(app), expectedResult: 'A new MANUAL backup exists.', rollback: 'Delete the backup if needed.'
    });
  }

  async restorePlan(application: string, backupId?: string, ownerId = OWNER_ID_LOCAL): Promise<ChangePlan> {
    const app = await this.resolver.resolve(application);
    const backups = await this.dp.listBackups(app);
    const selected = backupId ? backups.find(b => b.id === backupId) : backups[0];
    if (!selected) throw new Error(backupId ? `Backup not found: ${backupId}` : 'No backup exists to restore');
    return this.createPlan({
      action: 'RESTORE_APPLICATION', risk: 'HIGH', ownerId, summary: `Restore ${app.name ?? app.id} from backup ${selected.id}`,
      target: { ...appSummary(app), backupId: selected.id }, proposedInput: { applicationId: app.id, backupId: selected.id },
      steps: [step(1, 'REVALIDATE', 'Verify application and backup still match the reviewed plan', false), step(2, 'RESTORE_BACKUP', 'Restore the selected backup into the application', true), step(3, 'VERIFY_APPLICATION', 'Read application state after restore', false)],
      preconditions: { ...snapshot(app), backupId: selected.id }, expectedResult: `Application restored from backup ${selected.id}.`, rollback: 'Create a new backup before restore in a production implementation; restore that safety backup if rollback is required.'
    });
  }

  async deletePlan(application: string, ownerId = OWNER_ID_LOCAL): Promise<ChangePlan> {
    const app = await this.resolver.resolve(application);
    const backups = await this.dp.listBackups(app);
    return this.createPlan({
      action: 'DELETE_APPLICATION', risk: 'HIGH', ownerId, summary: `Delete ${app.name ?? app.id}`,
      target: { ...appSummary(app), latestBackup: backups[0]?.id ?? null }, proposedInput: { applicationId: app.id },
      steps: [step(1, 'REVALIDATE', 'Verify target application still matches the reviewed plan', false), step(2, 'DELETE_APPLICATION', 'Delete the DevPanel application', true), step(3, 'VERIFY_DELETED', 'Confirm the application can no longer be resolved', false)],
      preconditions: snapshot(app), expectedResult: 'The selected application no longer exists.', rollback: backups[0] ? `Recovery may be possible from backup ${backups[0].id}, depending on DevPanel retention semantics.` : 'No backup was found; rollback is not guaranteed.',
    });
  }

  private async createPlan(input: { action: PlanAction; risk: RiskLevel; ownerId: string; summary: string; target: Record<string, unknown>; proposedInput: Record<string, unknown>; steps: PlanStep[]; preconditions: Preconditions; expectedResult: string; rollback: string; }): Promise<ChangePlan> {
    const now = new Date();
    const base = {
      id: `plan_${randomUUID()}`, version: 1 as const, action: input.action,
      status: 'PENDING_APPROVAL' as const, risk: input.risk, summary: input.summary,
      createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + config.planTtlSeconds * 1000).toISOString(),
      ownerId: input.ownerId,
      target: input.target, proposedInput: input.proposedInput, steps: input.steps,
      preconditions: input.preconditions, expectedResult: input.expectedResult, rollback: input.rollback,
    };
    const plan: ChangePlan = { ...base, hash: hashPlan(base) };
    await this.store.save(plan);
    return plan;
  }
}

function step(order: number, operation: string, description: string, mutates: boolean): PlanStep { return { order, operation, description, mutates }; }
function appSummary(app: { id: string; projectId: string; workspaceId: string; name?: string; hostname?: string; status?: string }) { return { applicationId: app.id, applicationName: app.name, projectId: app.projectId, workspaceId: app.workspaceId, hostname: app.hostname, status: app.status }; }
function snapshot(app: Parameters<typeof applicationFingerprint>[0]): Preconditions { return { applicationId: app.id, projectId: app.projectId, workspaceId: app.workspaceId, applicationStatus: app.status, appFingerprint: applicationFingerprint(app) }; }
