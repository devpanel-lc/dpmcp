import { createHash } from 'node:crypto';
import type { ApplicationRef } from '../domain/types.js';

export function applicationFingerprint(app: ApplicationRef): string {
  const stable = JSON.stringify({
    id: app.id,
    projectId: app.projectId,
    workspaceId: app.workspaceId,
    status: app.status ?? null,
    hostname: app.hostname ?? null,
    originBranch: app.originBranch ?? null,
  });
  return createHash('sha256').update(stable).digest('hex');
}
