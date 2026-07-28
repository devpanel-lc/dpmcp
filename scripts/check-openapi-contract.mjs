import { readFile } from 'node:fs/promises';

const path = process.argv[2];
if (!path) {
  console.error('Usage: node scripts/check-openapi-contract.mjs /path/to/openapi.json');
  process.exit(2);
}

const spec = JSON.parse(await readFile(path, 'utf8'));
const wantedPaths = [
  '/api/v2/applications',
  '/api/v2/applications/{id}',
  '/api/v2/applications/{id}/activities',
  '/api/v2/activities/{id}/logs',
  '/api/v2/workspaces/{workspaceId}/projects',
  '/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications',
  '/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}',
  '/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/backups',
  '/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/backups/{backupId}/restore'
];
const wantedSchemas = ['CreateProjectDTO', 'CreateBackupDTO', 'UpgradeApplicationDTO', 'ApplicationReplicasDTO', 'UpdateApplicationStateDTO', 'CreateDomainDTO'];

for (const p of wantedPaths) {
  console.log(`\n### ${p}`);
  console.log(JSON.stringify(spec.paths?.[p] ?? null, null, 2));
}
for (const s of wantedSchemas) {
  console.log(`\n### schema ${s}`);
  console.log(JSON.stringify(spec.components?.schemas?.[s] ?? null, null, 2));
}
