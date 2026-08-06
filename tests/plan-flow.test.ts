import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { MockDevPanelClient } from '../src/clients/mock-devpanel.js';
import { RealDevPanelClient } from '../src/clients/real-devpanel.js';
import { InMemoryPlanStore } from '../src/stores/plan-store.js';
import { PlanService } from '../src/services/plan-service.js';
import { ExecutionService } from '../src/services/execution-service.js';
import { ApprovalService } from '../src/approval/approval-service.js';
import { hashPlan } from '../src/utils/hash.js';
import { currentOwnerId, TokenScopedDevPanelClient } from '../src/clients/token-scoped-client.js';
import { clearSession, saveSession } from '../src/auth/session.js';
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
    const backups = await dp.listBackups(await dp.getApplication({ id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'mock-workspace' }));
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

    const backups = await dp.listBackups(await dp.getApplication({ id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'mock-workspace' }));
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

    const backups = await dp.listBackups(await dp.getApplication({ id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'mock-workspace' }));
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

    const backups = await dp.listBackups(await dp.getApplication({ id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'mock-workspace' }));
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

    const backups = await dp.listBackups(await dp.getApplication({ id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'mock-workspace' }));
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

    const app = await dp.getApplication({ id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'mock-workspace' });
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

describe('session-scoped client and owner identity', () => {
  const testSession = {
    accessToken: 'access-token-1',
    idToken: 'id-token-1',
    refreshToken: 'refresh-token-1',
    sub: 'c979c90e-9081-7091-a748-b2e15604c2ef',
    email: 'lc@devpanel.com',
    expiresAt: Date.now() + 60_000,
  };

  beforeEach(() => {
    clearSession();
  });

  afterEach(() => {
    clearSession();
  });

  it('currentOwnerId() returns "local" with no session', () => {
    expect(currentOwnerId()).toBe('local');
  });

  it('currentOwnerId() returns the Cognito sub from the session', () => {
    saveSession(testSession);
    expect(currentOwnerId()).toBe('c979c90e-9081-7091-a748-b2e15604c2ef');
  });

  it('currentOwnerId() is consistent across calls for the same session', () => {
    saveSession(testSession);
    expect(currentOwnerId()).toBe(currentOwnerId());
  });

  it('currentOwnerId() returns a different owner for a different session', () => {
    saveSession(testSession);
    const idA = currentOwnerId();
    saveSession({ ...testSession, sub: 'other-sub-456' });
    expect(idA).not.toBe(currentOwnerId());
  });

  it('TokenScopedDevPanelClient falls back to mock in mock mode', async () => {
    const client = new TokenScopedDevPanelClient();
    const apps = await client.listApplications('ws_mock_1');
    expect(Array.isArray(apps)).toBe(true);
  });

  it('plan created with a session carries ownerId = sub', async () => {
    saveSession(testSession);
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);

    const plan = await plans.backupPlan('app_demo_1', currentOwnerId());
    expect(plan.ownerId).toBe('c979c90e-9081-7091-a748-b2e15604c2ef');
  });

  it('plan created without a session carries ownerId "local"', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);

    const plan = await plans.backupPlan('app_demo_1');
    expect(plan.ownerId).toBe('local');
  });
});

describe('discovery methods', () => {
  it('listWorkspaces returns mock workspaces', async () => {
    const dp = new MockDevPanelClient();
    const workspaces = await dp.listWorkspaces();
    expect(workspaces.length).toBeGreaterThan(0);
    expect(workspaces[0]).toHaveProperty('id');
    expect(workspaces[0]).toHaveProperty('name');
  });

  it('listProjects returns workspace-scoped projects', async () => {
    const dp = new MockDevPanelClient();
    const projects = await dp.listProjects('ws_mock_1');
    expect(projects.length).toBeGreaterThan(0);
    expect(projects[0].workspaceId).toBe('ws_mock_1');
  });

  it('listProjectTypes returns type definitions', async () => {
    const dp = new MockDevPanelClient();
    const types = await dp.listProjectTypes();
    expect(types.length).toBeGreaterThan(0);
    expect(types[0]).toHaveProperty('key');
  });

  it('listApplications is workspace-scoped', async () => {
    const dp = new MockDevPanelClient();
    const apps = await dp.listApplications('ws_mock_1');
    expect(apps.length).toBeGreaterThan(0);
    const emptyWs = await dp.listApplications('nonexistent');
    expect(emptyWs).toHaveLength(0);
  });

  it('listProjectApplications returns scoped apps', async () => {
    const dp = new MockDevPanelClient();
    const apps = await dp.listProjectApplications('ws_mock_1', 'project_demo_1');
    expect(apps.length).toBeGreaterThan(0);
    expect(apps[0].projectId).toBe('project_demo_1');
  });
});

