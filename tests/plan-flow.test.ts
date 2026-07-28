import { describe, expect, it } from 'vitest';
import { MockDevPanelClient } from '../src/clients/mock-devpanel.js';
import { InMemoryPlanStore } from '../src/stores/plan-store.js';
import { PlanService } from '../src/services/plan-service.js';
import { ExecutionService } from '../src/services/execution-service.js';

describe('plan -> approval -> execute', () => {
  it('does not execute before approval and executes exact approved hash', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);
    const executor = new ExecutionService(dp, store);

    const plan = await plans.backupPlan('app_demo_1');
    const first = await executor.execute(plan.id);
    expect(first.state).toBe('APPROVAL_REQUIRED');

    await store.setApproval(plan.id, {
      decision: 'APPROVE', planHash: plan.hash, approvedAt: new Date().toISOString(),
      approvedBy: 'test-user', source: 'test'
    });

    const result = await executor.execute(plan.id);
    expect(result.state).toBe('EXECUTED');
    const backups = await dp.listBackups(await dp.getApplication('app_demo_1'));
    expect(backups).toHaveLength(1);
  });
});
