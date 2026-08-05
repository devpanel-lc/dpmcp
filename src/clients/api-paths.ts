import type { paths } from '../generated/devpanel-api.js';

type ExtractParams<S extends string> =
  S extends `${string}{${infer P}}${infer Rest}` ? P | ExtractParams<Rest> : never;

/**
 * Builds a request path from a template that must be a real key in the generated
 * OpenAPI `paths` type. If devpanel-openapi.json renames or removes an endpoint,
 * `npm run generate:api` + `npm run typecheck` surfaces every affected call site
 * here instead of failing silently at runtime.
 */
export function apiPath<P extends keyof paths & string>(
  template: P,
  ...params: ExtractParams<P> extends never ? [] : [Record<ExtractParams<P>, string | number>]
): string {
  const values = params[0] as Record<string, string | number> | undefined;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => encodeURIComponent(String(values?.[key] ?? '')));
}
