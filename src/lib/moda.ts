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
    color: '#0284c7',
    colorSoft: 'rgba(2,132,199,.12)',
    desc: 'Penerbangan komersial berjadwal',
  },
  KA: {
    key: 'KA',
    label: 'Kereta Api',
    short: 'KA',
    icon: 'TrainFront',
    color: '#d97706',
    colorSoft: 'rgba(217,119,6,.12)',
    desc: 'KA penumpang PT KAI',
  },
  BUS: {
    key: 'BUS',
    label: 'Bus AKAP',
    short: 'Bus',
    icon: 'Bus',
    color: '#16a34a',
    colorSoft: 'rgba(22,163,74,.12)',
    desc: 'Bus antar-kota antar-provinsi',
  },
  ASDP: {
    key: 'ASDP',
    label: 'ASDP Penyeberangan',
    short: 'ASDP',
    icon: 'Ship',
    color: '#9333ea',
    colorSoft: 'rgba(147,51,234,.12)',
    desc: 'Kapal feri penyeberangan',
  },
  LAUT: {
    key: 'LAUT',
    label: 'Transportasi Laut',
    short: 'Laut',
    icon: 'Anchor',
    color: '#0891b2',
    colorSoft: 'rgba(8,145,178,.12)',
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
  return { status: 'stable', label: 'Stabil', color: '#16a34a', bg: 'rgba(22,163,74,.1)' };
}
