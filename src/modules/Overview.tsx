import { useMemo } from 'react';
import {
  Users, Bus, CalendarDays, Flame, TrendingUp, PieChart as PieIcon,
  Trophy, Table2, BarChart3, Lightbulb,
} from 'lucide-react';
import type { ApexOptions } from 'apexcharts';
import Chart from '../components/Chart';
import { Card, CardHeader, KpiCard } from '../components/ui';
import { useDark } from '../components/theme';
import { data, MODA_KEYS } from '../data';
import { MODA } from '../lib/moda';
import { fmtCompact, fmtInt, fmtPct, fmtDate } from '../lib/format';

const STATUS_COLOR: Record<string, string> = {
  'Sangat Kritis': '#dc2626',
  'Tinggi / Kritis': '#ea580c',
  Kritis: '#ea580c',
  Waspada: '#d97706',
  Terkendali: '#16a34a',
};

export default function Overview() {
  const dark = useDark();
  const meta = data.meta;
  const timeline = data.daily_timeline;
  const monthly = data.monthly_summary;
  const simpul = data.simpul_recommendations;

  const totalByModa = useMemo(() => {
    const t: Record<string, number> = {};
    for (const m of MODA_KEYS) t[m] = timeline.reduce((s, r) => s + (r[m] as number), 0);
    return t;
  }, [timeline]);
  const grandTotal = MODA_KEYS.reduce((s, m) => s + totalByModa[m], 0);
  const topModa = MODA_KEYS.reduce((a, b) => (totalByModa[a] >= totalByModa[b] ? a : b));

  /* ---------- Tren: stacked area 272 hari + garis Total ---------- */
  const areaSeries: ApexOptions['series'] = useMemo(
    () => [
      ...MODA_KEYS.map((m) => ({
        name: MODA[m].label,
        type: 'area' as const,
        data: timeline.map((r) => r[m] as number),
      })),
      { name: 'Total', type: 'line' as const, data: timeline.map((r) => r.TOTAL) },
    ],
    [timeline],
  );

  const areaOptions: ApexOptions = useMemo(() => {
    const dates = timeline.map((r) => r.date);
    const totalColor = dark ? '#f8fafc' : '#0f172a';
    return {
      chart: { stacked: true, toolbar: { show: false }, zoom: { enabled: false } },
      colors: [...MODA_KEYS.map((m) => MODA[m].color), totalColor],
      legend: { position: 'top', horizontalAlign: 'left' },
      stroke: { width: [1.5, 1.5, 1.5, 1.5, 1.5, 2.5] },
      fill: { type: 'solid', opacity: [0.16, 0.16, 0.16, 0.16, 0.16, 0] },
      xaxis: {
        categories: dates,
        tickAmount: 9,
        labels: {
          formatter: (v: string | number) =>
            typeof v === 'string' && v.length >= 10 ? v.slice(5).replace('-', '/') : '',
        },
      },
      tooltip: { y: { formatter: (v: number | string) => `${fmtInt(Number(v))} pnp` } },
      annotations: {
        xaxis: [
          {
            x: '2026-03-13',
            x2: '2026-03-29',
            fillColor: '#d97706',
            opacity: 0.08,
            label: {
              text: 'Lebaran 2026',
              style: { color: '#d97706', fontWeight: 700 },
            },
          },
        ],
      },
    };
  }, [dark, timeline]);

  /* ---------- Donat pangsa moda ---------- */
  const donutSeries: ApexOptions['series'] = useMemo(
    () => MODA_KEYS.map((m) => totalByModa[m]),
    [totalByModa],
  );

  const donutOptions: ApexOptions = useMemo(
    () => ({
      labels: MODA_KEYS.map((m) => MODA[m].label),
      colors: MODA_KEYS.map((m) => MODA[m].color),
      chart: { toolbar: { show: false } },
      legend: { position: 'bottom', fontSize: '11px' },
      stroke: { width: 2, colors: [dark ? '#0f172a' : '#ffffff'] },
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                fontSize: '12px',
                fontWeight: 700,
                color: dark ? '#94a3b8' : '#64748b',
                formatter: () => fmtCompact(grandTotal),
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (v: number) => `${v.toFixed(0)}%`,
        style: { fontSize: '11px', fontWeight: 700 },
      },
      tooltip: { y: { formatter: (v: number) => `${fmtInt(v)} pnp` } },
    }),
    [dark, grandTotal],
  );

  /* ---------- Top 5 simpul ---------- */
  const top5 = useMemo(
    () => [...simpul].sort((a, b) => b.pnpPuncak - a.pnpPuncak).slice(0, 5),
    [simpul],
  );
  const top5Series: ApexOptions['series'] = useMemo(
    () => [{ name: 'Puncak', data: top5.map((s) => s.pnpPuncak) }],
    [top5],
  );
  const top5Options: ApexOptions = useMemo(
    () => ({
      colors: top5.map((s) => MODA[s.moda as keyof typeof MODA]?.color ?? '#1a5287'),
      chart: { toolbar: { show: false } },
      legend: { show: false },
      plotOptions: {
        bar: {
          horizontal: true,
          distributed: true,
          borderRadius: 4,
          barHeight: '55%',
          dataLabels: { position: 'right' },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (v: number | string) => fmtCompact(Number(v)),
        offsetX: 8,
        style: { fontSize: '11px', fontWeight: 700, colors: [dark ? '#cbd5e1' : '#475569'] },
      },
      xaxis: { categories: top5.map((s) => s.name) },
      yaxis: {
        labels: {
          formatter: (v: string | number) =>
            typeof v === 'string' && v.length > 14 ? `${v.slice(0, 13)}…` : String(v),
        },
      },
      grid: { padding: { right: 40 } },
      tooltip: {
        y: {
          formatter: (_v: number | string, opts: any) => {
            const s = top5[opts.dataPointIndex];
            return s ? `${fmtInt(s.pnpPuncak)} pnp • ${s.prov}` : '';
          },
        },
      },
    }),
    [dark, top5],
  );

  /* ---------- Kombo bulanan: penumpang (bar) vs armada (line) ---------- */
  const comboSeries: ApexOptions['series'] = useMemo(
    () => [
      {
        name: 'Penumpang',
        type: 'bar' as const,
        data: monthly.map((r) => Number((r.TOTAL / 1e6).toFixed(1))),
      },
      {
        name: 'Armada',
        type: 'line' as const,
        data: monthly.map((r) => Number(((Number(r.TOTAL_ARMADA ?? 0)) / 1e3).toFixed(1))),
      },
    ],
    [monthly],
  );
  const comboOptions: ApexOptions = useMemo(
    () => ({
      colors: ['#0284c7', '#d97706'],
      chart: { toolbar: { show: false } },
      legend: { position: 'top', horizontalAlign: 'left' },
      stroke: { width: [0, 2.5] },
      plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
      xaxis: { categories: monthly.map((r) => r.label.slice(0, 3)) },
      yaxis: [
        {
          seriesName: 'Penumpang',
          labels: { formatter: (v: number) => `${v} jt` },
        },
        {
          seriesName: 'Armada',
          opposite: true,
          labels: { formatter: (v: number) => `${v} rb` },
        },
      ],
      tooltip: {
        shared: true,
        y: [
          { formatter: (v: number) => `${v} jt pnp` },
          { formatter: (v: number) => `${v} rb trip` },
        ],
      },
    }),
    [monthly],
  );

  /* ---------- Tabel simpul tersibuk ---------- */
  const top8 = useMemo(
    () => [...simpul].sort((a, b) => b.pnpPuncak - a.pnpPuncak).slice(0, 8),
    [simpul],
  );

  /* ---------- Insight cepat ---------- */
  const insights = useMemo(
    () => [
      {
        color: '#dc2626',
        text: `Puncak ${fmtDate(meta.all_time_peak_date)} mencapai ${fmtCompact(meta.all_time_peak_val)} penumpang (+${fmtPct(meta.all_time_peak_surge_pct, 1)} vs hari normal).`,
      },
      {
        color: '#0284c7',
        text: `${MODA[topModa].label} menjadi moda dominan dengan ${fmtPct((totalByModa[topModa] / grandTotal) * 100, 1)} pangsa YTD.`,
      },
      {
        color: '#d97706',
        text: `Arus mudik H-3 (${fmtDate(meta.peak_mudik_date)}) menembus ${fmtCompact(meta.peak_mudik_val)} penumpang (+${fmtPct(meta.peak_mudik_surge_pct, 1)}).`,
      },
      {
        color: '#7c3aed',
        text: `Simpul tersibuk: ${top5[0]?.name ?? '-'} (${fmtInt(top5[0]?.pnpPuncak ?? 0)} pnp saat puncak).`,
      },
      {
        color: '#16a34a',
        text: `${fmtCompact(meta.total_armada_ytd)} trip armada beroperasi selama ${meta.days_count} hari.`,
      },
    ],
    [meta, topModa, totalByModa, grandTotal, top5],
  );

  return (
    <div className="space-y-4">
      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Penumpang"
          value={`${fmtCompact(meta.total_passengers_ytd)}`}
          sub={`${meta.days_count} hari • ${fmtInt(meta.total_clean_rows)} baris terverifikasi`}
          icon={<Users size={20} />}
          accent="#0284c7"
        />
        <KpiCard
          label="Puncak Pergerakan"
          value={fmtCompact(meta.all_time_peak_val)}
          delta={meta.all_time_peak_surge_pct}
          deltaLabel="hari normal"
          sub={fmtDate(meta.all_time_peak_date)}
          icon={<Flame size={20} />}
          accent="#dc2626"
        />
        <KpiCard
          label="Puncak Mudik (H-3)"
          value={fmtCompact(meta.peak_mudik_val)}
          delta={meta.peak_mudik_surge_pct}
          deltaLabel="hari normal"
          sub={meta.peak_mudik_date ? fmtDate(meta.peak_mudik_date) : ''}
          icon={<CalendarDays size={20} />}
          accent="#d97706"
        />
        <KpiCard
          label="Total Armada"
          value={`${fmtCompact(meta.total_armada_ytd)} trip`}
          sub={`${fmtInt(Math.round(meta.total_armada_ytd / meta.days_count))} trip/hari • dua arah`}
          icon={<Bus size={20} />}
          accent="#16a34a"
        />
      </div>

      {/* Baris grafik utama */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="p-4 sm:p-5 xl:col-span-6">
          <CardHeader icon={<TrendingUp size={16} />} title="Tren Penumpang Harian" />
          <Chart type="area" series={areaSeries} options={areaOptions} height={300} />
        </Card>
        <Card className="p-4 sm:p-5 xl:col-span-3">
          <CardHeader icon={<PieIcon size={16} />} title="Pangsa Moda" />
          <Chart type="donut" series={donutSeries} options={donutOptions} height={300} />
        </Card>
        <Card className="p-4 sm:p-5 xl:col-span-3">
          <CardHeader icon={<Trophy size={16} />} title="Top 5 Simpul" />
          <Chart type="bar" series={top5Series} options={top5Options} height={300} />
        </Card>
      </div>

      {/* Baris bawah: tabel + kombo + insight */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="overflow-hidden xl:col-span-5">
          <div className="p-4 pb-2 sm:px-5 sm:pt-5">
            <CardHeader icon={<Table2 size={16} />} title="Simpul Tersibuk" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                  <th className="px-4 py-2.5 font-bold sm:px-5">Simpul</th>
                  <th className="px-3 py-2.5 font-bold">Moda</th>
                  <th className="px-3 py-2.5 text-right font-bold">Puncak</th>
                  <th className="px-4 py-2.5 text-right font-bold sm:pr-5">Status</th>
                </tr>
              </thead>
              <tbody>
                {top8.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-2.5 sm:px-5">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{s.name}</p>
                      <p className="text-[11px] text-slate-400">{s.prov}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="num rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {s.moda}
                      </span>
                    </td>
                    <td className="num px-3 py-2.5 text-right font-bold text-slate-700 dark:text-slate-200">
                      {fmtCompact(s.pnpPuncak)}
                    </td>
                    <td className="px-4 py-2.5 text-right sm:pr-5">
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                        style={{
                          background: `${STATUS_COLOR[s.statusText] ?? '#64748b'}1a`,
                          color: STATUS_COLOR[s.statusText] ?? '#64748b',
                        }}
                      >
                        {s.statusText}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 xl:col-span-4">
          <CardHeader icon={<BarChart3 size={16} />} title="Penumpang vs Armada Bulanan" />
          <Chart type="bar" series={comboSeries} options={comboOptions} height={300} />
        </Card>

        <Card className="p-4 sm:p-5 xl:col-span-3">
          <CardHeader icon={<Lightbulb size={16} />} title="Insight Cepat" />
          <ul className="space-y-3.5">
            {insights.map((ins, i) => (
              <li key={i} className="flex gap-2.5">
                <span
                  className="mt-1.5 size-2 shrink-0 rounded-full"
                  style={{ background: ins.color }}
                />
                <p className="text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {ins.text}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
