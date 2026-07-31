import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { ApplicationRef, BackupRef, WorkspaceRef, ProjectRef, ProjectTypeRef, EnvironmentRef, GitOwnerRef, GitRepoRef, GitBranchRef } from '../domain/types.js';
import type { CreateApplicationRequest, CreateWorkspaceRequest, DevPanelClient } from './devpanel.js';
import { config } from '../config.js';

function asRecord(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  return v as Record<string, unknown>;
}

function firstString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) if (typeof obj[k] === 'string') return obj[k] as string;
  return undefined;
}

function extractItems(raw: unknown, ...keys: string[]): unknown[] {
  if (Array.isArray(raw)) return raw;
  const r = asRecord(raw);
  for (const k of keys) {
    const v = r[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}

export class RealDevPanelClient implements DevPanelClient {
  constructor(private readonly accessToken: string) {}

  private async request(path: string, init: RequestInit = {}): Promise<unknown> {
    const response = await fetch(`${config.apiBaseUrl.replace(/\/$/, '')}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${this.accessToken}`,
        'content-type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
    const text = await response.text();
    let body: unknown = text;
    try { body = text ? JSON.parse(text) : undefined; } catch { /* keep text */ }
    if (!response.ok) throw new Error(`DevPanel ${response.status} ${path}: ${text}`);
    return body;
  }

  private normalizeApplication(raw: unknown, fallback?: Partial<ApplicationRef>): ApplicationRef {
    const r = asRecord(raw);
    const project = asRecord(r.project);
    const workspace = asRecord(project.workspace);
    const id = firstString(r, '_id', 'id', 'applicationId') ?? fallback?.id;
    if (!id) throw new Error('Could not determine application id from DevPanel response');
    return {
      id,
      projectId: firstString(project, '_id', 'id') ?? fallback?.projectId ?? '',
      workspaceId: firstString(workspace, '_id', 'id') ?? fallback?.workspaceId ?? config.defaultWorkspaceId,
      name: firstString(r, 'applicationName', 'name') ?? firstString(project, 'name') ?? fallback?.name,
      hostname: firstString(r, 'hostname', 'applicationURL') ?? fallback?.hostname,
      status: firstString(r, 'status') ?? fallback?.status,
      originBranch: firstString(r, 'originBranch') ?? fallback?.originBranch,
      raw,
    };
  }

  private normalizeWorkspace(raw: unknown): WorkspaceRef {
    const r = asRecord(raw);
    const id = firstString(r, '_id', 'id') ?? '';
    return { id, name: firstString(r, 'name', 'workspaceName') ?? id, slug: firstString(r, 'slug') };
  }

  private normalizeEnvironment(raw: unknown): EnvironmentRef {
    const r = asRecord(raw);
    const id = firstString(r, '_id', 'id', 'environmentId') ?? '';
    return {
      id,
      name: firstString(r, 'name', 'environmentName'),
      clusterName: firstString(r, 'clusterName'),
      status: firstString(r, 'status'),
      provider: firstString(r, 'provider', 'cloudProvider'),
      raw,
    };
  }

  async listEnvironments(search?: string): Promise<EnvironmentRef[]> {
    const qs = new URLSearchParams({ pageIndex: '1', pageSize: '100' });
    if (search) qs.set('search', search);
    const raw = await this.request(`/api/v2/environments?${qs}`);
    const items = extractItems(raw, 'environments', 'data', 'items');
    if (items.length === 0 && Array.isArray(raw)) return raw.map(item => this.normalizeEnvironment(item));
    return items.map(item => this.normalizeEnvironment(item));
  }

  async createWorkspace(input: CreateWorkspaceRequest): Promise<WorkspaceRef> {
    const payload: Record<string, unknown> = { name: input.name, environmentId: input.environmentId };
    if (input.description) payload.description = input.description;
    if (input.tags && input.tags.length > 0) payload.tags = input.tags;
    const raw = await this.request('/api/v2/workspaces', { method: 'POST', body: JSON.stringify(payload) });
    const normalized = this.normalizeWorkspace(raw);
    if (!normalized.id) {
      const r = asRecord(raw);
      const env = asRecord(r.environment);
      const id = firstString(r, '_id', 'id') ?? firstString(env, '_id', 'id');
      if (!id) throw new Error('Could not determine workspace id from DevPanel response');
      return { id, name: input.name, slug: normalized.slug };
    }
    return normalized;
  }

  private normalizeProject(raw: unknown): ProjectRef {
    const r = asRecord(raw);
    const id = firstString(r, '_id', 'id', 'projectId') ?? '';
    const workspace = asRecord(r.workspace);
    return {
      id,
      name: firstString(r, 'name') ?? id,
      workspaceId: firstString(workspace, '_id', 'id') ?? '',
    };
  }

  async listWorkspaces(): Promise<WorkspaceRef[]> {
    const raw = await this.request('/api/v2/workspaces?pageIndex=1&pageSize=100');
    const items = extractItems(raw, 'workspaces', 'data', 'items');
    return items.map(item => this.normalizeWorkspace(item));
  }

  async listProjects(workspaceId: string): Promise<ProjectRef[]> {
    const raw = await this.request(`/api/v2/workspaces/${workspaceId}/projects?pageIndex=1&pageSize=100`);
    const items = extractItems(raw, 'projects', 'data', 'items');
    return items.map(item => this.normalizeProject(item));
  }

  async listProjectTypes(): Promise<ProjectTypeRef[]> {
    const raw = await this.request('/api/v2/projects/project-types');
    const items = extractItems(raw, 'projectTypes', 'data', 'items');
    if (items.length === 0 && Array.isArray(raw)) return raw.map(k => ({ key: String(k), label: String(k) }));
    return items.map(item => {
      const r = asRecord(item);
      return { key: firstString(r, 'key', '_id', 'id') ?? String(item), label: firstString(r, 'label', 'name', 'title') };
    });
  }

  async listApplications(search?: string): Promise<ApplicationRef[]> {
    const qs = new URLSearchParams({ pageIndex: '1', pageSize: '100' });
    if (search) qs.set('search', search);
    const raw = await this.request(`/api/v2/applications?${qs}`);
    const r = asRecord(raw);
    const items = Array.isArray(raw) ? raw :
      (Array.isArray(r.applications) ? r.applications : Array.isArray(r.data) ? r.data : Array.isArray(r.items) ? r.items : []);
    return items.map(item => this.normalizeApplication(item));
  }

  async getApplication(app: ApplicationRef): Promise<ApplicationRef> {
    this.requireHierarchy(app);
    const raw = await this.request(`/api/v2/workspaces/${app.workspaceId}/projects/${app.projectId}/applications/${app.id}`);
    return this.normalizeApplication(raw, { id: app.id, projectId: app.projectId, workspaceId: app.workspaceId });
  }

  async getApplicationActivities(app: ApplicationRef): Promise<unknown> {
    return this.request(`/api/v2/activities?workspaceId=${encodeURIComponent(app.workspaceId)}&projectId=${encodeURIComponent(app.projectId)}&applicationId=${encodeURIComponent(app.id)}&pageIndex=1&pageSize=50`);
  }

  async getApplicationLogs(app: ApplicationRef, containerName = 'php', pageSize = 100): Promise<unknown> {
    return this.request(`/api/v2/workspaces/${app.workspaceId}/projects/${app.projectId}/applications/${app.id}/http-logs/${encodeURIComponent(containerName)}?pageSize=${pageSize}`);
  }

  async listBackups(app: ApplicationRef): Promise<BackupRef[]> {
    this.requireHierarchy(app);
    const raw = await this.request(`/api/v2/workspaces/${app.workspaceId}/projects/${app.projectId}/applications/${app.id}/backups?pageIndex=1&pageSize=100`);
    const r = asRecord(raw);
    const items = Array.isArray(raw) ? raw :
      (Array.isArray(r.backups) ? r.backups : Array.isArray(r.data) ? r.data : Array.isArray(r.items) ? r.items : []);
    return items.map(item => {
      const x = asRecord(item);
      return {
        id: firstString(x, '_id', 'id', 'backupId') ?? '',
        applicationId: app.id,
        createdAt: firstString(x, 'createdAt', 'created_at'),
        type: firstString(x, 'type'),
        raw: item,
      };
    }).filter(b => b.id);
  }

  async createApplication(input: CreateApplicationRequest): Promise<ApplicationRef> {
    if (!config.enableRealCreate) {
      throw new Error('Real CREATE is disabled. Capture and verify a successful DevPanel UI create request/response, update the create profile, then set DP_ENABLE_REAL_CREATE=true.');
    }
    const profilePath = resolve(process.cwd(), `config/create-profiles/${config.createProfile}.json`);
    const profile = JSON.parse(await readFile(profilePath, 'utf8')) as { verified?: boolean; payload: Record<string, unknown> };
    if (!profile.verified) throw new Error(`Create profile ${config.createProfile} is not verified`);

    const replacements: Record<string, string> = {
      repositoryId: input.repositoryId ?? '', repositoryOwner: input.repositoryOwner,
      repositoryName: input.repositoryName, projectType: input.projectType,
      repositoryType: input.repositoryType ?? '', branch: input.branch,
      repositoryProvider: input.repositoryProvider,
    };
    const payload = JSON.parse(JSON.stringify(profile.payload).replace(/\{\{(\w+)\}\}/g, (_, key: string) => replacements[key] ?? ''));
    const raw = await this.request(`/api/v2/workspaces/${input.workspaceId}/projects`, { method: 'POST', body: JSON.stringify(payload) });

    // OpenAPI does not document this response. Support common shapes but fail closed if no project ID is present.
    const r = asRecord(raw);
    const projectId = firstString(r, '_id', 'id', 'projectId') ?? firstString(asRecord(r.project), '_id', 'id');
    if (!projectId) throw new Error('Create Project succeeded but projectId could not be extracted. Update RealDevPanelClient using the captured UI response contract.');

    for (let i = 0; i < 60; i++) {
      const listRaw = await this.request(`/api/v2/workspaces/${input.workspaceId}/projects/${projectId}/applications?pageIndex=1&pageSize=20`);
      const lr = asRecord(listRaw);
      const items = Array.isArray(listRaw) ? listRaw : (Array.isArray(lr.applications) ? lr.applications : Array.isArray(lr.data) ? lr.data : []);
      if (items.length > 0) return this.normalizeApplication(items[0], { projectId, workspaceId: input.workspaceId, originBranch: input.branch });
      await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error('Timed out waiting for DevPanel application after project creation');
  }

  async listGitOwners(provider = 'GITHUB'): Promise<GitOwnerRef[]> {
    const qs = new URLSearchParams({ gitProvider: provider.toUpperCase(), isUsePersonalToken: '1' });
    const raw = await this.request(`/api/v2/users/git-owners?${qs}`);
    const items = extractItems(raw, 'gitOwners', 'data', 'items');
    return items.map(item => {
      const r = asRecord(item);
      return {
        id: firstString(r, '_id', 'id', 'ownerId', 'login') ?? '',
        name: firstString(r, 'name', 'owner', 'login') ?? '',
        provider: firstString(r, 'provider', 'gitProvider') ?? provider.toUpperCase(),
        avatarUrl: firstString(r, 'avatarUrl', 'avatar_url'),
      };
    });
  }

  async listRepositories(owner?: string, provider?: string): Promise<GitRepoRef[]> {
    const qs = new URLSearchParams({ pageIndex: '1', pageSize: '100' });
    if (owner) qs.set('owner', owner);
    if (provider) qs.set('provider', provider);
    const raw = await this.request(`/api/v2/users/repositories?${qs}`);
    const items = extractItems(raw, 'repositories', 'data', 'items');
    if (items.length === 0 && Array.isArray(raw)) {
      return raw.map(item => this.normalizeRepo(item));
    }
    return items.map(item => this.normalizeRepo(item));
  }

  private normalizeRepo(raw: unknown): GitRepoRef {
    const r = asRecord(raw);
    return {
      id: firstString(r, '_id', 'id', 'repoId', 'repositoryId') ?? '',
      name: firstString(r, 'name', 'repoName', 'repositoryName') ?? '',
      owner: firstString(r, 'owner', 'ownerName', 'repositoryOwner') ?? '',
      provider: firstString(r, 'provider', 'gitProvider', 'repositoryProvider') ?? '',
      fullName: firstString(r, 'fullName', 'full_name'),
      defaultBranch: firstString(r, 'defaultBranch', 'default_branch'),
      private: r.private === true || r.isPrivate === true,
    };
  }

  async listRepositoryBranches(owner: string, repoName: string, repoId: string): Promise<GitBranchRef[]> {
    const encodedOwner = encodeURIComponent(owner);
    const encodedName = encodeURIComponent(repoName);
    const encodedId = encodeURIComponent(repoId);
    const raw = await this.request(`/api/v2/users/repositories/${encodedName}/${encodedId}/branches?owner=${encodedOwner}`);
    const items = extractItems(raw, 'branches', 'data', 'items');
    if (items.length === 0 && Array.isArray(raw)) {
      return raw.map(item => this.normalizeBranch(item));
    }
    return items.map(item => this.normalizeBranch(item));
  }

  private normalizeBranch(raw: unknown): GitBranchRef {
    const r = asRecord(raw);
    return {
      name: firstString(r, 'name', 'branchName', 'branch') ?? String(r.name ?? ''),
      commitSha: firstString(r, 'commitSha', 'commit_sha', 'sha'),
    };
  }

  async getGitTokenStatus(): Promise<{ hasPersonalToken: boolean; provider?: string }> {
    const raw = await this.request('/api/v2/users/gitToken');
    const r = asRecord(raw);
    const tokenValue = r.token ?? r.tokenValue;
    const hasToken = tokenValue !== undefined && tokenValue !== null && tokenValue !== '';
    return { hasPersonalToken: hasToken, provider: firstString(r, 'provider') };
  }

  async setGitToken(token: string, provider: string, username: string): Promise<void> {
    await this.request('/api/v2/users/gitToken', {
      method: 'PATCH',
      body: JSON.stringify({ gitProvider: provider.toUpperCase(), username, tokenValue: token }),
    });
  }

  async removeGitToken(provider: string): Promise<void> {
    await this.request('/api/v2/users/gitToken', {
      method: 'DELETE',
      body: JSON.stringify({ gitProvider: provider.toUpperCase() }),
    });
  }

  async createBackup(app: ApplicationRef): Promise<BackupRef> {
    this.requireHierarchy(app);
    const raw = await this.request(`/api/v2/workspaces/${app.workspaceId}/projects/${app.projectId}/applications/${app.id}/backups`, {
      method: 'POST', body: JSON.stringify({ type: 'MANUAL' })
    });
    const r = asRecord(raw);
    return { id: firstString(r, '_id', 'id', 'backupId') ?? 'unknown', applicationId: app.id, createdAt: new Date().toISOString(), type: 'MANUAL', raw };
  }

  async restoreBackup(app: ApplicationRef, backupId: string): Promise<unknown> {
    this.requireHierarchy(app);
    return this.request(`/api/v2/workspaces/${app.workspaceId}/projects/${app.projectId}/applications/${app.id}/backups/${encodeURIComponent(backupId)}/restore`, { method: 'PATCH' });
  }

  async deleteApplication(app: ApplicationRef): Promise<unknown> {
    this.requireHierarchy(app);
    return this.request(`/api/v2/workspaces/${app.workspaceId}/projects/${app.projectId}/applications/${app.id}`, { method: 'DELETE' });
  }

  private requireHierarchy(app: ApplicationRef): void {
    if (!app.workspaceId || !app.projectId) throw new Error(`Application ${app.id} lacks workspaceId/projectId required by DevPanel nested endpoints`);
  }
}
