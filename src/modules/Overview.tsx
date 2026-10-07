import { useMemo } from 'react';
import {
  Users, Bus, CalendarDays, Flame, Plane, TrainFront, Ship, Anchor,
} from 'lucide-react';
import type { ApexOptions } from 'apexcharts';
import Chart from '../components/Chart';
import { Card, SectionHeader, KpiCard, Badge } from '../components/ui';
import { useDark } from '../components/theme';
import { data, MODA_KEYS } from '../data';
import { MODA } from '../lib/moda';
import { fmtCompact, fmtInt, fmtPct, fmtDate } from '../lib/format';

const MODA_ICONS = {
  UDARA: <Plane size={18} />,
  KA: <TrainFront size={18} />,
  BUS: <Bus size={18} />,
  ASDP: <Ship size={18} />,
  LAUT: <Anchor size={18} />,
};

export default function Overview() {
  const dark = useDark();
  const meta = data.meta;
  const timeline = data.daily_timeline;
  const monthly = data.monthly_summary;

  const totalByModa = useMemo(() => {
    const t: Record<string, number> = {};
    for (const m of MODA_KEYS) t[m] = timeline.reduce((s, r) => s + (r[m] as number), 0);
    return t;
  }, [timeline]);

  const grandTotal = MODA_KEYS.reduce((s, m) => s + totalByModa[m], 0);

  // Stacked area per moda + garis Total (type 'line' tidak ikut stacking di ApexCharts)
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
      chart: { stacked: true },
      colors: [...MODA_KEYS.map((m) => MODA[m].color), totalColor],
      legend: { position: 'top' },
      stroke: { width: [1.5, 1.5, 1.5, 1.5, 1.5, 2.5] },
      fill: { type: 'solid', opacity: [0.16, 0.16, 0.16, 0.16, 0.16, 0] },
      xaxis: {
        categories: dates,
        tickAmount: 9,
        labels: { formatter: (v: string) => v.slice(5).replace('-', '/') },
      },
      tooltip: { y: { formatter: (v: number) => fmtInt(v) } },
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
          {
            x: meta.all_time_peak_date,
            borderColor: '#dc2626',
            strokeDashArray: 4,
            label: {
              text: 'Puncak',
              style: { color: '#dc2626', fontWeight: 700 },
            },
          },
        ],
      },
    };
  }, [dark, timeline, meta]);

  const donutSeries: ApexOptions['series'] = useMemo(
    () => MODA_KEYS.map((m) => totalByModa[m]),
    [totalByModa],
  );

  const donutOptions: ApexOptions = useMemo(
    () => ({
      labels: MODA_KEYS.map((m) => MODA[m].label),
      colors: MODA_KEYS.map((m) => MODA[m].color),
      legend: { position: 'bottom' },
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                formatter: () => fmtCompact(grandTotal),
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (v: number) => `${v.toFixed(1)}%`,
      },
      tooltip: { y: { formatter: (v: number) => `${fmtInt(v)} pnp` } },
    }),
    [grandTotal],
  );

  const spark = (m: (typeof MODA_KEYS)[number]) =>
    timeline.filter((_, i) => i % 4 === 0).map((r) => r[m] as number);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-kemenhub-800 via-kemenhub-900 to-slate-950 p-5 text-white sm:p-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 85% 20%, rgba(56,189,248,.25), transparent 45%), radial-gradient(circle at 10% 90%, rgba(147,51,234,.2), transparent 40%)',
          }}
        />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <Badge color="#38bdf8" className="bg-white/10 !text-sky-200">🇮🇩 Mobilitas Nasional 2026</Badge>
            <Badge color="#a7f3d0" className="bg-white/10 !text-emerald-200">{meta.days_count} hari • {fmtInt(meta.total_clean_rows)} baris terverifikasi</Badge>
          </div>
          <h1 className="mt-3 max-w-3xl text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
            Dasbor Terpadu Pergerakan Penumpang Lintas 5 Moda Transportasi
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
            Udara, Kereta Api, Bus AKAP, ASDP Penyeberangan & Transportasi Laut — {fmtDate(meta.date_min)} hingga {fmtDate(meta.date_max)}, berbasis data operasional StrategiHub PUSDATIN Kemenhub.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
            <div>
              <p className="num text-2xl font-bold sm:text-3xl">{fmtCompact(meta.total_passengers_ytd)}</p>
              <p className="text-[11.5px] text-slate-400">penumpang YTD</p>
            </div>
            <div>
              <p className="num text-2xl font-bold sm:text-3xl">{fmtCompact(meta.total_armada_ytd)}</p>
              <p className="text-[11.5px] text-slate-400">trip armada YTD</p>
            </div>
            <div>
              <p className="num text-2xl font-bold text-amber-300 sm:text-3xl">{fmtPct(meta.all_time_peak_surge_pct, 1)}</p>
              <p className="text-[11.5px] text-slate-400">lonjakan puncak vs normal</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Rata-rata Harian"
          value={`${fmtCompact(meta.total_passengers_ytd / meta.days_count)} pnp`}
          sub="per hari • dua arah"
          icon={<Users size={18} />}
          accent="#0284c7"
        />
        <KpiCard
          label="Puncak Pergerakan"
          value={fmtCompact(meta.all_time_peak_val)}
          delta={meta.all_time_peak_surge_pct}
          deltaLabel={`vs hari normal • ${fmtDate(meta.all_time_peak_date)}`}
          icon={<Flame size={18} />}
          accent="#dc2626"
        />
        <KpiCard
          label="Puncak Mudik Lebaran"
          value={fmtCompact(meta.peak_mudik_val)}
          delta={meta.peak_mudik_surge_pct}
          deltaLabel={`${meta.peak_mudik_date ? fmtDate(meta.peak_mudik_date) : ''} • H-3`}
          icon={<CalendarDays size={18} />}
          accent="#d97706"
        />
        <KpiCard
          label="Armada Harian Rata-rata"
          value={`${fmtCompact(meta.total_armada_ytd / meta.days_count)} trip`}
          sub="datang + berangkat"
          icon={<Bus size={18} />}
          accent="#16a34a"
        />
      </div>

      {/* Main chart */}
      <Card className="p-4 sm:p-5">
        <SectionHeader
          eyebrow="Kronologi"
          title="Arus Harian Penumpang per Moda"
          desc="Area bertumpuk 272 hari — seret untuk zoom, arahkan kursor untuk detail. Zona kuning menandai periode Lebaran 2026."
        />
        <Chart type="area" series={areaSeries} options={areaOptions} height={360} />
      </Card>

      {/* Share + moda cards */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="p-5 sm:p-6 xl:col-span-2">
          <SectionHeader eyebrow="Komposisi" title="Pangsa Pasar Moda" desc="Akumulasi Jan–Sep 2026" />
          <Chart type="donut" series={donutSeries} options={donutOptions} height={240} />
        </Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-3 xl:grid-cols-3">
          {MODA_KEYS.map((m) => {
            const share = (totalByModa[m] / grandTotal) * 100;
            const sp = spark(m);
            return (
              <Card key={m} className="flex flex-col p-5">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl" style={{ background: MODA[m].colorSoft, color: MODA[m].color }}>
                    {MODA_ICONS[m]}
                  </span>
                  <span className="num text-lg font-extrabold" style={{ color: MODA[m].color }}>
                    {share.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%
                  </span>
                </div>
                <p className="mt-3 text-[13.5px] font-bold text-slate-800 dark:text-slate-100">{MODA[m].label}</p>
                <p className="num text-[12px] text-slate-500 dark:text-slate-400">{fmtCompact(totalByModa[m])} pnp</p>
                <div className="mt-auto pt-3">
                  <svg viewBox={`0 0 ${sp.length} 36`} className="h-9 w-full" preserveAspectRatio="none">
                    <polyline
                      points={sp.map((v, i) => `${i},${36 - (v / Math.max(...sp)) * 32}`).join(' ')}
                      fill="none"
                      stroke={MODA[m].color}
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>
              </Card>
            );
          })}
          <Card className="flex flex-col justify-center bg-gradient-to-br from-kemenhub-700 to-kemenhub-900 p-5 text-white dark:from-kemenhub-800 dark:to-slate-900">
            <p className="text-[13px] font-bold">Rata-rata bulanan</p>
            <p className="num mt-1 text-2xl font-extrabold">{fmtCompact(grandTotal / monthly.length)}</p>
            <p className="mt-1 text-[11.5px] text-white/70">penumpang per bulan • 9 bulan berjalan</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
