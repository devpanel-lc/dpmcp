import { describe, expect, it, vi } from 'vitest';
import { MockDevPanelClient } from '../src/clients/mock-devpanel.js';
import { InMemoryPlanStore } from '../src/stores/plan-store.js';
import { PlanService } from '../src/services/plan-service.js';
import { ExecutionService } from '../src/services/execution-service.js';
import { ApprovalService } from '../src/approval/approval-service.js';
import { hashPlan } from '../src/utils/hash.js';
import type { ChangePlan } from '../src/domain/types.js';
import { config } from '../src/config.js';

describe('plan -> approval -> execute', () => {
  it('does not execute before approval and executes exact approved hash', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);
    const executor = new ExecutionService(dp, store);

    const plan = await plans.backupPlan('app_demo_1');
    await expect(executor.executeApprovedPlan(plan)).rejects.toThrow('Plan has not been approved');

    await store.setApproval(plan.id, {
      decision: 'APPROVE', planHash: plan.hash, approvedAt: new Date().toISOString(),
      approvedBy: 'test-user', approvalMethod: 'MCP_ELICITATION'
    });

    const approvedPlan = await store.get(plan.id)!;
    const result = await executor.executeApprovedPlan(approvedPlan!);
    expect(result.state).toBe('EXECUTED');
    const backups = await dp.listBackups(await dp.getApplication('app_demo_1'));
    expect(backups).toHaveLength(1);
  });
});

describe('elicitation approval flow', () => {
  it('approves via form elicitation and executes', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);
    const executor = new ExecutionService(dp, store);

    const mockElicitFn = vi.fn().mockResolvedValue({
      action: 'accept',
      content: { confirm: true },
    });

    const approvalService = new ApprovalService(store, mockElicitFn, undefined);

    const plan = await plans.backupPlan('app_demo_1');
    const outcome = await approvalService.requestApproval(plan);

    expect(outcome.status).toBe('approved');
    if (outcome.status === 'approved') {
      expect(outcome.record.decision).toBe('APPROVE');
      expect(outcome.record.approvalMethod).toBe('MCP_ELICITATION');
      expect(outcome.record.planHash).toBe(plan.hash);
    }

    const approvedPlan = await store.get(plan.id)!;
    const result = await executor.executeApprovedPlan(approvedPlan!);
    expect(result.state).toBe('EXECUTED');

    const backups = await dp.listBackups(await dp.getApplication('app_demo_1'));
    expect(backups).toHaveLength(1);
  });

  it('declines via form elicitation and does not execute', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);
    const executor = new ExecutionService(dp, store);

    const mockElicitFn = vi.fn().mockResolvedValue({
      action: 'decline',
    });

    const approvalService = new ApprovalService(store, mockElicitFn, undefined);

    const plan = await plans.backupPlan('app_demo_1');
    const outcome = await approvalService.requestApproval(plan);

    expect(outcome.status).toBe('declined');
    if (outcome.status === 'declined') {
      expect(outcome.approvalMethod).toBe('MCP_ELICITATION');
    }

    await expect(executor.executeApprovedPlan(plan)).rejects.toThrow('Plan has not been approved');

    const backups = await dp.listBackups(await dp.getApplication('app_demo_1'));
    expect(backups).toHaveLength(0);
  });

  it('cancels via form elicitation in explicit form mode', async () => {
    const originalMode = config.approvalMode;
    config.approvalMode = 'form';

    try {
      const dp = new MockDevPanelClient();
      const store = new InMemoryPlanStore();
      const plans = new PlanService(dp, store);

      const mockElicitFn = vi.fn().mockResolvedValue({
        action: 'cancel',
      });

      const approvalService = new ApprovalService(store, mockElicitFn, undefined);

      const plan = await plans.backupPlan('app_demo_1');
      const outcome = await approvalService.requestApproval(plan);

      expect(outcome.status).toBe('cancelled');
    } finally {
      config.approvalMode = originalMode;
    }
  });

  it('falls back to external URL when elicitation is unavailable', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);

    const approvalService = new ApprovalService(store, undefined, undefined);

    const plan = await plans.backupPlan('app_demo_1');
    const outcome = await approvalService.requestApproval(plan);

    expect(outcome.status).toBe('url_fallback');
    if (outcome.status === 'url_fallback') {
      expect(outcome.approvalUrl).toContain(plan.id);
      expect(outcome.approvalUrl).toContain('/review/');
    }
  });
});

