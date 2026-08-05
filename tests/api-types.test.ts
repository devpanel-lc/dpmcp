import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { renderApiTypes } from '../scripts/generate-api-types.js';

describe('generated API types', () => {
  it('matches a fresh generation from devpanel-openapi.json', async () => {
    const committed = await readFile(new URL('../src/generated/devpanel-api.d.ts', import.meta.url), 'utf8');
    const fresh = await renderApiTypes();
    expect(committed, 'src/generated/devpanel-api.d.ts is stale — run `npm run generate:api` and commit the diff').toBe(fresh);
  });
});
