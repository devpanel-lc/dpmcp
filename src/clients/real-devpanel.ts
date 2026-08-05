import type { ApplicationRef, BackupRef, WorkspaceRef, ProjectRef, ProjectTypeRef, ActivateConfig, GitOwnerRef, GitRepoRef, GitBranchRef, EnvironmentRef } from '../domain/types.js';
import type { CreateApplicationRequest, CreateWorkspaceRequest, DevPanelClient } from './devpanel.js';
import { config } from '../config.js';
import { assertRealCreateInput, assertRealCreateReady, loadCreateProfile } from './real-create-gate.js';
import { getAccessToken, getLoginUrl, refreshNow, clearSession } from '../auth/session.js';

const ACTIVATE_POLL_MAX_ATTEMPTS = 150;
const ACTIVATE_POLL_INTERVAL_MS = 2000;

// Mirrors a real DevPanel UI activate request (captured 2026-08-03).
const ACTIVATE_DEFAULTS = {
  copyDatabaseFilesType: '',
  isEnablePgDb: false,
  isEnableBasicAuth: false,
  filePermissionLevel: 'stricterPermission',
  containerImage: 'devpanel/php:8.3-base-rc',
  secretManager: '',
  appRoot: '/var/www/html',
  webRoot: '/var/www/html/web',
  capacity: 'micro',
  capacityLimit: 'micro',
  groupType: 'on-demand',
  storage: 5,
  isEnableEditor: false,
  isEnablePMA: false,
};

function asRecord(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  return v as Record<string, unknown>;
}

function firstString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) if (typeof obj[k] === 'string') return obj[k] as string;
  return undefined;
}

