import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import type { ChangePlan, PlanAction, PlanStep, Preconditions, RiskLevel, ActivateConfig } from '../domain/types.js';
import type { DevPanelClient, CreateApplicationRequest, CreateWorkspaceRequest } from '../clients/devpanel.js';
import type { PlanStore } from '../stores/plan-store.js';
import { hashPlan } from '../utils/hash.js';
import { applicationFingerprint } from '../utils/fingerprint.js';
import { ApplicationResolver } from './application-resolver.js';
import { assertRealCreateInput, assertRealCreateReady } from '../clients/real-create-gate.js';

const OWNER_ID_LOCAL = 'local';

export class PlanService {
  private readonly resolver: ApplicationResolver;
  constructor(private readonly dp: DevPanelClient, private readonly store: PlanStore) {
    this.resolver = new ApplicationResolver(dp);
  }

  async createApplicationPlan(input: CreateApplicationRequest, ownerId = OWNER_ID_LOCAL): Promise<ChangePlan> {
    await assertRealCreateReady();
    assertRealCreateInput(input);
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
      rollback: 'Undeploy via devpanel_plan_deactivate_application if rollback is required.'
    });
  }

  async deactivatePlan(application: string, ownerId = OWNER_ID_LOCAL, workspaceId?: string): Promise<ChangePlan> {
    const app = await this.resolver.resolve(application, workspaceId);
    if (app.status !== 'DEPLOY_APPLICATION_SUCCESS') {
      if (app.status === 'UNDEPLOY_APPLICATION_SUCCESS') {
        throw new Error(`Application ${app.name ?? app.id} is already undeployed (UNDEPLOY_APPLICATION_SUCCESS); no deactivation is needed. Verify its status with devpanel_list_applications or devpanel_get_application.`);
      }
      throw new Error(`Application ${app.name ?? app.id} has status "${app.status}". Deactivation requires status DEPLOY_APPLICATION_SUCCESS; check the current status with devpanel_get_application before retrying.`);
    }
    return this.createPlan({
      action: 'DEACTIVATE_APPLICATION', risk: 'MEDIUM', ownerId,
      summary: `Deactivate (undeploy/pause) application ${app.name ?? app.id} from K8s`,
      target: appSummary(app),
      proposedInput: appSummary(app),
      steps: [
        step(1, 'REVALIDATE', 'Verify application is still in DEPLOY_APPLICATION_SUCCESS status', false),
        step(2, 'DEACTIVATE_APPLICATION', 'Undeploy the application from Kubernetes via PATCH /deactivate', true),
        step(3, 'VERIFY_DEACTIVATED', 'Poll application status until it reaches UNDEPLOY_APPLICATION_SUCCESS or fails', false),
      ],
      preconditions: snapshot(app),
      expectedResult: `Application ${app.name ?? app.id} is undeployed with status UNDEPLOY_APPLICATION_SUCCESS. It no longer serves traffic; storage/data is preserved.`,
      rollback: 'Re-activate via devpanel_plan_activate_application if rollback is required.'
    });
  }

  async enableEditorPlan(application: string, ownerId = OWNER_ID_LOCAL, workspaceId?: string): Promise<ChangePlan> {
    return this.toggleFeaturePlan(application, ownerId, workspaceId, 'EDITOR', true);
  }

  async disableEditorPlan(application: string, ownerId = OWNER_ID_LOCAL, workspaceId?: string): Promise<ChangePlan> {
    return this.toggleFeaturePlan(application, ownerId, workspaceId, 'EDITOR', false);
  }

  async enablePmaPlan(application: string, ownerId = OWNER_ID_LOCAL, workspaceId?: string): Promise<ChangePlan> {
    return this.toggleFeaturePlan(application, ownerId, workspaceId, 'PMA', true);
  }

  async disablePmaPlan(application: string, ownerId = OWNER_ID_LOCAL, workspaceId?: string): Promise<ChangePlan> {
    return this.toggleFeaturePlan(application, ownerId, workspaceId, 'PMA', false);
  }

  private async toggleFeaturePlan(application: string, ownerId: string, workspaceId: string | undefined, feature: 'EDITOR' | 'PMA', enabled: boolean): Promise<ChangePlan> {
    const resolved = await this.resolver.resolve(application, workspaceId);
    // resolver.resolve() goes through listApplications(), whose raw item shape for
    // isEnableEditor/isEnablePMA is unconfirmed -- re-fetch via getApplication()'s
    // single-app GET, which the README confirms exposes these fields, so the
    // "already enabled/disabled" guard below actually works in real mode.
    const app = await this.dp.getApplication(resolved);
    if (app.status !== 'DEPLOY_APPLICATION_SUCCESS') {
      throw new Error(`Application ${app.name ?? app.id} has status "${app.status}". Code server/phpMyAdmin can only be toggled on a deployed application (status DEPLOY_APPLICATION_SUCCESS); activate it first with devpanel_plan_activate_application.`);
    }
    const label = feature === 'EDITOR' ? 'Code server' : 'phpMyAdmin';
    const currentlyEnabled = feature === 'EDITOR' ? app.isEnableEditor : app.isEnablePMA;
    if (currentlyEnabled === enabled) {
      throw new Error(`${label} is already ${enabled ? 'enabled' : 'disabled'} on ${app.name ?? app.id}.`);
    }
    const action: PlanAction = feature === 'EDITOR' ? (enabled ? 'ENABLE_EDITOR' : 'DISABLE_EDITOR') : (enabled ? 'ENABLE_PMA' : 'DISABLE_PMA');
    const verb = enabled ? 'Enable' : 'Disable';
    return this.createPlan({
      action, risk: 'MEDIUM', ownerId,
      summary: `${verb} ${label} on ${app.name ?? app.id}`,
      target: appSummary(app),
      proposedInput: { ...appSummary(app), enabled },
      steps: [
        step(1, 'REVALIDATE', 'Verify application is still in DEPLOY_APPLICATION_SUCCESS status', false),
        step(2, action, `${verb} ${label} via PATCH (contract not yet verified against a real DevPanel request -- see README.md)`, true),
        step(3, 'VERIFY', `Confirm ${label} is now ${enabled ? 'enabled' : 'disabled'}`, false),
      ],
      preconditions: snapshot(app),
      expectedResult: `${label} is ${enabled ? 'enabled' : 'disabled'} on ${app.name ?? app.id}.`,
      rollback: `${enabled ? 'Disable' : 'Enable'} it again via the corresponding devpanel_plan_${enabled ? 'disable' : 'enable'}_${feature === 'EDITOR' ? 'code_server' : 'phpmyadmin'} tool.`,
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

  async deleteProjectPlan(workspaceId: string, project: string, ownerId = OWNER_ID_LOCAL): Promise<ChangePlan> {
    const projects = await this.dp.listProjects(workspaceId);
    const exact = projects.find(p => p.id === project);
    const matches = exact ? [exact] : projects.filter(p => (p.name ?? '').toLowerCase().includes(project.toLowerCase()));
    if (matches.length === 0) throw new Error(`No project matches "${project}" in workspace ${workspaceId}`);
    if (matches.length > 1) {
      const choices = matches.slice(0, 10).map(p => `${p.name} (${p.id})`).join(', ');
      throw new Error(`Project query is ambiguous: "${project}" in workspace ${workspaceId}. Matches: ${choices}`);
    }
    const proj = matches[0];
    const apps = await this.dp.listProjectApplications(workspaceId, proj.id);
    if (apps.length > 0) {
      const names = apps.map(a => `${a.name ?? a.hostname ?? a.id} (${a.id})`).join(', ');
      throw new Error(
        `Project ${proj.name} (${proj.id}) still has ${apps.length} application(s): ${names}. ` +
        'Delete them first (devpanel_plan_delete_application + devpanel_approve_and_execute_plan for each), then retry devpanel_plan_delete_project.'
      );
    }
    return this.createPlan({
      action: 'DELETE_PROJECT', risk: 'HIGH', ownerId, summary: `Delete project ${proj.name} (${proj.id})`,
      target: { projectId: proj.id, projectName: proj.name, workspaceId },
      proposedInput: { projectId: proj.id, workspaceId },
      steps: [
        step(1, 'REVALIDATE', 'Verify the project still has zero applications', false),
        step(2, 'DELETE_PROJECT', 'Delete the DevPanel project', true),
        step(3, 'VERIFY_DELETED', 'Confirm the project no longer appears in devpanel_list_projects', false),
      ],
      preconditions: { projectId: proj.id, workspaceId },
      expectedResult: `Project ${proj.name} no longer exists.`,
      rollback: 'No undo; project deletion is permanent.',
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