describe('getBackupFile', () => {
  it('returns an absolute download URL for an existing backup', async () => {
    const dp = new MockDevPanelClient();
    const app = await dp.getApplication({ id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'ws_mock_1' });
    const backup = await dp.createBackup(app);
    const file = await dp.getBackupFile(app, backup.id, 'file_1');
    expect(file.backupId).toBe(backup.id);
    expect(file.fileId).toBe('file_1');
    expect(file.downloadURL).toMatch(/^https:\/\//);
  });

  it('throws for an unknown backupId', async () => {
    const dp = new MockDevPanelClient();
    const app = await dp.getApplication({ id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'ws_mock_1' });
    await expect(dp.getBackupFile(app, 'nonexistent', 'file_1')).rejects.toThrow('Backup not found');
  });
});

describe('activate flow', () => {
  it('creates an activate plan and executes it', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);
    const executor = new ExecutionService(dp, store);

    const plan = await plans.activatePlan('app_demo_1', {
      groupType: 'on-demand', capacity: 'micro', isFromGit: true,
      appRoot: '/var/www/html', webRoot: '/var/www/html',
    });

    expect(plan.action).toBe('ACTIVATE_APPLICATION');
    expect(plan.steps.length).toBeGreaterThan(0);

    await store.setApproval(plan.id, {
      decision: 'APPROVE', planHash: plan.hash, approvedAt: new Date().toISOString(),
      approvedBy: 'test-user', approvalMethod: 'MCP_ELICITATION',
    });

    const approvedPlan = await store.get(plan.id)!;
    const result = await executor.executeApprovedPlan(approvedPlan!);
    expect(result.state).toBe('EXECUTED');

    const app = await dp.getApplication({ id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'ws_mock_1' });
    expect(app.status).toBe('DEPLOY_APPLICATION_SUCCESS');
  });

  it('rejects activate when app is already deployed', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);

    await dp.activateApplication(
      { id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'ws_mock_1' },
      { groupType: 'on-demand', capacity: 'micro' },
    );

    await expect(plans.activatePlan('app_demo_1', {
      groupType: 'on-demand', capacity: 'micro',
    })).rejects.toThrow('already deployed (DEPLOY_APPLICATION_SUCCESS); no activation is needed');
  });

  it('activatePlan scopes resolution to the given workspace', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);

    const plan = await plans.activatePlan('app_demo_1', {
      groupType: 'on-demand', capacity: 'micro',
    }, 'local', 'ws_mock_1');
    expect(plan.action).toBe('ACTIVATE_APPLICATION');

    await expect(plans.activatePlan('app_demo_1', {
      groupType: 'on-demand', capacity: 'micro',
    }, 'local', 'ws_nonexistent')).rejects.toThrow('No application matches');
  });

  it('real client activateApplication polls until DEPLOY_APPLICATION_SUCCESS', async () => {
    vi.useFakeTimers();
    let polls = 0;
    const appJson = (status: string) => ({ _id: 'app_1', status, project: { _id: 'p_1', workspace: { _id: 'ws_1' } } });
    const fetchMock = vi.fn(async (url: string) => {
      const path = String(url);
      if (path.endsWith('/activate')) {
        return { ok: true, text: async () => JSON.stringify(appJson('DEPLOYING')) };
      }
      polls += 1;
      return { ok: true, text: async () => JSON.stringify({ items: [appJson(polls === 1 ? 'DEPLOYING' : 'DEPLOY_APPLICATION_SUCCESS')] }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    try {
      const client = new RealDevPanelClient('test-token');
      const promise = client.activateApplication(
        { id: 'app_1', projectId: 'p_1', workspaceId: 'ws_1' },
        { groupType: 'on-demand', capacity: 'micro' },
      );
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(2000);
      const result = await promise;
      expect(result.status).toBe('DEPLOY_APPLICATION_SUCCESS');
      expect(polls).toBe(2);
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });

  it('create plan includes name and notes activate step', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);

    const plan = await plans.createApplicationPlan({
      workspaceId: 'ws_mock_1', name: 'Test App',
      repositoryOwner: 'test', repositoryName: 'test-repo',
      repositoryProvider: 'github', branch: 'main', projectType: 'lamp',
    });

    expect(plan.action).toBe('CREATE_APPLICATION');
    expect(plan.summary).toContain('Test App');
    const noteStep = plan.steps.find(s => s.operation === 'NOTE_ACTIVATE');
    expect(noteStep).toBeDefined();
  });
});

describe('deactivate flow', () => {
  it('creates a deactivate plan and executes it', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);
    const executor = new ExecutionService(dp, store);

    await dp.activateApplication(
      { id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'ws_mock_1' },
      { groupType: 'on-demand', capacity: 'micro' },
    );

    const plan = await plans.deactivatePlan('app_demo_1');

    expect(plan.action).toBe('DEACTIVATE_APPLICATION');
    expect(plan.steps.length).toBeGreaterThan(0);

    await store.setApproval(plan.id, {
      decision: 'APPROVE', planHash: plan.hash, approvedAt: new Date().toISOString(),
      approvedBy: 'test-user', approvalMethod: 'MCP_ELICITATION',
    });

    const approvedPlan = await store.get(plan.id)!;
    const result = await executor.executeApprovedPlan(approvedPlan!);
    expect(result.state).toBe('EXECUTED');

    const app = await dp.getApplication({ id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'ws_mock_1' });
    expect(app.status).toBe('UNDEPLOY_APPLICATION_SUCCESS');
  });

  it('rejects deactivate when app is already undeployed', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);

    await expect(plans.deactivatePlan('app_demo_1')).rejects.toThrow('already undeployed (UNDEPLOY_APPLICATION_SUCCESS); no deactivation is needed');
  });

  it('deactivatePlan scopes resolution to the given workspace', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);

    await dp.activateApplication(
      { id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'ws_mock_1' },
      { groupType: 'on-demand', capacity: 'micro' },
    );

    const plan = await plans.deactivatePlan('app_demo_1', 'local', 'ws_mock_1');
    expect(plan.action).toBe('DEACTIVATE_APPLICATION');

    await expect(plans.deactivatePlan('app_demo_1', 'local', 'ws_nonexistent')).rejects.toThrow('No application matches');
  });

  it('real client deactivateApplication polls until UNDEPLOY_APPLICATION_SUCCESS', async () => {
    vi.useFakeTimers();
    let polls = 0;
    const appJson = (status: string) => ({ _id: 'app_1', status, project: { _id: 'p_1', workspace: { _id: 'ws_1' } } });
    const fetchMock = vi.fn(async (url: string) => {
      const path = String(url);
      if (path.endsWith('/deactivate')) {
        return { ok: true, text: async () => JSON.stringify(appJson('DEACTIVATING')) };
      }
      polls += 1;
      return { ok: true, text: async () => JSON.stringify({ items: [appJson(polls === 1 ? 'DEACTIVATING' : 'UNDEPLOY_APPLICATION_SUCCESS')] }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    try {
      const client = new RealDevPanelClient('test-token');
      const promise = client.deactivateApplication({ id: 'app_1', projectId: 'p_1', workspaceId: 'ws_1' });
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(2000);
      const result = await promise;
      expect(result.status).toBe('UNDEPLOY_APPLICATION_SUCCESS');
      expect(polls).toBe(2);
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });
});

describe('delete project flow', () => {
  it('blocks deleting a project that still has applications', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);

    await expect(plans.deleteProjectPlan('ws_mock_1', 'project_demo_1'))
      .rejects.toThrow(/still has 1 application\(s\).*Existing Demo.*devpanel_plan_delete_application/s);
  });

  it('creates a delete project plan and executes it once the project has no applications', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);
    const executor = new ExecutionService(dp, store);

    await dp.deleteApplication({ id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'ws_mock_1' });

    const plan = await plans.deleteProjectPlan('ws_mock_1', 'project_demo_1');
    expect(plan.action).toBe('DELETE_PROJECT');

    await store.setApproval(plan.id, {
      decision: 'APPROVE', planHash: plan.hash, approvedAt: new Date().toISOString(),
      approvedBy: 'test-user', approvalMethod: 'MCP_ELICITATION',
    });

    const approvedPlan = await store.get(plan.id)!;
    const result = await executor.executeApprovedPlan(approvedPlan!);
    expect(result.state).toBe('EXECUTED');

    const projects = await dp.listProjects('ws_mock_1');
    expect(projects.find(p => p.id === 'project_demo_1')).toBeUndefined();
  });

  it('resolves the project by name as well as id', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);

    await dp.deleteApplication({ id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'ws_mock_1' });

    const plan = await plans.deleteProjectPlan('ws_mock_1', 'Demo Project');
    expect(plan.target.projectId).toBe('project_demo_1');
  });

  it('rejects when no project matches the query', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);

    await expect(plans.deleteProjectPlan('ws_mock_1', 'nonexistent')).rejects.toThrow('No project matches');
  });
});

