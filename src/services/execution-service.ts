import type { DevPanelClient, CreateApplicationRequest } from '../clients/devpanel.js';
import type { ChangePlan } from '../domain/types.js';
import type { PlanStore } from '../stores/plan-store.js';
import { hashPlan } from '../utils/hash.js';
import { applicationFingerprint } from '../utils/fingerprint.js';

export class ExecutionService {
  constructor(private readonly dp: DevPanelClient, private readonly store: PlanStore) {}

  async executeApprovedPlan(plan: ChangePlan): Promise<{ state: 'EXECUTED'; plan: ChangePlan; result?: unknown }> {
    this.verifyIntegrity(plan);
    if (new Date(plan.expiresAt).getTime() <= Date.now()) {
      await this.store.setStatus(plan.id, 'STALE');
      throw new Error('Plan expired. Create and review a new plan.');
    }
    if (!plan.approval || plan.approval.decision !== 'APPROVE') {
      throw new Error('Plan has not been approved');
    }
    if (plan.approval.planHash !== plan.hash) throw new Error('Approval is not bound to the current plan hash');

    await this.revalidate(plan);
    return this.performExecution(plan);
  }

  async revalidatePlan(plan: ChangePlan): Promise<void> {
    await this.revalidate(plan);
  }

  private async revalidate(plan: ChangePlan): Promise<void> {
    await this.store.setStatus(plan.id, 'VALIDATING');
    if (!plan.preconditions.applicationId) return;
    const app = await this.dp.getApplication(plan.preconditions.applicationId);
    if (plan.preconditions.appFingerprint && applicationFingerprint(app) !== plan.preconditions.appFingerprint) {
      await this.store.setStatus(plan.id, 'STALE');
      throw new Error('Plan is stale: application changed since planning. Create a new plan.');
    }
    if (plan.preconditions.backupId) {
      const backups = await this.dp.listBackups(app);
      if (!backups.some(b => b.id === plan.preconditions.backupId)) {
        await this.store.setStatus(plan.id, 'STALE');
        throw new Error('Plan is stale: selected backup no longer exists.');
      }
    }
  }

  private async performExecution(plan: ChangePlan): Promise<{ state: 'EXECUTED'; plan: ChangePlan; result?: unknown }> {
    plan = await this.store.setStatus(plan.id, 'EXECUTING');
    const startedAt = new Date().toISOString();
    await this.store.setExecution(plan.id, { startedAt });
    try {
      const result = await this.perform(plan);
      await this.store.setExecution(plan.id, { startedAt, finishedAt: new Date().toISOString(), result });
      plan = await this.store.setStatus(plan.id, 'SUCCEEDED');
      return { state: 'EXECUTED', plan, result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.store.setExecution(plan.id, { startedAt, finishedAt: new Date().toISOString(), error: message });
      await this.store.setStatus(plan.id, 'FAILED');
      throw error;
    }
  }

  private async perform(plan: ChangePlan): Promise<unknown> {
    switch (plan.action) {
      case 'CREATE_APPLICATION': return this.dp.createApplication(plan.proposedInput as unknown as CreateApplicationRequest);
      case 'BACKUP_APPLICATION': {
        const app = await this.dp.getApplication(String(plan.proposedInput.applicationId));
        return this.dp.createBackup(app);
      }
      case 'RESTORE_APPLICATION': {
        const app = await this.dp.getApplication(String(plan.proposedInput.applicationId));
        return this.dp.restoreBackup(app, String(plan.proposedInput.backupId));
      }
      case 'DELETE_APPLICATION': {
        const app = await this.dp.getApplication(String(plan.proposedInput.applicationId));
        return this.dp.deleteApplication(app);
      }
    }
  }

  private verifyIntegrity(plan: ChangePlan): void {
    if (hashPlan(plan) !== plan.hash) throw new Error('Plan integrity check failed');
  }

  private async requirePlan(id: string): Promise<ChangePlan> {
    const plan = await this.store.get(id);
    if (!plan) throw new Error(`Plan not found: ${id}`);
    return plan;
  }
}
