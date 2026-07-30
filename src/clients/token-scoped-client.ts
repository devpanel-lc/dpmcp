import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash } from 'node:crypto';
import type { ApplicationRef, BackupRef } from '../domain/types.js';
import type { CreateApplicationRequest, DevPanelClient } from './devpanel.js';
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

  async listApplications(search?: string): Promise<ApplicationRef[]> {
    return this.client().listApplications(search);
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

  async createBackup(app: ApplicationRef): Promise<BackupRef> {
    return this.client().createBackup(app);
  }

  async restoreBackup(app: ApplicationRef, backupId: string): Promise<unknown> {
    return this.client().restoreBackup(app, backupId);
  }

  async deleteApplication(app: ApplicationRef): Promise<unknown> {
    return this.client().deleteApplication(app);
  }
}