describe('editor/PMA toggle flow', () => {
  it('blocks toggling code server on an application that is not deployed', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);

    await expect(plans.enableEditorPlan('app_demo_1')).rejects.toThrow('can only be toggled on a deployed application');
  });

  it('enables code server and executes it once the application is deployed', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);
    const executor = new ExecutionService(dp, store);

    await dp.activateApplication(
      { id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'ws_mock_1' },
      { groupType: 'on-demand', capacity: 'micro' },
    );

    const plan = await plans.enableEditorPlan('app_demo_1');
    expect(plan.action).toBe('ENABLE_EDITOR');

    await store.setApproval(plan.id, {
      decision: 'APPROVE', planHash: plan.hash, approvedAt: new Date().toISOString(),
      approvedBy: 'test-user', approvalMethod: 'MCP_ELICITATION',
    });
    const approvedPlan = await store.get(plan.id)!;
    const result = await executor.executeApprovedPlan(approvedPlan!);
    expect(result.state).toBe('EXECUTED');

    const app = await dp.getApplication({ id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'ws_mock_1' });
    expect(app.isEnableEditor).toBe(true);
  });

  it('rejects enabling code server when it is already enabled', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);
    const app = { id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'ws_mock_1' };

    await dp.activateApplication(app, { groupType: 'on-demand', capacity: 'micro' });
    await dp.setEditorEnabled(app, true);

    await expect(plans.enableEditorPlan('app_demo_1')).rejects.toThrow('already enabled');
  });

  it('disables phpMyAdmin and executes it once the application is deployed', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);
    const executor = new ExecutionService(dp, store);
    const app = { id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'ws_mock_1' };

    await dp.activateApplication(app, { groupType: 'on-demand', capacity: 'micro' });
    await dp.setPmaEnabled(app, true);

    const plan = await plans.disablePmaPlan('app_demo_1');
    expect(plan.action).toBe('DISABLE_PMA');

    await store.setApproval(plan.id, {
      decision: 'APPROVE', planHash: plan.hash, approvedAt: new Date().toISOString(),
      approvedBy: 'test-user', approvalMethod: 'MCP_ELICITATION',
    });
    const approvedPlan = await store.get(plan.id)!;
    const result = await executor.executeApprovedPlan(approvedPlan!);
    expect(result.state).toBe('EXECUTED');

    const updated = await dp.getApplication(app);
    expect(updated.isEnablePMA).toBe(false);
  });

  it('real client setEditorEnabled reads current app config then PATCHes /update with one field flipped', async () => {
    let patchBody: Record<string, unknown> | undefined;
    const appJson = {
      _id: 'app_1', status: 'DEPLOY_APPLICATION_SUCCESS',
      project: { _id: 'p_1', workspace: { _id: 'ws_1' } },
      containerImage: 'devpanel/php:8.4-base', groupType: 'on-demand', capacity: 'micro',
      capacityLimit: 'small_1', storage: 5, isEnableEditor: false, isEnablePMA: false,
    };
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).endsWith('/update')) {
        patchBody = JSON.parse(String(init?.body));
        return { ok: true, text: async () => JSON.stringify({ ...appJson, isEnableEditor: true }) };
      }
      return { ok: true, text: async () => JSON.stringify(appJson) };
    });
    vi.stubGlobal('fetch', fetchMock);
    try {
      const client = new RealDevPanelClient('test-token');
      const result = await client.setEditorEnabled({ id: 'app_1', projectId: 'p_1', workspaceId: 'ws_1' }, true);
      expect(patchBody?.isEnableEditor).toBe(true);
      expect(patchBody?.containerImage).toBe('devpanel/php:8.4-base');
      expect(patchBody?.capacity).toBe('micro');
      expect(patchBody?.capacityLimit).toBe('small_1');
      expect(patchBody?.storage).toBe(5);
      expect(result.isEnableEditor).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('real client setPmaEnabled throws clearly when a required field is missing from the live application state', async () => {
    const appJson = {
      _id: 'app_1', status: 'DEPLOY_APPLICATION_SUCCESS',
      project: { _id: 'p_1', workspace: { _id: 'ws_1' } },
      // containerImage/groupType/capacity/capacityLimit/storage intentionally absent
    };
    const fetchMock = vi.fn(async () => ({ ok: true, text: async () => JSON.stringify(appJson) }));
    vi.stubGlobal('fetch', fetchMock);
    try {
      const client = new RealDevPanelClient('test-token');
      await expect(client.setPmaEnabled({ id: 'app_1', projectId: 'p_1', workspaceId: 'ws_1' }, true))
        .rejects.toThrow('current "containerImage" could not be read');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('real client application normalization', () => {
  it('extracts project/workspace ids from scalar or nested refs', async () => {
    const cases = [
      {
        raw: {
          _id: '6a6ff0f1839cedf7c2dabf0e', name: 'main', originBranch: 'main',
          applicationName: 'dev-d3d9de-dabefc-j17q66zmj46y',
          hostname: 'dev-d3d9de-dabefc-j17q66zmj46y.apps-drupalforge.click',
          project: '6a6ff0f1839cedf7c2dabefc', status: 'UPGRADING',
        },
        projectId: '6a6ff0f1839cedf7c2dabefc', workspaceId: 'mock-workspace',
        name: 'dev-d3d9de-dabefc-j17q66zmj46y', status: 'UPGRADING',
      },
      {
        raw: { _id: 'app_2', status: 'UNDEPLOY_APPLICATION_SUCCESS', project: { _id: 'p_2', workspace: { _id: 'w_2' } } },
        projectId: 'p_2', workspaceId: 'w_2', name: '', status: 'UNDEPLOY_APPLICATION_SUCCESS',
      },
      {
        raw: { _id: 'app_3', project: 'p_3', workspace: 'w_3' },
        projectId: 'p_3', workspaceId: 'w_3', name: '', status: undefined,
      },
    ];

    for (const c of cases) {
      const fetchMock = vi.fn(async () => ({ ok: true, text: async () => JSON.stringify({ items: [c.raw] }) }));
      vi.stubGlobal('fetch', fetchMock);
      try {
        const client = new RealDevPanelClient('test-token');
        const apps = await client.listApplications('ws_1');
        expect(apps.length).toBe(1);
        expect(apps[0].projectId).toBe(c.projectId);
        expect(apps[0].workspaceId).toBe(c.workspaceId);
        if (c.name) expect(apps[0].name).toBe(c.name);
        if (c.status) expect(apps[0].status).toBe(c.status);
      } finally {
        vi.unstubAllGlobals();
      }
    }
  });
});

describe('create application flow', () => {
  it('executes a CREATE_APPLICATION plan after approval and the app becomes visible', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);
    const executor = new ExecutionService(dp, store);

    const plan = await plans.createApplicationPlan({
      workspaceId: 'ws_mock_1', name: 'New App',
      repositoryOwner: 'test', repositoryName: 'new-repo',
      repositoryProvider: 'github', branch: 'main', projectType: 'lamp',
    });
    expect(plan.action).toBe('CREATE_APPLICATION');

    await store.setApproval(plan.id, {
      decision: 'APPROVE', planHash: plan.hash, approvedAt: new Date().toISOString(),
      approvedBy: 'test-user', approvalMethod: 'MCP_ELICITATION',
    });
    const approved = await store.get(plan.id);
    expect(approved).not.toBeNull();

    const result = await executor.executeApprovedPlan(approved!);
    expect(result.state).toBe('EXECUTED');

    const apps = await dp.listApplications('ws_mock_1');
    expect(apps.some(a => a.name === 'New App')).toBe(true);
  });
});

describe('real create gate', () => {
  const createInput = {
    workspaceId: 'ws_mock_1', name: 'Test App',
    repositoryOwner: 'test', repositoryName: 'test-repo',
    repositoryProvider: 'github', branch: 'main', projectType: 'lamp',
  };

  it('rejects create plan in real mode when real CREATE is disabled', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);

    const origMode = config.mode;
    const origEnable = config.enableRealCreate;
    config.mode = 'real';
    config.enableRealCreate = false;
    try {
      await expect(plans.createApplicationPlan(createInput)).rejects.toThrow('Real CREATE is disabled');
    } finally {
      config.mode = origMode;
      config.enableRealCreate = origEnable;
    }
  });

  it('rejects create plan in real mode when the profile is not verified', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);

    const origMode = config.mode;
    const origEnable = config.enableRealCreate;
    const origProfile = config.createProfile;
    config.mode = 'real';
    config.enableRealCreate = true;
    config.createProfile = 'unverified-test';
    try {
      await expect(plans.createApplicationPlan(createInput)).rejects.toThrow('is not verified');
    } finally {
      config.mode = origMode;
      config.enableRealCreate = origEnable;
      config.createProfile = origProfile;
    }
  });

  it('rejects create plan in real mode when repositoryId is missing', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);

    const origMode = config.mode;
    const origEnable = config.enableRealCreate;
    const origProfile = config.createProfile;
    config.mode = 'real';
    config.enableRealCreate = true;
    config.createProfile = 'drupal11-demo';
    try {
      await expect(plans.createApplicationPlan(createInput)).rejects.toThrow('repositoryId is required');
    } finally {
      config.mode = origMode;
      config.enableRealCreate = origEnable;
      config.createProfile = origProfile;
    }
  });

  it('real client createApplication sends the verified profile payload', async () => {
    let capturedBody: string | undefined;
    const fetchMock = vi.fn(async (url: string, init?: { method?: string; body?: string }) => {
      const method = init?.method ?? 'GET';
      if (method === 'POST' && String(url).endsWith('/projects')) {
        capturedBody = init?.body;
        return { ok: true, text: async () => JSON.stringify({ _id: 'project_123', name: 'Test App', workspace: 'ws_1' }) };
      }
      return { ok: true, text: async () => JSON.stringify({ items: [{ _id: 'app_1', status: 'UNDEPLOY_APPLICATION_SUCCESS', name: 'Test App', project: { _id: 'project_123', workspace: { _id: 'ws_1' } } }] }) };
    });
    vi.stubGlobal('fetch', fetchMock);

    const origMode = config.mode;
    const origEnable = config.enableRealCreate;
    const origProfile = config.createProfile;
    config.mode = 'real';
    config.enableRealCreate = true;
    config.createProfile = 'drupal11-demo';
    try {
      const client = new RealDevPanelClient('test-token');
      const app = await client.createApplication({
        workspaceId: 'ws_1', name: 'Test App',
        repositoryOwner: 'devpanel-lc', repositoryName: 'drupal-11',
        repositoryProvider: 'GITHUB', repositoryType: 'EXISTING', repositoryId: '1318040997',
        branch: 'main', projectType: 'drupal11_v2',
      });

      expect(app.id).toBe('app_1');
      const body = JSON.parse(capturedBody ?? '{}');
      expect(body.name).toBe('Test App');
      expect(body.projectType).toBe('drupal11_v2');
      expect(body.repositoryId).toBe(1318040997);
      expect(body.repositoryType).toBe('EXISTING');
      expect(body.isPrivateRepository).toBe(false);
      expect(body.isUsePersonalToken).toBe(true);
      expect(body.instances[0].branchType).toBe('MAIN');
      expect(body.instances[0].name).toBe('main');
      expect(body.instances[0].originBranch).toBe('main');
      expect(JSON.stringify(body)).not.toContain('{{');
    } finally {
      vi.unstubAllGlobals();
      config.mode = origMode;
      config.enableRealCreate = origEnable;
      config.createProfile = origProfile;
    }
  });
});

