import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useDark } from './theme';

export const FONT = "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif";
export const MONO = "'JetBrains Mono', ui-monospace, monospace";

export type ApexChartType =
  | 'line' | 'area' | 'bar' | 'donut' | 'pie'
  | 'radialBar' | 'radar' | 'heatmap' | 'scatter';

/** Format angka ringkas id-ID untuk label sumbu */
export function fmtTick(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  if (abs >= 1_000) return `${Math.round(v / 1_000)} rb`;
  return Math.round(v).toLocaleString('id-ID');
}

function isPlainObject(o: unknown): o is Record<string, unknown> {
  return typeof o === 'object' && o !== null && !Array.isArray(o);
}

/** Deep merge: object digabung, array & nilai lain diganti. */
function deepMerge<T>(base: T, over: unknown): T {
  if (over === undefined) return base;
  if (isPlainObject(base) && isPlainObject(over)) {
    const r: Record<string, unknown> = { ...base };
    for (const [k, v] of Object.entries(over)) {
      r[k] = k in r ? deepMerge(r[k], v) : v;
    }
    return r as T;
  }
  return over as T;
}

function baseOptions(dark: boolean): ApexOptions {
  return {
    chart: {
      fontFamily: FONT,
      foreColor: dark ? '#94a3b8' : '#64748b',
      background: 'transparent',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      zoom: { enabled: true, type: 'x', autoScaleYaxis: true },
      animations: { enabled: true, easing: 'easeinout', speed: 650 },
    },
    theme: { mode: dark ? 'dark' : 'light' },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    grid: {
      borderColor: dark ? '#1e293b' : '#e9eef5',
      strokeDashArray: 0,
      xaxis: { lines: { show: false } },
      padding: { left: 8, right: 12 },
    },
    tooltip: {
      theme: dark ? 'dark' : 'light',
      shared: true,
      intersect: false,
      style: { fontFamily: FONT, fontSize: '12px' },
    },
    legend: {
      fontFamily: FONT,
      fontSize: '12px',
      fontWeight: 600,
      markers: { size: 8, shape: 'circle', strokeWidth: 0 },
      itemMargin: { horizontal: 10 },
    },
    xaxis: {
      labels: { style: { fontFamily: MONO, fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        style: { fontFamily: MONO, fontSize: '11px' },
        formatter: (v: number) => fmtTick(v),
      },
    },
  };
}

interface ChartProps {
  type: ApexChartType;
  series: ApexOptions['series'];
  options?: ApexOptions;
  height?: number | string;
  className?: string;
}

/**
 * Wrapper ApexCharts dengan tema terang/gelap otomatis.
 * Contoh:
 *   <Chart type="area" height={400}
 *     series={[{ name: 'Udara', data: [...] }]}
 *     options={{ chart: { stacked: true }, colors: ['#0284c7'], xaxis: { categories: dates } }} />
 */
export default function Chart({ type, series, options, height = 360, className }: ChartProps) {
  const dark = useDark();
  const merged = useMemo(() => deepMerge(baseOptions(dark), options ?? {}), [dark, options]);

  return (
    <div className={className}>
      <ReactApexChart options={merged} series={series} type={type} height={height} width="100%" />
    </div>
  );
}
