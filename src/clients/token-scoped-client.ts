import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash } from 'node:crypto';
import type { ApplicationRef, BackupRef, WorkspaceRef, ProjectRef, ProjectTypeRef, ActivateConfig, GitOwnerRef, GitRepoRef, GitBranchRef, EnvironmentRef } from '../domain/types.js';
import type { CreateApplicationRequest, CreateWorkspaceRequest, DevPanelClient } from './devpanel.js';
import { RealDevPanelClient } from './real-devpanel.js';
import { MockDevPanelClient } from './mock-devpanel.js';
import { config } from '../config.js';

export const tokenStorage = new AsyncLocalStorage<string>();

export function currentOwnerId(): string {
  const token = tokenStorage.getStore();
  if (!token) return 'local';
  return createHash('sha256').update(token).digest('hex');
}

export class TokenScopedDevPanelClient implements DevPanelClient {
  private readonly mockClient = new MockDevPanelClient();

  private client(): DevPanelClient {
    if (config.mode === 'mock') return this.mockClient;
    const token = tokenStorage.getStore();
    if (!token) return this.mockClient;
    return new RealDevPanelClient(token);
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

  async createApplication(input: CreateApplicationRequest): Promise<ApplicationRef> {
    return this.client().createApplication(input);
  }

  async createWorkspace(input: CreateWorkspaceRequest): Promise<WorkspaceRef> {
    return this.client().createWorkspace(input);
  }

  async activateApplication(app: ApplicationRef, activateConfig: ActivateConfig): Promise<ApplicationRef> {
    return this.client().activateApplication(app, activateConfig);
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

  async listGitOwners(provider?: string): Promise<GitOwnerRef[]> {
    return this.client().listGitOwners(provider);
  }

  async listRepositories(owner?: string, provider?: string): Promise<GitRepoRef[]> {
    return this.client().listRepositories(owner, provider);
  }

  async listRepositoryBranches(owner: string, repoName: string, repoId: string): Promise<GitBranchRef[]> {
    return this.client().listRepositoryBranches(owner, repoName, repoId);
  }

  async getGitTokenStatus(): Promise<{ hasPersonalToken: boolean; provider?: string }> {
    return this.client().getGitTokenStatus();
  }

  async setGitToken(token: string, provider: string, username: string): Promise<void> {
    return this.client().setGitToken(token, provider, username);
  }

  async removeGitToken(provider: string): Promise<void> {
    return this.client().removeGitToken(provider);
  }
}
