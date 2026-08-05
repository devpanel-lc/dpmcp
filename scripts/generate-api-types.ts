import openapiTS, { astToString } from 'openapi-typescript';
import { readFile } from 'node:fs/promises';

export async function renderApiTypes(): Promise<string> {
  const spec = JSON.parse(await readFile(new URL('../devpanel-openapi.json', import.meta.url), 'utf8'));
  const ast = await openapiTS(spec);
  return '// GENERATED FILE — run `npm run generate:api`. Do not edit by hand.\n' + astToString(ast);
}
