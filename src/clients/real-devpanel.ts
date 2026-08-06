import type { ApplicationRef, BackupRef, BackupFileRef, WorkspaceRef, ProjectRef, ProjectTypeRef, ActivateConfig, GitOwnerRef, GitRepoRef, GitBranchRef, EnvironmentRef } from '../domain/types.js';
import type { CreateApplicationRequest, CreateWorkspaceRequest, DevPanelClient } from './devpanel.js';
import { apiPath } from './api-paths.js';
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

// Mirrors a real DevPanel UI application-update request (captured 2026-08-06). This
// endpoint expects the application's FULL current config on every PATCH -- the DevPanel
// UI reads current state and PATCHes it back with one field flipped, it does not accept
// a partial/delta body. buildUpdateAppPayload() re-reads the application first and
// extracts as many of these fields as possible from its raw GET response; the values
// below are only the last-resort fallback for fields presumed safe to default (fixed
// platform conventions). Fields where a wrong guess could silently downgrade a real
// app's resources (container image, capacity/capacityLimit, storage, groupType) are
// NOT defaulted from here -- buildUpdateAppPayload() throws if they can't be read live.
const UPDATE_APP_SAFE_DEFAULTS = {
  appRoot: '/var/www/html',
  webRoot: '/var/www/html/web',
  codesDirectory: '/var/www/html',
  startAppScript: 'tail -f ~/dev/log',
  imagePullPolicy: 'Always',
  filePermissionLevel: 'stricterPermission',
  isEnablePPA: false,
  isEnableBasicAuth: false,
  ipRestrictionSlug: '',
  isEnable: true,
};

function asRecord(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  return v as Record<string, unknown>;
}

function firstString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) if (typeof obj[k] === 'string') return obj[k] as string;
  return undefined;
}

function firstNumber(obj: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) if (typeof obj[k] === 'number') return obj[k] as number;
  return undefined;
}