describe('workspace creation flow', () => {
  it('listEnvironments returns seeded environments and filters by search', async () => {
    const dp = new MockDevPanelClient();
    const all = await dp.listEnvironments();
    expect(all.length).toBeGreaterThan(0);
    expect(all[0]).toHaveProperty('id');
    expect(all[0]).toHaveProperty('name');

    const filtered = await dp.listEnvironments('staging');
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('env_mock_2');
  });

  it('creates a workspace plan, executes after approval, and the workspace appears', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);
    const executor = new ExecutionService(dp, store);

    const plan = await plans.createWorkspacePlan({
      name: 'Team Workspace', environmentId: 'env_mock_1', description: 'test', tags: ['dev'],
    });

    expect(plan.action).toBe('CREATE_WORKSPACE');
    expect(plan.preconditions.environmentId).toBe('env_mock_1');
    expect(plan.steps.some(s => s.operation === 'CREATE_WORKSPACE' && s.mutates)).toBe(true);

    await store.setApproval(plan.id, {
      decision: 'APPROVE', planHash: plan.hash, approvedAt: new Date().toISOString(),
      approvedBy: 'test-user', approvalMethod: 'MCP_ELICITATION',
    });

    const approvedPlan = await store.get(plan.id)!;
    const result = await executor.executeApprovedPlan(approvedPlan!);
    expect(result.state).toBe('EXECUTED');

    const workspaces = await dp.listWorkspaces();
    expect(workspaces.some(w => w.name === 'Team Workspace')).toBe(true);

    const succeededPlan = await store.get(plan.id);
    expect(succeededPlan?.status).toBe('SUCCEEDED');
  });

  it('rejects plan creation when environment does not exist', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);

    await expect(plans.createWorkspacePlan({
      name: 'Bad Workspace', environmentId: 'env_missing',
    })).rejects.toThrow('Environment not found: env_missing');
  });

  it('marks plan STALE when the environment is removed after approval', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);
    const executor = new ExecutionService(dp, store);

    const plan = await plans.createWorkspacePlan({ name: 'Ephemeral Workspace', environmentId: 'env_mock_1' });

    await store.setApproval(plan.id, {
      decision: 'APPROVE', planHash: plan.hash, approvedAt: new Date().toISOString(),
      approvedBy: 'test-user', approvalMethod: 'MCP_ELICITATION',
    });

    dp.removeEnvironment('env_mock_1');

    const approvedPlan = await store.get(plan.id)!;
    await expect(executor.executeApprovedPlan(approvedPlan!)).rejects.toThrow('Plan is stale');

    const stalePlan = await store.get(plan.id);
    expect(stalePlan?.status).toBe('STALE');
  });

  it('rejects duplicate workspace names at execution time', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);
    const executor = new ExecutionService(dp, store);

    const plan = await plans.createWorkspacePlan({ name: 'Default Workspace', environmentId: 'env_mock_1' });

    await store.setApproval(plan.id, {
      decision: 'APPROVE', planHash: plan.hash, approvedAt: new Date().toISOString(),
      approvedBy: 'test-user', approvalMethod: 'MCP_ELICITATION',
    });

    const approvedPlan = await store.get(plan.id)!;
    await expect(executor.executeApprovedPlan(approvedPlan!)).rejects.toThrow('Workspace name already exists');
  });
});

