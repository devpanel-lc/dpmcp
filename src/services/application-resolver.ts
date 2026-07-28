import type { ApplicationRef } from '../domain/types.js';
import type { DevPanelClient } from '../clients/devpanel.js';

export class ApplicationResolver {
  constructor(private readonly dp: DevPanelClient) {}

  async resolve(query: string): Promise<ApplicationRef> {
    const exactById = await this.tryById(query);
    if (exactById) return exactById;
    const matches = await this.dp.listApplications(query);
    if (matches.length === 0) throw new Error(`No application matches: ${query}`);
    if (matches.length > 1) {
      const choices = matches.slice(0, 10).map(a => `${a.name ?? a.hostname ?? a.id} (${a.id})`).join(', ');
      throw new Error(`Application query is ambiguous: ${query}. Matches: ${choices}`);
    }
    return matches[0];
  }

  private async tryById(id: string): Promise<ApplicationRef | undefined> {
    try { return await this.dp.getApplication(id); } catch { return undefined; }
  }
}
