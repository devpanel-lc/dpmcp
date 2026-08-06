import { randomUUID } from 'node:crypto';
import type { ApplicationRef, BackupRef, BackupFileRef, WorkspaceRef, ProjectRef, ProjectTypeRef, ActivateConfig, GitOwnerRef, GitRepoRef, GitBranchRef, EnvironmentRef } from '../domain/types.js';
import type { CreateApplicationRequest, CreateWorkspaceRequest, DevPanelClient } from './devpanel.js';

export class MockDevPanelClient implements DevPanelClient {
  private apps = new Map<string, ApplicationRef>();
  private backups = new Map<string, BackupRef[]>();
  private workspaces: WorkspaceRef[] = [
    { id: 'ws_mock_1', name: 'Default Workspace', slug: 'default' },
  ];
  private environments: EnvironmentRef[] = [
    { id: 'env_mock_1', name: 'Default Cluster', clusterName: 'cluster-default', status: 'RUNNING', provider: 'AWS' },
    { id: 'env_mock_2', name: 'Staging Cluster', clusterName: 'cluster-staging', status: 'RUNNING', provider: 'AWS' },
  ];
  private projects: ProjectRef[] = [
    { id: 'project_demo_1', name: 'Demo Project', workspaceId: 'ws_mock_1' },
  ];
  private projectTypes: ProjectTypeRef[] = [
    { key: 'lamp', label: 'LAMP' },
    { key: 'nodejs', label: 'Node.js' },
    { key: 'drupal11_v2', label: 'Drupal 11' },
    { key: 'wordpress_v2', label: 'WordPress' },
  ];

  private gitOwners: GitOwnerRef[] = [
    { id: 'owner_1', name: 'my-org', provider: 'github', avatarUrl: 'https://avatars.githubusercontent.com/u/1' },
  ];
  private gitRepos: GitRepoRef[] = [
    { id: 'repo_1', name: 'my-repo', owner: 'my-org', provider: 'github', fullName: 'my-org/my-repo', defaultBranch: 'main', private: false },
    { id: 'repo_2', name: 'private-repo', owner: 'my-org', provider: 'github', fullName: 'my-org/private-repo', defaultBranch: 'develop', private: true },
  ];
  private gitBranches: GitBranchRef[] = [
    { name: 'main', commitSha: 'abc123' },
    { name: 'develop', commitSha: 'def456' },
    { name: 'feature/new-feature', commitSha: 'ghi789' },
  ];
  private personalTokenSet = false;
  private gitTokenProvider?: string;

  constructor() {
    const app: ApplicationRef = {
      id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'ws_mock_1',
      name: 'Existing Demo', hostname: 'existing-demo.example.local',
      status: 'UNDEPLOY_APPLICATION_SUCCESS', originBranch: 'main'
    };
    this.apps.set(app.id, app);
  }

  async listWorkspaces(): Promise<WorkspaceRef[]> {
    return structuredClone(this.workspaces);
  }

  async listEnvironments(search?: string): Promise<EnvironmentRef[]> {
    if (!search) return structuredClone(this.environments);
    const q = search.toLowerCase();
    return structuredClone(this.environments.filter(e =>
      `${e.id} ${e.name ?? ''} ${e.clusterName ?? ''}`.toLowerCase().includes(q)));
  }

  async createWorkspace(input: CreateWorkspaceRequest): Promise<WorkspaceRef> {
    if (!input.environmentId) throw new Error('environmentId is required');
    const env = this.environments.find(e => e.id === input.environmentId);
    if (!env) throw new Error(`Environment not found: ${input.environmentId}`);
    const name = input.name.trim();
    if (!name) throw new Error('Workspace name is required');
    if (this.workspaces.some(w => w.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`Workspace name already exists: ${name}`);
    }
    const workspace: WorkspaceRef = { id: `ws_${randomUUID().slice(0, 8)}`, name };
    this.workspaces.push(workspace);
    return structuredClone(workspace);
  }

  removeEnvironment(id: string): void {
    this.environments = this.environments.filter(e => e.id !== id);
  }

  async listProjects(workspaceId: string): Promise<ProjectRef[]> {
    return structuredClone(this.projects.filter(p => p.workspaceId === workspaceId));
  }

  async listProjectTypes(): Promise<ProjectTypeRef[]> {
    return structuredClone(this.projectTypes);
  }

  async listApplications(workspaceId: string, search?: string): Promise<ApplicationRef[]> {
    const all = [...this.apps.values()].filter(a => a.workspaceId === workspaceId);
    if (!search) return structuredClone(all);
    const q = search.toLowerCase();
    return structuredClone(all.filter(a => `${a.name ?? ''} ${a.hostname ?? ''} ${a.id}`.toLowerCase().includes(q)));
  }

  async listProjectApplications(workspaceId: string, projectId: string): Promise<ApplicationRef[]> {
    const all = [...this.apps.values()].filter(a => a.workspaceId === workspaceId && a.projectId === projectId);
    return structuredClone(all);
  }

