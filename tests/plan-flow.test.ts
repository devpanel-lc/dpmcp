import { describe, expect, it, vi } from 'vitest';
import { MockDevPanelClient } from '../src/clients/mock-devpanel.js';
import { InMemoryPlanStore } from '../src/stores/plan-store.js';
import { PlanService } from '../src/services/plan-service.js';
import { ExecutionService } from '../src/services/execution-service.js';
import { ApprovalService } from '../src/approval/approval-service.js';
import { hashPlan } from '../src/utils/hash.js';
import { currentOwnerId, TokenScopedDevPanelClient, tokenStorage } from '../src/clients/token-scoped-client.js';
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

describe('token scoped client and owner identity', () => {
  it('currentOwnerId() returns "local" outside token context', () => {
    expect(currentOwnerId()).toBe('local');
  });

  it('currentOwnerId() returns SHA-256 hash inside token context', () => {
    tokenStorage.run('test-token-123', () => {
      const ownerId = currentOwnerId();
      expect(ownerId).not.toBe('local');
      expect(ownerId).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  it('currentOwnerId() returns consistent hash for same token', () => {
    tokenStorage.run('consistent-token', () => {
      const id1 = currentOwnerId();
      const id2 = currentOwnerId();
      expect(id1).toBe(id2);
    });
  });

  it('currentOwnerId() returns different hash for different tokens', () => {
    let idA: string;
    let idB: string;
    tokenStorage.run('token-a', () => { idA = currentOwnerId(); });
    tokenStorage.run('token-b', () => { idB = currentOwnerId(); });
    expect(idA!).not.toBe(idB!);
  });

  it('TokenScopedDevPanelClient falls back to mock outside token context', async () => {
    const client = new TokenScopedDevPanelClient();
    const apps = await client.listApplications('ws_mock_1');
    expect(Array.isArray(apps)).toBe(true);
  });

  it('plan created inside token context carries ownerId', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);

    let plan: ChangePlan;
    await tokenStorage.run('user-token', async () => {
      plan = await plans.backupPlan('app_demo_1', currentOwnerId());
    });

    const expectedOwner = await tokenStorage.run('user-token', () => currentOwnerId());
    expect(plan!.ownerId).toBe(expectedOwner);
  });

  it('plan created outside token context carries ownerId "local"', async () => {
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

  it('rejects activate when app is not in UNDEPLOY_APPLICATION_SUCCESS status', async () => {
    const dp = new MockDevPanelClient();
    const store = new InMemoryPlanStore();
    const plans = new PlanService(dp, store);

    await dp.activateApplication(
      { id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'ws_mock_1' },
      { groupType: 'on-demand', capacity: 'micro' },
    );

    await expect(plans.activatePlan('app_demo_1', {
      groupType: 'on-demand', capacity: 'micro',
    })).rejects.toThrow('Expected "UNDEPLOY_APPLICATION_SUCCESS"');
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

  it('getGitTokenStatus returns false initially', async () => {
    const dp = new MockDevPanelClient();
    const status = await dp.getGitTokenStatus();
    expect(status.hasPersonalToken).toBe(false);
  });

  it('setGitToken updates token status', async () => {
    const dp = new MockDevPanelClient();
    await dp.setGitToken('ghp_test123', 'github', 'myuser');
    const status = await dp.getGitTokenStatus();
    expect(status.hasPersonalToken).toBe(true);
    expect(status.provider).toBe('github');
  });

  it('removeGitToken clears token status', async () => {
    const dp = new MockDevPanelClient();
    await dp.setGitToken('ghp_test123', 'github', 'myuser');
    await dp.removeGitToken('github');
    const status = await dp.getGitTokenStatus();
    expect(status.hasPersonalToken).toBe(false);
  });
});