describe('git provider discovery', () => {
  it('listGitOwners returns connected providers', async () => {
    const dp = new MockDevPanelClient();
    const owners = await dp.listGitOwners();
    expect(owners.length).toBeGreaterThan(0);
    expect(owners[0]).toHaveProperty('id');
    expect(owners[0]).toHaveProperty('name');
    expect(owners[0]).toHaveProperty('provider');
  });

  it('listGitOwners filters by provider', async () => {
    const dp = new MockDevPanelClient();
    const owners = await dp.listGitOwners('GITLAB');
    expect(owners).toHaveLength(0);
    const github = await dp.listGitOwners('github');
    expect(github.length).toBeGreaterThan(0);
    expect(github.every(o => o.provider === 'github')).toBe(true);
  });

  it('listRepositories returns repos with optional filters', async () => {
    const dp = new MockDevPanelClient();
    const all = await dp.listRepositories();
    expect(all.length).toBeGreaterThan(0);
    expect(all[0]).toHaveProperty('id');
    expect(all[0]).toHaveProperty('name');
    expect(all[0]).toHaveProperty('owner');
    expect(all[0]).toHaveProperty('provider');

    const filtered = await dp.listRepositories('nonexistent');
    expect(filtered).toHaveLength(0);
  });

  it('listRepositoryBranches returns branches', async () => {
    const dp = new MockDevPanelClient();
    const branches = await dp.listRepositoryBranches('my-org', 'my-repo', 'repo_1', 'GITHUB');
    expect(branches.length).toBeGreaterThan(0);
    expect(branches[0]).toHaveProperty('name');
  });
});
