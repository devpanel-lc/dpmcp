import { randomUUID } from 'node:crypto';
import type { ApplicationRef, BackupRef } from '../domain/types.js';
import type { CreateApplicationRequest, DevPanelClient } from './devpanel.js';

export class MockDevPanelClient implements DevPanelClient {
  private apps = new Map<string, ApplicationRef>();
  private backups = new Map<string, BackupRef[]>();

  constructor() {
    const app: ApplicationRef = {
      id: 'app_demo_1', projectId: 'project_demo_1', workspaceId: 'mock-workspace',
      name: 'Existing Demo', hostname: 'existing-demo.example.local',
      status: 'DEPLOY_APPLICATION_SUCCESS', originBranch: 'main'
    };
    this.apps.set(app.id, app);
  }

  async listApplications(search?: string): Promise<ApplicationRef[]> {
    const all = [...this.apps.values()];
    if (!search) return structuredClone(all);
    const q = search.toLowerCase();
    return structuredClone(all.filter(a => `${a.name ?? ''} ${a.hostname ?? ''} ${a.id}`.toLowerCase().includes(q)));
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

  async createApplication(input: CreateApplicationRequest): Promise<ApplicationRef> {
    const projectId = `project_${randomUUID().slice(0, 8)}`;
    const app: ApplicationRef = {
      id: `app_${randomUUID().slice(0, 8)}`,
      projectId,
      workspaceId: input.workspaceId,
      name: input.repositoryName,
      hostname: `${input.repositoryName.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}.example.local`,
      status: 'DEPLOY_APPLICATION_SUCCESS',
      originBranch: input.branch,
    };
    this.apps.set(app.id, app);
    return structuredClone(app);
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
}