  async getApplication(app: ApplicationRef): Promise<ApplicationRef> {
    const found = this.apps.get(app.id);
    if (!found) throw new Error(`Application not found: ${app.id}`);
    return structuredClone(found);
  }

  async getApplicationActivities(app: ApplicationRef): Promise<unknown> {
    await this.getApplication(app);
    return [{ id: `activity_${app.id}`, status: 'SUCCESS', message: 'Mock application ready' }];
  }

  async getApplicationLogs(app: ApplicationRef, containerName?: string, pageSize?: number): Promise<unknown> {
    return [`[mock] logs for ${app.name ?? app.id} (${containerName ?? 'php'})`, 'Application is healthy'];
  }

  async listBackups(app: ApplicationRef): Promise<BackupRef[]> {
    return structuredClone(this.backups.get(app.id) ?? []);
  }

  async getBackupFile(app: ApplicationRef, backupId: string, fileId: string): Promise<BackupFileRef> {
    const backup = (this.backups.get(app.id) ?? []).find(b => b.id === backupId);
    if (!backup) throw new Error(`Backup not found: ${backupId}`);
    return { backupId, fileId, downloadURL: `https://mock.devpanel.invalid/backups/${backupId}/files/${fileId}` };
  }

  async createApplication(input: CreateApplicationRequest): Promise<ApplicationRef> {
    const projectId = `project_${randomUUID().slice(0, 8)}`;
    const app: ApplicationRef = {
      id: `app_${randomUUID().slice(0, 8)}`,
      projectId,
      workspaceId: input.workspaceId,
      name: input.name,
      hostname: `${input.repositoryName.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}.example.local`,
      status: 'UNDEPLOY_APPLICATION_SUCCESS',
      originBranch: input.branch,
    };
    this.apps.set(app.id, app);
    return structuredClone(app);
  }

  async listGitOwners(provider?: string): Promise<GitOwnerRef[]> {
    const result = provider ? this.gitOwners.filter(o => o.provider.toLowerCase() === provider.toLowerCase()) : this.gitOwners;
    return structuredClone(result);
  }

  async listRepositories(owner?: string, provider?: string): Promise<GitRepoRef[]> {
    let result = this.gitRepos;
    if (owner) result = result.filter(r => r.owner === owner);
    if (provider) result = result.filter(r => r.provider.toLowerCase() === provider.toLowerCase());
    return structuredClone(result);
  }

  async listRepositoryBranches(owner: string, repoName: string, _repoId: string, _provider?: string): Promise<GitBranchRef[]> {
    return structuredClone(this.gitBranches);
  }

  async setGitToken(_token: string, provider: string, _username: string): Promise<void> {
    this.personalTokenSet = true;
    this.gitTokenProvider = provider;
  }

  async removeGitToken(_provider: string): Promise<void> {
    this.personalTokenSet = false;
  }

  async activateApplication(app: ApplicationRef, _config: ActivateConfig): Promise<ApplicationRef> {
    const existing = this.apps.get(app.id);
    if (!existing) throw new Error(`Application not found: ${app.id}`);
    existing.status = 'DEPLOY_APPLICATION_SUCCESS';
    this.apps.set(app.id, existing);
    return structuredClone(existing);
  }

  async deactivateApplication(app: ApplicationRef): Promise<ApplicationRef> {
    const existing = this.apps.get(app.id);
    if (!existing) throw new Error(`Application not found: ${app.id}`);
    existing.status = 'UNDEPLOY_APPLICATION_SUCCESS';
    this.apps.set(app.id, existing);
    return structuredClone(existing);
  }

  async createBackup(app: ApplicationRef): Promise<BackupRef> {
    await this.getApplication(app);
    const backup: BackupRef = {
      id: `backup_${randomUUID().slice(0, 8)}`,
      applicationId: app.id,
      createdAt: new Date().toISOString(),
      type: 'MANUAL',
    };
    const list = this.backups.get(app.id) ?? [];
    list.unshift(backup);
    this.backups.set(app.id, list);
    return structuredClone(backup);
  }

  async restoreBackup(app: ApplicationRef, backupId: string): Promise<unknown> {
    const backup = (this.backups.get(app.id) ?? []).find(b => b.id === backupId);
    if (!backup) throw new Error(`Backup not found: ${backupId}`);
    return { status: 'RESTORED', backupId };
  }

  async deleteApplication(app: ApplicationRef): Promise<unknown> {
    if (!this.apps.delete(app.id)) throw new Error(`Application not found: ${app.id}`);
    return { status: 'DELETED', applicationId: app.id };
  }

  async deleteProject(project: ProjectRef): Promise<unknown> {
    const idx = this.projects.findIndex(p => p.id === project.id && p.workspaceId === project.workspaceId);
    if (idx === -1) throw new Error(`Project not found: ${project.id}`);
    this.projects.splice(idx, 1);
    return { status: 'DELETED', projectId: project.id };
  }
}
