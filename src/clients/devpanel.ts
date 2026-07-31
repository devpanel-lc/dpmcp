import type { ApplicationRef, BackupRef, WorkspaceRef, ProjectRef, ProjectTypeRef, EnvironmentRef, GitOwnerRef, GitRepoRef, GitBranchRef } from '../domain/types.js';

export interface CreateApplicationRequest {
  workspaceId: string;
  repositoryOwner: string;
  repositoryName: string;
  repositoryProvider: string;
  repositoryId?: string;
  branch: string;
  projectType: string;
  repositoryType?: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  environmentId: string;
  tags?: string[];
}

export interface DevPanelClient {
  listWorkspaces(): Promise<WorkspaceRef[]>;
  listEnvironments(search?: string): Promise<EnvironmentRef[]>;
  listProjects(workspaceId: string): Promise<ProjectRef[]>;
  listProjectTypes(): Promise<ProjectTypeRef[]>;
  listApplications(search?: string): Promise<ApplicationRef[]>;
  getApplication(app: ApplicationRef): Promise<ApplicationRef>;
  getApplicationActivities(app: ApplicationRef): Promise<unknown>;
  getApplicationLogs(app: ApplicationRef, containerName?: string, pageSize?: number): Promise<unknown>;
  listBackups(app: ApplicationRef): Promise<BackupRef[]>;
  createApplication(input: CreateApplicationRequest): Promise<ApplicationRef>;
  createWorkspace(input: CreateWorkspaceRequest): Promise<WorkspaceRef>;
  createBackup(app: ApplicationRef): Promise<BackupRef>;
  restoreBackup(app: ApplicationRef, backupId: string): Promise<unknown>;
  deleteApplication(app: ApplicationRef): Promise<unknown>;
  listGitOwners(provider?: string): Promise<GitOwnerRef[]>;
  listRepositories(owner?: string, provider?: string): Promise<GitRepoRef[]>;
  listRepositoryBranches(owner: string, repoName: string, repoId: string): Promise<GitBranchRef[]>;
  getGitTokenStatus(): Promise<{ hasPersonalToken: boolean; provider?: string }>;
  setGitToken(token: string, provider: string, username: string): Promise<void>;
  removeGitToken(provider: string): Promise<void>;
}