function firstBoolean(obj: Record<string, unknown>, ...keys: string[]): boolean | undefined {
  for (const k of keys) if (typeof obj[k] === 'boolean') return obj[k] as boolean;
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
      isEnableEditor: firstBoolean(r, 'isEnableEditor') ?? fallback?.isEnableEditor,
      isEnablePMA: firstBoolean(r, 'isEnablePMA') ?? fallback?.isEnablePMA,
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
    const raw = await this.request(`${apiPath('/api/v2/environments')}?${qs}`);
    const items = extractItems(raw, 'environments', 'data', 'items');
    if (items.length === 0 && Array.isArray(raw)) return raw.map(item => this.normalizeEnvironment(item));
    return items.map(item => this.normalizeEnvironment(item));
  }

  async createWorkspace(input: CreateWorkspaceRequest): Promise<WorkspaceRef> {
    const payload: Record<string, unknown> = { name: input.name, environmentId: input.environmentId };
    if (input.description) payload.description = input.description;
    if (input.tags && input.tags.length > 0) payload.tags = input.tags;
    const raw = await this.request(apiPath('/api/v2/workspaces'), { method: 'POST', body: JSON.stringify(payload) });
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
    const raw = await this.request(`${apiPath('/api/v2/workspaces')}?pageIndex=1&pageSize=100`);
    const items = extractItems(raw, 'workspaces', 'data', 'items');
    return items.map(item => this.normalizeWorkspace(item));
  }

  async listProjects(workspaceId: string): Promise<ProjectRef[]> {
    const raw = await this.request(`${apiPath('/api/v2/workspaces/{workspaceId}/projects', { workspaceId })}?pageIndex=1&pageSize=100`);
    const items = extractItems(raw, 'projects', 'data', 'items');
    return items.map(item => this.normalizeProject(item));
  }

  async listProjectTypes(): Promise<ProjectTypeRef[]> {
    const raw = await this.request(apiPath('/api/v2/projects/project-types'));
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
    const raw = await this.request(`${apiPath('/api/v2/workspaces/{workspaceId}/applications', { workspaceId })}?${qs}`);
    const items = extractItems(raw, 'applications', 'data', 'items');
    return items.map(item => this.normalizeApplication(item));
  }

  async listProjectApplications(workspaceId: string, projectId: string): Promise<ApplicationRef[]> {
    const qs = new URLSearchParams({ pageIndex: '1', pageSize: '100' });
    const raw = await this.request(`${apiPath('/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications', { workspaceId, projectId })}?${qs}`);
    const items = extractItems(raw, 'applications', 'data', 'items');
    return items.map(item => this.normalizeApplication(item));
  }

  async getApplication(app: ApplicationRef): Promise<ApplicationRef> {
    this.requireHierarchy(app);
    const raw = await this.request(apiPath('/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}', { workspaceId: app.workspaceId, projectId: app.projectId, applicationId: app.id }));
    return this.normalizeApplication(raw, { id: app.id, projectId: app.projectId, workspaceId: app.workspaceId });
  }

  async getApplicationActivities(app: ApplicationRef): Promise<unknown> {
    return this.request(`${apiPath('/api/v2/activities')}?workspaceId=${encodeURIComponent(app.workspaceId)}&projectId=${encodeURIComponent(app.projectId)}&applicationId=${encodeURIComponent(app.id)}&pageIndex=1&pageSize=50`);
  }

  async getApplicationLogs(app: ApplicationRef, containerName = 'php', pageSize = 100): Promise<unknown> {
    const path = apiPath('/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/http-logs/{containerName}', { workspaceId: app.workspaceId, projectId: app.projectId, applicationId: app.id, containerName });
    return this.request(`${path}?pageSize=${pageSize}`);
  }

  async listBackups(app: ApplicationRef): Promise<BackupRef[]> {
    this.requireHierarchy(app);
    const path = apiPath('/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/backups', { workspaceId: app.workspaceId, projectId: app.projectId, applicationId: app.id });
    const raw = await this.request(`${path}?pageIndex=1&pageSize=100`);
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

  async getBackupFile(app: ApplicationRef, backupId: string, fileId: string): Promise<BackupFileRef> {
    this.requireHierarchy(app);
    const path = apiPath('/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/backups/{backupId}/files/{fileId}',
      { workspaceId: app.workspaceId, projectId: app.projectId, applicationId: app.id, backupId, fileId });
    const raw = await this.request(`${path}?downloadURL=true`);
    return this.normalizeBackupFile(raw, backupId, fileId);
  }

  // downloadURL is a pre-signed URL (S3/DO/Azure/OVH, valid 1h); downloadPgsqlURL
  // is present alongside it when the application and environment both have
  // isEnablePgDb set (controller source: applications.controller.ts:684-742).
  private normalizeBackupFile(raw: unknown, backupId: string, fileId: string): BackupFileRef {
    const r = asRecord(raw);
    const downloadURL = firstString(r, 'downloadURL');
    if (!downloadURL) {
      throw new Error(`Backup file response had no downloadURL (backupId=${backupId}, fileId=${fileId}) -- pass downloadURL=true and confirm the file's status is ready.`);
    }
    const downloadPgsqlURL = firstString(r, 'downloadPgsqlURL');
    return { backupId, fileId, downloadURL, downloadPgsqlURL, raw };
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
    const raw = await this.request(apiPath('/api/v2/workspaces/{workspaceId}/projects', { workspaceId: input.workspaceId }), { method: 'POST', body: JSON.stringify(payload) });

    const r = asRecord(raw);
    const projectId = firstString(r, '_id', 'id', 'projectId') ?? firstString(asRecord(r.project), '_id', 'id');
    if (!projectId) throw new Error('Create Project succeeded but projectId could not be extracted. Update RealDevPanelClient using the captured UI response contract.');

    const listPath = apiPath('/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications', { workspaceId: input.workspaceId, projectId });
    for (let i = 0; i < 60; i++) {
      const listRaw = await this.request(`${listPath}?pageIndex=1&pageSize=20`);
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
      apiPath('/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/activate', { workspaceId: app.workspaceId, projectId: app.projectId, applicationId: app.id }),
      { method: 'PATCH', body: JSON.stringify(body) },
    );
    let last = this.normalizeApplication(raw, { id: app.id, projectId: app.projectId, workspaceId: app.workspaceId });
    const listPath = apiPath('/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications', { workspaceId: app.workspaceId, projectId: app.projectId });
    // Activation is async: the endpoint returns immediately while a background task deploys to K8s.
    // Poll the list endpoint until the application reaches DEPLOY_APPLICATION_SUCCESS (bounded).
    // On timeout, return the last observed status so slow deployments still surface as SUCCEEDED
    // plans for the agent to verify with devpanel_list_applications.
    for (let attempt = 0; attempt < ACTIVATE_POLL_MAX_ATTEMPTS && last.status !== 'DEPLOY_APPLICATION_SUCCESS'; attempt++) {
      await new Promise(resolve => setTimeout(resolve, ACTIVATE_POLL_INTERVAL_MS));
      const listRaw = await this.request(`${listPath}?pageIndex=1&pageSize=20`);
      const items = extractItems(listRaw, 'applications', 'data', 'items');
      const current = items.find(item => firstString(asRecord(item), '_id', 'id', 'applicationId') === app.id);
      if (current) last = this.normalizeApplication(current, { id: app.id, projectId: app.projectId, workspaceId: app.workspaceId });
    }
    return last;
  }

  // Confirmed real request (captured 2026-08-06): PATCH .../applications/{id}/update
  // with the application's full config, one field flipped. See UPDATE_APP_SAFE_DEFAULTS
  // above and buildUpdateAppPayload() below for how the rest of the body is sourced.
  async setEditorEnabled(app: ApplicationRef, enabled: boolean): Promise<ApplicationRef> {
    return this.updateApp(app, { isEnableEditor: enabled });
  }

  async setPmaEnabled(app: ApplicationRef, enabled: boolean): Promise<ApplicationRef> {
    return this.updateApp(app, { isEnablePMA: enabled });
  }

  private async updateApp(app: ApplicationRef, overrides: Record<string, unknown>): Promise<ApplicationRef> {
    this.requireHierarchy(app);
    const body = { ...(await this.buildUpdateAppPayload(app)), ...overrides };
    const raw = await this.request(
      apiPath('/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/update', { workspaceId: app.workspaceId, projectId: app.projectId, applicationId: app.id }),
      { method: 'PATCH', body: JSON.stringify(body) },
    );
    return this.normalizeApplication(raw, { id: app.id, projectId: app.projectId, workspaceId: app.workspaceId });
  }

  private async buildUpdateAppPayload(app: ApplicationRef): Promise<Record<string, unknown>> {
    const current = await this.getApplication(app);
    const r = asRecord(current.raw);
    const requireString = (key: string): string => {
      const v = firstString(r, key);
      if (v === undefined) {
        throw new Error(
          `Cannot toggle code server/phpMyAdmin: application ${app.id}'s current "${key}" could not be read from DevPanel's ` +
          'GET .../applications/{id} response. Update RealDevPanelClient.buildUpdateAppPayload() once the real response field ' +
          'name is confirmed -- see README.md.'
        );
      }
      return v;
    };
    const requireNumber = (key: string): number => {
      const v = firstNumber(r, key);
      if (v === undefined) {
        throw new Error(
          `Cannot toggle code server/phpMyAdmin: application ${app.id}'s current "${key}" could not be read from DevPanel's ` +
          'GET .../applications/{id} response. Update RealDevPanelClient.buildUpdateAppPayload() once the real response field ' +
          'name is confirmed -- see README.md.'
        );
      }
      return v;
    };
    return {
      appRoot: firstString(r, 'appRoot') ?? UPDATE_APP_SAFE_DEFAULTS.appRoot,
      webRoot: firstString(r, 'webRoot') ?? UPDATE_APP_SAFE_DEFAULTS.webRoot,
      codesDirectory: firstString(r, 'codesDirectory') ?? UPDATE_APP_SAFE_DEFAULTS.codesDirectory,
      startAppScript: firstString(r, 'startAppScript') ?? UPDATE_APP_SAFE_DEFAULTS.startAppScript,
      containerImage: requireString('containerImage'),
      imagePullPolicy: firstString(r, 'imagePullPolicy') ?? UPDATE_APP_SAFE_DEFAULTS.imagePullPolicy,
      groupType: requireString('groupType'),
      capacity: requireString('capacity'),
      capacityLimit: requireString('capacityLimit'),
      storage: requireNumber('storage'),
      isEnablePMA: firstBoolean(r, 'isEnablePMA') ?? false,
      isEnablePPA: firstBoolean(r, 'isEnablePPA') ?? UPDATE_APP_SAFE_DEFAULTS.isEnablePPA,
      isEnableEditor: firstBoolean(r, 'isEnableEditor') ?? false,
      filePermissionLevel: firstString(r, 'filePermissionLevel') ?? UPDATE_APP_SAFE_DEFAULTS.filePermissionLevel,
      isEnable: firstBoolean(r, 'isEnable') ?? UPDATE_APP_SAFE_DEFAULTS.isEnable,
      isEnableBasicAuth: firstBoolean(r, 'isEnableBasicAuth') ?? UPDATE_APP_SAFE_DEFAULTS.isEnableBasicAuth,
      ipRestrictionSlug: firstString(r, 'ipRestrictionSlug') ?? UPDATE_APP_SAFE_DEFAULTS.ipRestrictionSlug,
    };
  }

  // DeactivateLAMAppDTO is an empty schema in the OpenAPI spec (like ActivateLAMAppDTO
  // was before ACTIVATE_DEFAULTS was captured from a real UI request) -- no real
  // deactivate request has been captured, so this sends an empty body as a best guess.
  // Update this once a real request/response is captured -- see README.md.
  async deactivateApplication(app: ApplicationRef): Promise<ApplicationRef> {
    this.requireHierarchy(app);
    const raw = await this.request(
      apiPath('/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/deactivate', { workspaceId: app.workspaceId, projectId: app.projectId, applicationId: app.id }),
      { method: 'PATCH', body: JSON.stringify({}) },
    );
    let last = this.normalizeApplication(raw, { id: app.id, projectId: app.projectId, workspaceId: app.workspaceId });
    const listPath = apiPath('/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications', { workspaceId: app.workspaceId, projectId: app.projectId });
    // Mirrors activateApplication()'s polling: deactivation is presumably also async.
    for (let attempt = 0; attempt < ACTIVATE_POLL_MAX_ATTEMPTS && last.status !== 'UNDEPLOY_APPLICATION_SUCCESS'; attempt++) {
      await new Promise(resolve => setTimeout(resolve, ACTIVATE_POLL_INTERVAL_MS));
      const listRaw = await this.request(`${listPath}?pageIndex=1&pageSize=20`);
      const items = extractItems(listRaw, 'applications', 'data', 'items');
      const current = items.find(item => firstString(asRecord(item), '_id', 'id', 'applicationId') === app.id);
      if (current) last = this.normalizeApplication(current, { id: app.id, projectId: app.projectId, workspaceId: app.workspaceId });
    }
    return last;
  }

  async listGitOwners(provider = 'GITHUB'): Promise<GitOwnerRef[]> {
    const qs = new URLSearchParams({ gitProvider: provider.toUpperCase(), isUsePersonalToken: '1' });
    const raw = await this.request(`${apiPath('/api/v2/users/git-owners')}?${qs}`);
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
    const raw = await this.request(`${apiPath('/api/v2/users/repositories')}?${qs}`);
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
    const path = apiPath('/api/v2/users/repositories/{repoName}/{repoId}/branches', { repoName, repoId });
    const raw = await this.request(`${path}?gitProvider=${provider.toUpperCase()}&owner=${encodedOwner}&isUsePersonalToken=1`);
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
    await this.request(apiPath('/api/v2/users/gitToken'), {
      method: 'PATCH',
      body: JSON.stringify({ gitProvider: provider.toUpperCase(), username, tokenValue: token }),
    });
  }

  async removeGitToken(provider: string): Promise<void> {
    await this.request(apiPath('/api/v2/users/gitToken'), {
      method: 'DELETE',
      body: JSON.stringify({ gitProvider: provider.toUpperCase() }),
    });
  }

  async createBackup(app: ApplicationRef): Promise<BackupRef> {
    this.requireHierarchy(app);
    const path = apiPath('/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/backups', { workspaceId: app.workspaceId, projectId: app.projectId, applicationId: app.id });
    const raw = await this.request(path, {
      method: 'POST', body: JSON.stringify({ type: 'MANUAL' })
    });
    const r = asRecord(raw);
    return { id: firstString(r, '_id', 'id', 'backupId') ?? 'unknown', applicationId: app.id, createdAt: new Date().toISOString(), type: 'MANUAL', raw };
  }

  // The OpenAPI spec types this as a bodyless PATCH returning 200 with no
  // content, but that has never been confirmed against a live backend --
  // DevPanel's UI has no restore feature to capture a real request from, so
  // (unlike createApplication/activateApplication/getBackupFile) there is no
  // way to verify this contract until a real restore has been performed.
  async restoreBackup(app: ApplicationRef, backupId: string): Promise<unknown> {
    this.requireHierarchy(app);
    const path = apiPath('/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/backups/{backupId}/restore', { workspaceId: app.workspaceId, projectId: app.projectId, applicationId: app.id, backupId });
    return this.request(path, { method: 'PATCH' });
  }

  async deleteApplication(app: ApplicationRef): Promise<unknown> {
    this.requireHierarchy(app);
    const path = apiPath('/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}', { workspaceId: app.workspaceId, projectId: app.projectId, applicationId: app.id });
    return this.request(path, { method: 'DELETE' });
  }

  async deleteProject(project: ProjectRef): Promise<unknown> {
    if (!project.workspaceId || !project.id) throw new Error(`Project ${project.id} lacks workspaceId required by DevPanel nested endpoints`);
    const path = apiPath('/api/v2/workspaces/{workspaceId}/projects/{projectId}', { workspaceId: project.workspaceId, projectId: project.id });
    return this.request(path, { method: 'DELETE' });
  }

  private requireHierarchy(app: ApplicationRef): void {
    if (!app.workspaceId || !app.projectId) throw new Error(`Application ${app.id} lacks workspaceId/projectId required by DevPanel nested endpoints`);
  }
}
