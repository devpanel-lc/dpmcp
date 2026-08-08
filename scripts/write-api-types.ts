import { mkdir, writeFile } from 'node:fs/promises';
import { renderApiTypes } from './generate-api-types.js';

const outPath = new URL('../src/generated/devpanel-api.d.ts', import.meta.url);
await mkdir(new URL('../src/generated/', import.meta.url), { recursive: true });
await writeFile(outPath, await renderApiTypes());
console.error('Wrote src/generated/devpanel-api.d.ts');
