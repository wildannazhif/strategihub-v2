export const FONT = "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif";
export const MONO = "'JetBrains Mono', ui-monospace, monospace";

/** Format angka ringkas id-ID untuk label sumbu */
export function fmtTick(v: number): string {
  if (v == null || Number.isNaN(v)) return '';
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  if (abs >= 1_000) return `${Math.round(v / 1_000)} rb`;
  return Math.round(v).toLocaleString('id-ID');
}
