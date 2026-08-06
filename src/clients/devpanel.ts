import type { ApplicationRef, BackupRef, BackupFileRef, WorkspaceRef, ProjectRef, ProjectTypeRef, ActivateConfig, GitOwnerRef, GitRepoRef, GitBranchRef, EnvironmentRef } from '../domain/types.js';

export interface CreateApplicationRequest {
  workspaceId: string;
  name: string;
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

/**
 * Builds a DevPanelClient for one MCP session. In 'token' auth mode this is
 * called with the caller's own /mcp bearer token so each session forwards
 * its own DevPanel credential; other modes ignore the argument and return a
 * shared client.
 */
export type DevPanelClientFactory = (bearerToken?: string) => DevPanelClient;

export interface DevPanelClient {
  /**
   * A stable, per-credential owner identity used to bind change plans to the
   * caller that created them. MUST NOT leak the underlying credential itself
   * (plan-owner-mismatch errors echo this value back to whichever caller
   * triggered the mismatch).
   */
  getCallerIdentity(): string;
  /** Read-only. The DevPanel profile of whichever bearer/session this client is scoped to. */
  whoami(): Promise<unknown>;
  listWorkspaces(): Promise<WorkspaceRef[]>;
  listEnvironments(search?: string): Promise<EnvironmentRef[]>;
  listProjects(workspaceId: string): Promise<ProjectRef[]>;
  listProjectTypes(): Promise<ProjectTypeRef[]>;
  listApplications(workspaceId: string, search?: string): Promise<ApplicationRef[]>;
  listProjectApplications(workspaceId: string, projectId: string): Promise<ApplicationRef[]>;
  getApplication(app: ApplicationRef): Promise<ApplicationRef>;
  getApplicationActivities(app: ApplicationRef): Promise<unknown>;
  getApplicationLogs(app: ApplicationRef, containerName?: string, pageSize?: number): Promise<unknown>;
  listBackups(app: ApplicationRef): Promise<BackupRef[]>;
  getBackupFile(app: ApplicationRef, backupId: string, fileId: string): Promise<BackupFileRef>;
  createApplication(input: CreateApplicationRequest): Promise<ApplicationRef>;
  createWorkspace(input: CreateWorkspaceRequest): Promise<WorkspaceRef>;
  activateApplication(app: ApplicationRef, config: ActivateConfig): Promise<ApplicationRef>;
  deactivateApplication(app: ApplicationRef): Promise<ApplicationRef>;
  setEditorEnabled(app: ApplicationRef, enabled: boolean): Promise<ApplicationRef>;
  setPmaEnabled(app: ApplicationRef, enabled: boolean): Promise<ApplicationRef>;
  createBackup(app: ApplicationRef): Promise<BackupRef>;
  restoreBackup(app: ApplicationRef, backupId: string): Promise<unknown>;
  deleteApplication(app: ApplicationRef): Promise<unknown>;
  deleteProject(project: ProjectRef): Promise<unknown>;
  deleteWorkspace(workspace: WorkspaceRef): Promise<unknown>;
  listGitOwners(provider?: string): Promise<GitOwnerRef[]>;
  listRepositories(owner?: string, provider?: string): Promise<GitRepoRef[]>;
  listRepositoryBranches(owner: string, repoName: string, repoId: string, provider?: string): Promise<GitBranchRef[]>;
  setGitToken(token: string, provider: string, username: string): Promise<void>;
  removeGitToken(provider: string): Promise<void>;
}
