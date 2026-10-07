/** Indonesian-locale formatting helpers */

const nfID = new Intl.NumberFormat('id-ID');

export function fmtInt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '–';
  return nfID.format(Math.round(n));
}

export function fmtCompact(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '–';
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} jt`;
  if (abs >= 1_000) return `${(n / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} rb`;
  return nfID.format(Math.round(n));
}

export function fmtPct(n: number | null | undefined, digits = 1): string {
  if (n == null || Number.isNaN(n)) return '–';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toLocaleString('id-ID', { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '–';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return '–';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function fmtMonthDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

const DOW_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
export function dowName(idx: number): string {
  return DOW_ID[idx] ?? '';
}

export function dateToDOW(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return DOW_ID[d.getDay()] ?? '';
}
