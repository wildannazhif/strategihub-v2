export const FONT = "Arial, Helvetica, ui-sans-serif, system-ui, sans-serif";
export const MONO = "Arial, Helvetica, ui-sans-serif, system-ui, sans-serif";

/** Format angka ringkas id-ID untuk label sumbu */
export function fmtTick(v: number): string {
  if (v == null || Number.isNaN(v)) return '';
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  if (abs >= 1_000) return `${Math.round(v / 1_000)} rb`;
  return Math.round(v).toLocaleString('id-ID');
}

/** Warna grid theme-aware untuk page yang membangun opsi chart kustom */
export function gridColor(dark: boolean): string {
  return dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)';
}

/** Warna label sumbu theme-aware untuk page yang membangun opsi chart kustom */
export function axisLabelColor(dark: boolean): string {
  return dark ? '#a7b3c7' : '#475569';
}
