import type { ApplicationRef, BackupRef, BackupFileRef, WorkspaceRef, ProjectRef, ProjectTypeRef, ActivateConfig, GitOwnerRef, GitRepoRef, GitBranchRef, EnvironmentRef } from '../domain/types.js';
import type { CreateApplicationRequest, CreateWorkspaceRequest, DevPanelClient } from './devpanel.js';
import { RealDevPanelClient } from './real-devpanel.js';
import { MockDevPanelClient } from './mock-devpanel.js';
import { config } from '../config.js';
import { getAccessToken, getLoginUrl } from '../auth/session.js';

export class TokenScopedDevPanelClient implements DevPanelClient {
  private readonly mockClient = new MockDevPanelClient();

  getCallerIdentity(): string {
    return this.client().getCallerIdentity();
  }

  private client(): DevPanelClient {
    if (config.mode === 'mock') return this.mockClient;
    const token = getAccessToken();
    if (!token) {
      throw new Error(
        `SSO login required — no DevPanel session. Open ${getLoginUrl() || 'the Cognito hosted-UI login URL'} in your browser and complete sign-in, then retry.`,
      );
    }
    return new RealDevPanelClient(token, true); // SSO session token — supports refresh on 401
  }

  async whoami(): Promise<unknown> {
    return this.client().whoami();
  }

  async listWorkspaces(): Promise<WorkspaceRef[]> {
    return this.client().listWorkspaces();
  }

  async listEnvironments(search?: string): Promise<EnvironmentRef[]> {
    return this.client().listEnvironments(search);
  }

  async listProjects(workspaceId: string): Promise<ProjectRef[]> {
    return this.client().listProjects(workspaceId);
  }

  async listProjectTypes(): Promise<ProjectTypeRef[]> {
    return this.client().listProjectTypes();
  }

  async listApplications(workspaceId: string, search?: string): Promise<ApplicationRef[]> {
    return this.client().listApplications(workspaceId, search);
  }

  async listProjectApplications(workspaceId: string, projectId: string): Promise<ApplicationRef[]> {
    return this.client().listProjectApplications(workspaceId, projectId);
  }

  async getApplication(app: ApplicationRef): Promise<ApplicationRef> {
    return this.client().getApplication(app);
  }

  async getApplicationActivities(app: ApplicationRef): Promise<unknown> {
    return this.client().getApplicationActivities(app);
  }

  async getApplicationLogs(app: ApplicationRef, containerName?: string, pageSize?: number): Promise<unknown> {
    return this.client().getApplicationLogs(app, containerName, pageSize);
  }

  async listBackups(app: ApplicationRef): Promise<BackupRef[]> {
    return this.client().listBackups(app);
  }

  async getBackupFile(app: ApplicationRef, backupId: string, fileId: string): Promise<BackupFileRef> {
    return this.client().getBackupFile(app, backupId, fileId);
  }

  async createApplication(input: CreateApplicationRequest): Promise<ApplicationRef> {
    return this.client().createApplication(input);
  }

  async createWorkspace(input: CreateWorkspaceRequest): Promise<WorkspaceRef> {
    return this.client().createWorkspace(input);
  }

  async activateApplication(app: ApplicationRef, activateConfig: ActivateConfig): Promise<ApplicationRef> {
    return this.client().activateApplication(app, activateConfig);
  }

  async deactivateApplication(app: ApplicationRef): Promise<ApplicationRef> {
    return this.client().deactivateApplication(app);
  }

  async setEditorEnabled(app: ApplicationRef, enabled: boolean): Promise<ApplicationRef> {
    return this.client().setEditorEnabled(app, enabled);
  }

  async setPmaEnabled(app: ApplicationRef, enabled: boolean): Promise<ApplicationRef> {
    return this.client().setPmaEnabled(app, enabled);
  }

  async createBackup(app: ApplicationRef): Promise<BackupRef> {
    return this.client().createBackup(app);
  }

  async restoreBackup(app: ApplicationRef, backupId: string): Promise<unknown> {
    return this.client().restoreBackup(app, backupId);
  }

  async deleteApplication(app: ApplicationRef): Promise<unknown> {
    return this.client().deleteApplication(app);
  }

  async deleteProject(project: ProjectRef): Promise<unknown> {
    return this.client().deleteProject(project);
  }

  async deleteWorkspace(workspace: WorkspaceRef): Promise<unknown> {
    return this.client().deleteWorkspace(workspace);
  }

  async listGitOwners(provider?: string): Promise<GitOwnerRef[]> {
    return this.client().listGitOwners(provider);
  }

  async listRepositories(owner?: string, provider?: string): Promise<GitRepoRef[]> {
    return this.client().listRepositories(owner, provider);
  }

  async listRepositoryBranches(owner: string, repoName: string, repoId: string, provider?: string): Promise<GitBranchRef[]> {
    return this.client().listRepositoryBranches(owner, repoName, repoId, provider);
  }

  async setGitToken(token: string, provider: string, username: string): Promise<void> {
    return this.client().setGitToken(token, provider, username);
  }

  async removeGitToken(provider: string): Promise<void> {
    return this.client().removeGitToken(provider);
  }
}
