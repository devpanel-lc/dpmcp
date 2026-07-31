import type { ApplicationRef } from '../domain/types.js';
import type { DevPanelClient } from '../clients/devpanel.js';
import { config } from '../config.js';

export class ApplicationResolver {
  constructor(private readonly dp: DevPanelClient) {}

  async resolve(query: string, workspaceId?: string): Promise<ApplicationRef> {
    if (workspaceId) {
      return this.resolveInWorkspace(query, workspaceId);
    }
    const workspaces = await this.dp.listWorkspaces();
    for (const ws of workspaces) {
      try {
        return await this.resolveInWorkspace(query, ws.id);
      } catch {
        continue;
      }
    }
    return this.resolveInWorkspace(query, config.defaultWorkspaceId);
  }

  private async resolveInWorkspace(query: string, workspaceId: string): Promise<ApplicationRef> {
    const matches = await this.dp.listApplications(workspaceId, query);
    const exact = matches.find(a => a.id === query);
    if (exact) return exact;
    if (matches.length === 0) throw new Error(`No application matches "${query}" in workspace ${workspaceId}`);
    if (matches.length > 1) {
      const choices = matches.slice(0, 10).map(a => `${a.name ?? a.hostname ?? a.id} (${a.id})`).join(', ');
      throw new Error(`Application query is ambiguous: "${query}" in workspace ${workspaceId}. Matches: ${choices}`);
    }
    return matches[0];
  }
}