function refId(v: unknown, ...keys: string[]): string | undefined {
  if (typeof v === 'string' && v.length > 0) return v;
  return firstString(asRecord(v), ...keys);
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
  /**
   * @param accessToken The token to send to DevPanel.
   * @param ssoMode     true = SSO session token (supports refresh on 401).
   *                    false = static personal access token (no refresh).
   * @param sourceHint  Where this token came from, for the 401 error message.
   */
  constructor(
    private readonly accessToken: string,
    private readonly ssoMode: boolean = false,
    private readonly sourceHint: string = 'DP_ACCESS_TOKEN in .env',
  ) { }

  private async request(path: string, init: RequestInit = {}): Promise<unknown> {
    return this.requestWithToken(path, init, this.accessToken, false);
  }

  /**
   * Single upstream request path. On DevPanel 401 the SSO session is refreshed
   * (once) and the request retried with the fresh access token. If refresh
   * fails or the retry is also rejected, the session has been cleared and the
   * caller must re-login.
   */
  private async requestWithToken(path: string, init: RequestInit, token: string, retried: boolean): Promise<unknown> {
    const response = await fetch(`${config.apiBaseUrl.replace(/\/$/, '')}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
    const text = await response.text();
    let body: unknown = text;
    try { body = text ? JSON.parse(text) : undefined; } catch { /* keep text */ }
    if (response.status === 401) {
      if (!this.ssoMode) {
        // Static token mode: no session to refresh — report the bad token.
        throw new Error(`DevPanel 401 ${path}: access token rejected — check ${this.sourceHint}`);
      }
      if (retried) {
        clearSession();
        throw new Error(`DevPanel 401 ${path}: access token rejected after refresh — SSO re-login required (open ${getLoginUrl() || 'the Cognito login URL'})`);
      }
      const refreshed = await refreshNow(true);
      const fresh = refreshed ? getAccessToken() : undefined;
      if (refreshed && fresh) {
        return this.requestWithToken(path, init, fresh, true);
      }
      throw new Error(`DevPanel 401 ${path}: SSO session expired and could not be refreshed — re-login required (open ${getLoginUrl() || 'the Cognito login URL'})`);
    }
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
      projectId: refId(r.project, '_id', 'id', 'projectId') ?? fallback?.projectId ?? '',
      workspaceId: refId(r.workspace, '_id', 'id', 'workspaceId') ?? refId(project.workspace, '_id', 'id', 'workspaceId') ?? fallback?.workspaceId ?? config.defaultWorkspaceId,
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

  async listApplications(workspaceId: string, search?: string): Promise<ApplicationRef[]> {
    const qs = new URLSearchParams({ pageIndex: '1', pageSize: '100' });
    if (search) qs.set('search', search);
    const raw = await this.request(`/api/v2/workspaces/${workspaceId}/applications?${qs}`);
    const items = extractItems(raw, 'applications', 'data', 'items');
    return items.map(item => this.normalizeApplication(item));
  }

  async listProjectApplications(workspaceId: string, projectId: string): Promise<ApplicationRef[]> {
    const qs = new URLSearchParams({ pageIndex: '1', pageSize: '100' });
    const raw = await this.request(`/api/v2/workspaces/${workspaceId}/projects/${projectId}/applications?${qs}`);
    const items = extractItems(raw, 'applications', 'data', 'items');
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
    const items = extractItems(raw, 'backups', 'data', 'items');
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
    await assertRealCreateReady();
    assertRealCreateInput(input);
    const profile = await loadCreateProfile();

    const replacements: Record<string, string> = {
      projectName: input.name,
      repositoryId: input.repositoryId ?? '', repositoryOwner: input.repositoryOwner,
      repositoryName: input.repositoryName, projectType: input.projectType,
      repositoryType: input.repositoryType ?? 'EXISTING', branch: input.branch,
      repositoryProvider: input.repositoryProvider, branchType: input.branch.toUpperCase(),
    };
    const payload = JSON.parse(JSON.stringify(profile.payload).replace(/\{\{(\w+)\}\}/g, (_, key: string) => replacements[key] ?? ''));
    if (typeof payload.repositoryId === 'string' && /^\d+$/.test(payload.repositoryId)) {
      payload.repositoryId = Number(payload.repositoryId);
    }
    const raw = await this.request(`/api/v2/workspaces/${input.workspaceId}/projects`, { method: 'POST', body: JSON.stringify(payload) });

    const r = asRecord(raw);
    const projectId = firstString(r, '_id', 'id', 'projectId') ?? firstString(asRecord(r.project), '_id', 'id');
    if (!projectId) throw new Error('Create Project succeeded but projectId could not be extracted. Update RealDevPanelClient using the captured UI response contract.');

    for (let i = 0; i < 60; i++) {
      const listRaw = await this.request(`/api/v2/workspaces/${input.workspaceId}/projects/${projectId}/applications?pageIndex=1&pageSize=20`);
      const items = extractItems(listRaw, 'applications', 'data', 'items');
      if (items.length > 0) return this.normalizeApplication(items[0], { projectId, workspaceId: input.workspaceId, originBranch: input.branch });
      await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error('Timed out waiting for DevPanel application after project creation');
  }

  async activateApplication(app: ApplicationRef, actConfig: ActivateConfig): Promise<ApplicationRef> {
    this.requireHierarchy(app);
    const body = { ...ACTIVATE_DEFAULTS, ...actConfig };
    const raw = await this.request(
      `/api/v2/workspaces/${app.workspaceId}/projects/${app.projectId}/applications/${app.id}/activate`,
      { method: 'PATCH', body: JSON.stringify(body) },
    );
    let last = this.normalizeApplication(raw, { id: app.id, projectId: app.projectId, workspaceId: app.workspaceId });
    // Activation is async: the endpoint returns immediately while a background task deploys to K8s.
    // Poll the list endpoint until the application reaches DEPLOY_APPLICATION_SUCCESS (bounded).
    // On timeout, return the last observed status so slow deployments still surface as SUCCEEDED
    // plans for the agent to verify with devpanel_list_applications.
    for (let attempt = 0; attempt < ACTIVATE_POLL_MAX_ATTEMPTS && last.status !== 'DEPLOY_APPLICATION_SUCCESS'; attempt++) {
      await new Promise(resolve => setTimeout(resolve, ACTIVATE_POLL_INTERVAL_MS));
      const listRaw = await this.request(`/api/v2/workspaces/${app.workspaceId}/projects/${app.projectId}/applications?pageIndex=1&pageSize=20`);
      const items = extractItems(listRaw, 'applications', 'data', 'items');
      const current = items.find(item => firstString(asRecord(item), '_id', 'id', 'applicationId') === app.id);
      if (current) last = this.normalizeApplication(current, { id: app.id, projectId: app.projectId, workspaceId: app.workspaceId });
    }
    return last;
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

  async listRepositories(owner?: string, provider = 'GITHUB'): Promise<GitRepoRef[]> {
    const qs = new URLSearchParams({ pageIndex: '1', isUsePersonalToken: '1' });
    if (owner) qs.set('owner', owner);
    qs.set('gitProvider', provider.toUpperCase());
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

  async listRepositoryBranches(owner: string, repoName: string, repoId: string, provider = 'GITHUB'): Promise<GitBranchRef[]> {
    const encodedOwner = encodeURIComponent(owner);
    const encodedName = encodeURIComponent(repoName);
    const encodedId = encodeURIComponent(repoId);
    const raw = await this.request(`/api/v2/users/repositories/${encodedName}/${encodedId}/branches?gitProvider=${provider.toUpperCase()}&owner=${encodedOwner}&isUsePersonalToken=1`);
    const items = extractItems(raw, 'branches', 'data', 'items');
    if (items.length === 0 && Array.isArray(raw)) {
      return raw.map(item => this.normalizeBranch(item));
    }
    return items.map(item => this.normalizeBranch(item));
  }

  private normalizeBranch(raw: unknown): GitBranchRef {
    const r = asRecord(raw);
    const commit = asRecord(r.commit);
    return {
      name: firstString(r, 'name', 'branchName', 'branch') ?? String(r.name ?? ''),
      commitSha: firstString(r, 'commitSha', 'commit_sha', 'sha') ?? firstString(commit, 'sha', 'id'),
    };
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