describe('security: model bypass attempts', () => {
  it('rejects execution when no approval record exists', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);
    const executor = new ExecutionService(dp, store);

    const plan = await plans.backupPlan('app_demo_1');
    await expect(executor.executeApprovedPlan(plan)).rejects.toThrow('Plan has not been approved');

    const backups = await dp.listBackups(await dp.getApplication('app_demo_1'));
    expect(backups).toHaveLength(0);
  });

  it('rejects execution when approval hash does not match plan hash', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);
    const executor = new ExecutionService(dp, store);

    const plan = await plans.backupPlan('app_demo_1');
    await store.setApproval(plan.id, {
      decision: 'APPROVE', planHash: 'sha256:wrong_hash', approvedAt: new Date().toISOString(),
      approvedBy: 'test-user', approvalMethod: 'MCP_ELICITATION'
    });

    const approvedPlan = await store.get(plan.id)!;
    await expect(executor.executeApprovedPlan(approvedPlan!)).rejects.toThrow('Approval is not bound to the current plan hash');

    const backups = await dp.listBackups(await dp.getApplication('app_demo_1'));
    expect(backups).toHaveLength(0);
  });

  it('rejects execution when plan hash is tampered', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);
    const executor = new ExecutionService(dp, store);

    const plan = await plans.backupPlan('app_demo_1');
    await store.setApproval(plan.id, {
      decision: 'APPROVE', planHash: plan.hash, approvedAt: new Date().toISOString(),
      approvedBy: 'test-user', approvalMethod: 'MCP_ELICITATION'
    });

    const tamperedPlan = await store.get(plan.id);
    if (tamperedPlan) {
      tamperedPlan.summary = 'TAMPERED SUMMARY';
      await store.save(tamperedPlan);
    }

    const tampered = await store.get(plan.id)!;
    await expect(executor.executeApprovedPlan(tampered!)).rejects.toThrow('Plan integrity check failed');
  });

  it('rejects execution of a rejected plan', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);
    const executor = new ExecutionService(dp, store);

    const plan = await plans.backupPlan('app_demo_1');
    await store.setApproval(plan.id, {
      decision: 'REJECT', planHash: plan.hash, approvedAt: new Date().toISOString(),
      approvedBy: 'test-user', approvalMethod: 'MCP_ELICITATION'
    });

    const rejectedPlan = await store.get(plan.id)!;
    await expect(executor.executeApprovedPlan(rejectedPlan!)).rejects.toThrow('Plan has not been approved');
  });
});

describe('stale and expired plans', () => {
  it('rejects execution of an expired plan', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);
    const executor = new ExecutionService(dp, store);

    const plan = await plans.backupPlan('app_demo_1');

    const expiredPlan: ChangePlan = {
      ...plan,
      expiresAt: new Date(Date.now() - 10000).toISOString(),
    };
    expiredPlan.hash = hashPlan(expiredPlan);
    await store.save(expiredPlan);

    await store.setApproval(plan.id, {
      decision: 'APPROVE', planHash: expiredPlan.hash, approvedAt: new Date().toISOString(),
      approvedBy: 'test-user', approvalMethod: 'MCP_ELICITATION'
    });

    const expired = await store.get(plan.id)!;
    await expect(executor.executeApprovedPlan(expired!)).rejects.toThrow('Plan expired');
  });

  it('marks plan STALE when application fingerprint changes', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);
    const executor = new ExecutionService(dp, store);

    const plan = await plans.backupPlan('app_demo_1');

    await store.setApproval(plan.id, {
      decision: 'APPROVE', planHash: plan.hash, approvedAt: new Date().toISOString(),
      approvedBy: 'test-user', approvalMethod: 'MCP_ELICITATION'
    });

    const app = await dp.getApplication('app_demo_1');
    app.status = 'DEPLOY_APPLICATION_UPDATING';
    (dp as unknown as { apps: Map<string, unknown> }).apps.set('app_demo_1', app);

    const approvedPlan = await store.get(plan.id)!;
    await expect(executor.executeApprovedPlan(approvedPlan!)).rejects.toThrow('Plan is stale');

    const stalePlan = await store.get(plan.id);
    expect(stalePlan?.status).toBe('STALE');
  });
});

describe('plan hash integrity', () => {
  it('produces deterministic hashes for identical plan data', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);

    const plan1 = await plans.backupPlan('app_demo_1');

    const hash1 = plan1.hash;
    const hash2 = hashPlan(plan1);

    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for different actions', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);

    const backupPlan = await plans.backupPlan('app_demo_1');
    const deletePlan = await plans.deletePlan('app_demo_1');

    expect(backupPlan.hash).not.toBe(deletePlan.hash);
  });
});
