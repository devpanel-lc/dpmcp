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
    // Fetch every workspace's matches in parallel (not one sequential round-trip
    // per workspace) and combine them, so a name that uniquely matches in two
    // different workspaces is correctly reported as ambiguous instead of
    // silently resolving to whichever workspace happened to be listed first.
    const perWorkspace = await Promise.all(
      workspaces.map(ws => this.dp.listApplications(ws.id, query).catch(() => [] as ApplicationRef[])),
    );
    const all = perWorkspace.flat();
    const exact = all.find(a => a.id === query);
    if (exact) return exact;
    if (all.length === 0) {
      // Nothing found anywhere. If the default workspace was already among
      // the ones just queried above, don't re-fetch it -- report no match
      // there directly. Otherwise (no workspaces at all, or the default
      // workspace isn't one of the caller's accessible workspaces) query it
      // directly so the error still names a concrete workspace.
      if (workspaces.some(ws => ws.id === config.defaultWorkspaceId)) {
        throw new Error(`No application matches "${query}" in workspace ${config.defaultWorkspaceId}`);
      }
      return this.resolveInWorkspace(query, config.defaultWorkspaceId);
    }
    if (all.length > 1) {
      const choices = all.slice(0, 10).map(a => `${a.name ?? a.hostname ?? a.id} (${a.id}, workspace ${a.workspaceId})`).join(', ');
      throw new Error(`Application query is ambiguous across workspaces: "${query}". Matches: ${choices}. Pass workspaceId to disambiguate.`);
    }
    return all[0];
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
