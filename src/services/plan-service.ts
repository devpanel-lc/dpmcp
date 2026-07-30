import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import type { ChangePlan, PlanAction, PlanStep, Preconditions, RiskLevel } from '../domain/types.js';
import type { DevPanelClient, CreateApplicationRequest } from '../clients/devpanel.js';
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
    const existing = await this.dp.listApplications(input.repositoryName);
    const same = existing.find(a => (a.name ?? '').toLowerCase() === input.repositoryName.toLowerCase());
    if (same) throw new Error(`Application/project name conflict candidate already exists: ${same.name} (${same.id})`);
    return this.createPlan({
      action: 'CREATE_APPLICATION', risk: 'LOW', ownerId,
      summary: `Create application from ${input.repositoryOwner}/${input.repositoryName} (${input.branch})`,
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
      ],
      preconditions: {},
      expectedResult: 'A new DevPanel application exists and can be read through the Applications API.',
      rollback: 'Delete the newly-created application/project if creation partially succeeds and cleanup is safe.'
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
