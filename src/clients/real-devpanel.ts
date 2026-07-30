import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { ApplicationRef, BackupRef } from '../domain/types.js';
import type { CreateApplicationRequest, DevPanelClient } from './devpanel.js';
import { config } from '../config.js';

function asRecord(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  return v as Record<string, unknown>;
}

function firstString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) if (typeof obj[k] === 'string') return obj[k] as string;
  return undefined;
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
