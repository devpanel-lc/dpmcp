import { createHash } from 'node:crypto';

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !['hash', 'status', 'approval', 'execution'].includes(key))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => [key, stable(val)])
    );
  }
  return value;
}

export function hashPlan(value: unknown): string {
  const json = JSON.stringify(stable(value));
  return `sha256:${createHash('sha256').update(json).digest('hex')}`;
}
