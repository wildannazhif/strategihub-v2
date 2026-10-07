import type { ModaKey } from '../data/types';

export interface ModaMeta {
  key: ModaKey;
  label: string;
  short: string;
  icon: string; // lucide icon name used by module components
  color: string;
  colorSoft: string;
  desc: string;
}

export const MODA: Record<ModaKey, ModaMeta> = {
  UDARA: {
    key: 'UDARA',
    label: 'Angkutan Udara',
    short: 'Udara',
    icon: 'Plane',
    color: '#38bdf8',
    colorSoft: 'rgba(56,189,248,.14)',
    desc: 'Penerbangan komersial berjadwal',
  },
  KA: {
    key: 'KA',
    label: 'Kereta Api',
    short: 'KA',
    icon: 'TrainFront',
    color: '#fbbf24',
    colorSoft: 'rgba(251,191,36,.14)',
    desc: 'KA penumpang PT KAI',
  },
  BUS: {
    key: 'BUS',
    label: 'Bus AKAP',
    short: 'Bus',
    icon: 'Bus',
    color: '#34d399',
    colorSoft: 'rgba(52,211,153,.14)',
    desc: 'Bus antar-kota antar-provinsi',
  },
  ASDP: {
    key: 'ASDP',
    label: 'ASDP Penyeberangan',
    short: 'ASDP',
    icon: 'Ship',
    color: '#a78bfa',
    colorSoft: 'rgba(167,139,250,.14)',
    desc: 'Kapal feri penyeberangan',
  },
  LAUT: {
    key: 'LAUT',
    label: 'Transportasi Laut',
    short: 'Laut',
    icon: 'Anchor',
    color: '#22d3ee',
    colorSoft: 'rgba(34,211,238,.14)',
    desc: 'Kapal laut penumpang',
  },
};

export const TOTAL_COLOR = '#0f172a';

export type DensityStatus = 'critical' | 'high' | 'moderate' | 'stable';

export function densityStatus(surgePct: number): { status: DensityStatus; label: string; color: string; bg: string } {
  if (surgePct >= 80)
    return { status: 'critical', label: 'Sangat Kritis', color: '#dc2626', bg: 'rgba(220,38,38,.1)' };
  if (surgePct >= 50)
    return { status: 'high', label: 'Padat Tinggi', color: '#ea580c', bg: 'rgba(234,88,12,.1)' };
  if (surgePct >= 25)
    return { status: 'moderate', label: 'Sibuk Terkendali', color: '#ca8a04', bg: 'rgba(202,138,4,.12)' };
  return { status: 'stable', label: 'Stabil', color: '#34d399', bg: 'rgba(22,163,74,.1)' };
}
