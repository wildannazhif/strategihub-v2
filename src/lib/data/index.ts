import type { DashboardData } from './types';

/**
 * Data dimuat dari chunk JSON kecil (src/data/chunks/*.json) agar tiap file
 * tetap di bawah batas ukuran API. Chunk digabung dengan deep merge:
 * - object digabung per kunci
 * - array digabung berurutan (daftar file diurutkan dulu agar deterministik)
 */
const modules = import.meta.glob<{ default: Record<string, unknown> }>(
  '../../data/chunks/*.json',
  { eager: true },
);

function deepMerge(a: unknown, b: unknown): unknown {
  if (
    a !== null && b !== null &&
    typeof a === 'object' && typeof b === 'object' &&
    !Array.isArray(a) && !Array.isArray(b)
  ) {
    const r: Record<string, unknown> = { ...(a as Record<string, unknown>) };
    for (const [k, v] of Object.entries(b as Record<string, unknown>)) {
      r[k] = k in r ? deepMerge(r[k], v) : v;
    }
    return r;
  }
  if (Array.isArray(a) && Array.isArray(b)) return [...a, ...b];
  return b;
}

const merged: Record<string, unknown> = {};
for (const path of Object.keys(modules).sort()) {
  const chunk = modules[path].default;
  for (const [k, v] of Object.entries(chunk)) {
    merged[k] = k in merged ? deepMerge(merged[k], v) : v;
  }
}

export const data = merged as unknown as DashboardData;
export type { DashboardData };
export * from './types';
