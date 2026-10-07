import { useMemo, useState } from 'react';
import {
  Users, TrendingUp, Bus, Star, CalendarDays, Flame,
  Cpu, Database, CalendarClock, Timer, SlidersHorizontal, Activity, Info,
} from 'lucide-react';
import type { ApexOptions } from 'apexcharts';
import Chart, { FONT, MONO } from '../components/Chart';
import { Card, SectionHeader, KpiCard, Badge, Segmented } from '../components/ui';
import { useDark } from '../components/theme';
import { data, MODA_KEYS } from '../data';
import { MODA } from '../lib/moda';
import { fmtCompact, fmtInt, fmtPct, fmtDate } from '../lib/format';
import type { ForecastPoint } from '../data/types';

type ScenarioKey = 'moderat' | 'optimis' | 'konservatif';

const SCENARIOS: { key: ScenarioKey; label: string; color: string; desc: string }[] = [
  {
    key: 'moderat', label: 'Moderat', color: '#1a5287',
    desc: 'Skenario basis (faktor 1,00) — proyeksi mengikuti pola historis model Holt-Winters tanpa asumsi kebijakan tambahan.',
  },
  {
    key: 'optimis', label: 'Optimis', color: '#16a34a',
    desc: 'Faktor 1,07 — animo masyarakat tinggi, stimulus pariwisata, dan penambahan kapasitas armada selama Nataru.',
  },
  {
    key: 'konservatif', label: 'Konservatif', color: '#dc2626',
    desc: 'Faktor 0,95 — animo melemah atau adanya pembatasan operasional pada periode Natal dan Tahun Baru.',
  },
];

interface ScenPoint {
  date: string;
  TOTAL: number;
  ci_lower: number;
  ci_upper: number;
  pnp_2025: number;
  yoy_pct: number;
}

function asArray(s: ForecastPoint[] | { daily?: ForecastPoint[] } | undefined): ForecastPoint[] {
  if (!s) return [];
  return Array.isArray(s) ? s : (s.daily ?? []);
}

interface ModeBreakdown {
  passengers_2026: number;
  yoy_pct: number;
  share_pct_2026: number;
}

const fmtDay = (v: string | number) =>
  typeof v === 'string' ? v.slice(5).replace('-', '/') : String(v);

export default function ForecastView() {
  const dark = useDark();
  const [scen, setScen] = useState<ScenarioKey>('moderat');
  const fn = data.forecast_nataru;
  const meta = fn.meta;

  const summary = fn.summaries[scen];
  const pts: ScenPoint[] = useMemo(
    () =>
      asArray(fn.scenarios[scen]).map((d) => ({
        date: String(d.date),
        TOTAL: Number(d.TOTAL),
        ci_lower: Number(d.ci_lower),
        ci_upper: Number(d.ci_upper),
        pnp_2025: Number(d.pnp_2025),
        yoy_pct: Number(d.yoy_pct),
      })),
    [fn.scenarios, scen],
  );

  const peak = useMemo(
    () => pts.reduce((a, b) => (b.TOTAL > a.TOTAL ? b : a), pts[0] ?? { date: '', TOTAL: 0 } as ScenPoint),
    [pts],
  );

  const breakdown = (
    summary as unknown as { mode_breakdown?: Record<string, ModeBreakdown> }
  ).mode_breakdown;
  const scenarioFactors = (
    meta as unknown as { scenario_factors?: Record<string, number> }
  ).scenario_factors;
  const ciMethod = (meta as unknown as { ci_method?: string }).ci_method;
  const scenarioNote = (meta as unknown as { scenario_note?: string }).scenario_note;
  const params = meta.parameters ?? {};

  /* ---------- Grafik utama: proyeksi + CI + benchmark ---------- */
  const mainSeries = useMemo<ApexOptions['series']>(
    () => [
      { name: 'Proyeksi 2026/2027', type: 'line', data: pts.map((p) => p.TOTAL) },
      {
        name: 'Interval 95%',
        type: 'rangeArea',
        data: pts.map((p) => ({ x: p.date, y: [p.ci_lower, p.ci_upper] })),
      },
      { name: 'Aktual 2025', type: 'line', data: pts.map((p) => p.pnp_2025) },
    ],
    [pts],
  );

  const mainOptions = useMemo<ApexOptions>(() => {
    const zoneFill = dark ? 0.1 : 0.07;
    return {
      colors: ['#1a5287', '#94a3b8', '#94a3b8'],
      stroke: { width: [2.5, 0, 2], dashArray: [0, 0, 6], curve: 'smooth' },
      fill: { opacity: [1, 0.22, 1], type: ['solid', 'solid', 'solid'] },
      markers: { size: [0, 0, 0] },
      xaxis: {
        categories: pts.map((p) => p.date),
        tickAmount: 10,
        labels: { formatter: fmtDay },
      },
      tooltip: {
        shared: true,
        x: {
          formatter: (v: string | number) => (typeof v === 'string' ? fmtDate(v) : String(v)),
        },
        y: [
          { formatter: (v: number) => `${fmtInt(v)} pnp` },
          {
            formatter: (v: number | number[]) =>
              Array.isArray(v) ? `CI: ${fmtInt(v[0])} – ${fmtInt(v[1])}` : fmtInt(v),
          },
          { formatter: (v: number) => `${fmtInt(v)} pnp` },
        ],
      },
      annotations: {
        xaxis: [
          {
            x: '2026-12-24',
            x2: '2026-12-26',
            fillColor: '#dc2626',
            opacity: zoneFill,
            label: {
              text: 'Natal',
              style: { color: '#dc2626', fontFamily: FONT, fontSize: '11px', fontWeight: 700 },
            },
          },
          {
            x: '2026-12-31',
            x2: '2027-01-01',
            fillColor: '#dc2626',
            opacity: zoneFill,
            label: {
              text: 'Tahun Baru',
              style: { color: '#dc2626', fontFamily: FONT, fontSize: '11px', fontWeight: 700 },
            },
          },
        ],
        points: [
          {
            x: peak.date,
            y: peak.TOTAL,
            marker: { size: 5, fillColor: '#dc2626', strokeColor: '#fff', strokeWidth: 2 },
            label: {
              text: fmtCompact(peak.TOTAL),
              borderColor: '#dc2626',
              style: {
                color: '#fff',
                background: '#dc2626',
                fontFamily: MONO,
                fontSize: '10px',
                fontWeight: 700,
              },
            },
          },
        ],
      },
    };
  }, [dark, pts, peak]);

  /* ---------- Grafik YoY harian ---------- */
  const yoySeries = useMemo<ApexOptions['series']>(
    () => [{ name: 'YoY harian', data: pts.map((p) => Number(p.yoy_pct.toFixed(1))) }],
    [pts],
  );

  const yoyOptions = useMemo<ApexOptions>(
    () => ({
      colors: pts.map((p) => (p.yoy_pct >= 0 ? '#16a34a' : '#dc2626')),
      plotOptions: { bar: { distributed: true, borderRadius: 3 } },
      xaxis: {
        categories: pts.map((p) => p.date),
        tickAmount: 14,
        labels: { formatter: fmtDay },
      },
      yaxis: {
        labels: { formatter: (v: number) => `${v.toLocaleString('id-ID')}%` },
      },
      tooltip: {
        x: {
          formatter: (v: string | number) => (typeof v === 'string' ? fmtDate(v) : String(v)),
        },
        y: { formatter: (v: number) => fmtPct(v) },
      },
      annotations: {
        yaxis: [{ y: 0, borderColor: '#94a3b8', strokeDashArray: 4 }],
      },
    }),
    [pts],
  );

  const activeScen = SCENARIOS.find((s) => s.key === scen)!;

  const methodRows = [
    { icon: <Cpu size={16} />, label: 'Model', value: meta.model },
    { icon: <Database size={16} />, label: 'Dataset latih', value: meta.training_dataset },
    {
      icon: <CalendarClock size={16} />,
      label: 'Periode latih',
      value: `${fmtDate(meta.train_start)} \u2013 ${fmtDate(meta.train_end)} (${fmtInt(meta.train_days)} hari)`,
    },
    {
      icon: <Timer size={16} />,
      label: 'Horizon proyeksi',
      value: `${fmtInt(meta.horizon_days)} hari \u2013 ${fmtDate(meta.forecast_start)} s.d. ${fmtDate(meta.forecast_end)}`,
    },
    {
      icon: <SlidersHorizontal size={16} />,
      label: 'Faktor skenario',
      value: scenarioFactors
        ? `Moderat ${scenarioFactors.moderat?.toLocaleString('id-ID')} \u2022 Optimis ${scenarioFactors.optimis?.toLocaleString('id-ID')} \u2022 Konservatif ${scenarioFactors.konservatif?.toLocaleString('id-ID')}`
        : 'Moderat 1,00 \u2022 Optimis 1,07 \u2022 Konservatif 0,95',
    },
    { icon: <Activity size={16} />, label: 'Interval kepercayaan', value: ciMethod ?? 'Aproksimasi 95% berbasis RMSE' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-kemenhub-800 via-kemenhub-900 to-slate-950 p-6 text-white sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 85% 20%, rgba(56,189,248,.25), transparent 45%), radial-gradient(circle at 10% 90%, rgba(217,119,6,.22), transparent 40%)',
          }}
        />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <Badge color="#38bdf8" className="bg-white/10 !text-sky-200">
              Proyeksi 100 hari &bull; {fmtDate(meta.forecast_start)} &ndash; {fmtDate(meta.forecast_end)}
            </Badge>
            <Badge color="#a7f3d0" className="bg-white/10 !text-emerald-200">
              3 skenario &bull; {fmtInt(meta.train_days)} hari data latih
            </Badge>
          </div>
          <h1 className="mt-3 max-w-3xl text-2xl font-extrabold leading-tight tracking-tight sm:text-[34px] sm:leading-[1.15]">
            Proyeksi Nataru 2026/2027
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
            Perkiraan pergerakan penumpang lintas lima moda pada periode Natal dan Tahun Baru,
            dibandingkan terhadap realisasi periode yang sama tahun 2025 sebagai benchmark.
          </p>
        </div>
      </div>

      {/* Selector skenario */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-kemenhub-600 dark:text-kemenhub-300">
              Skenario
            </p>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Pilih skenario proyeksi
            </h2>
          </div>
          <Segmented<ScenarioKey>
            options={SCENARIOS.map((s) => ({ value: s.key, label: s.label, color: s.color }))}
            value={scen}
            onChange={setScen}
          />
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          <span className="font-bold" style={{ color: activeScen.color }}>
            {activeScen.label}:
          </span>{' '}
          {activeScen.desc}
        </p>
      </Card>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Total Penumpang (100 hari)"
          value={`${fmtCompact(summary.total_passengers)} pnp`}
          delta={summary.yoy_total_pct}
          deltaLabel="YoY vs periode sama 2025"
          icon={<Users size={18} />}
          accent="#1a5287"
        />
        <KpiCard
          label="Rata-rata Harian"
          value={`${fmtCompact(summary.avg_daily_passengers)} pnp`}
          delta={summary.yoy_avg_pct}
          deltaLabel="YoY vs 2025"
          icon={<TrendingUp size={18} />}
          accent="#0284c7"
        />
        <KpiCard
          label="Total Armada (100 hari)"
          value={`${fmtCompact(summary.total_armada)} trip`}
          delta={summary.yoy_armada_pct}
          deltaLabel="YoY vs periode sama 2025"
          icon={<Bus size={18} />}
          accent="#16a34a"
        />
        <KpiCard
          label="Puncak Natal"
          value={fmtCompact(summary.xmas_peak_val)}
          delta={summary.xmas_peak_yoy}
          deltaLabel={`${fmtDate(summary.xmas_peak_date)} \u2022 Natal`}
          icon={<Star size={18} />}
          accent="#d97706"
        />
        <KpiCard
          label="Puncak Tahun Baru"
          value={fmtCompact(summary.ny_peak_val)}
          delta={summary.ny_peak_yoy}
          deltaLabel={`${fmtDate(summary.ny_peak_date)} \u2022 Tahun Baru`}
          icon={<CalendarDays size={18} />}
          accent="#9333ea"
        />
        <KpiCard
          label="Puncak Absolut Proyeksi"
          value={fmtCompact(summary.all_time_peak_val)}
          delta={summary.all_time_peak_yoy}
          deltaLabel={`${fmtDate(summary.all_time_peak_date)} \u2022 YoY vs 2025`}
          icon={<Flame size={18} />}
          accent="#dc2626"
        />
      </div>

      {/* Grafik utama */}
      <Card className="p-5 sm:p-6">
        <SectionHeader
          eyebrow="Proyeksi harian"
          title={`Arus Penumpang Harian \u2014 Skenario ${activeScen.label}`}
          desc="Garis biru proyeksi 2026/2027 dengan pita interval kepercayaan 95%, garis abu-abu putus-putus realisasi 2025, zona merah periode Natal & Tahun Baru."
        />
        <Chart type="line" series={mainSeries} options={mainOptions} height={440} />
      </Card>

      {/* Grafik YoY */}
      <Card className="p-5 sm:p-6">
        <SectionHeader
          eyebrow="Perbandingan tahunan"
          title="Pertumbuhan YoY Harian vs 2025"
          desc="Batang hijau di atas rata-rata 2025, merah di bawahnya \u2014 skenario aktif."
        />
        <Chart type="bar" series={yoySeries} options={yoyOptions} height={300} />
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Metodologi */}
        <Card className="p-5 sm:p-6 xl:col-span-2">
          <SectionHeader
            eyebrow="Transparansi"
            title="Metodologi Proyeksi"
            desc="Parameter model dan asumsi yang dipakai dalam penyusunan proyeksi ini."
          />
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            {methodRows.map((r) => (
              <div key={r.label} className="flex gap-3 py-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-kemenhub-600/10 text-kemenhub-700 dark:text-kemenhub-300">
                  {r.icon}
                </span>
                <div className="min-w-0">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    {r.label}
                  </dt>
                  <dd className="mt-0.5 text-[13px] font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                    {r.value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
          {Object.keys(params).length > 0 && (
            <div className="mt-2">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Parameter Holt-Winters
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(params).map(([k, v]) => (
                  <span
                    key={k}
                    className="num rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {k}: {String(v)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {scenarioNote && (
            <p className="mt-4 flex gap-2 rounded-xl bg-amber-500/10 p-3.5 text-[12.5px] leading-relaxed text-amber-800 dark:text-amber-200">
              <Info size={15} className="mt-0.5 shrink-0" />
              {scenarioNote}
            </p>
          )}
        </Card>

        {/* Breakdown moda */}
        <Card className="p-5 sm:p-6">
          <SectionHeader
            eyebrow="Komposisi"
            title="Kontribusi per Moda"
            desc={`Skenario ${activeScen.label} \u2014 total 100 hari`}
          />
          {breakdown ? (
            <div className="space-y-3">
              {MODA_KEYS.map((m) => {
                const b = breakdown[m];
                if (!b) return null;
                const pos = b.yoy_pct >= 0;
                return (
                  <div
                    key={m}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                  >
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ background: MODA[m].color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-slate-800 dark:text-slate-100">
                        {MODA[m].label}
                      </p>
                      <p className="num text-[11.5px] text-slate-400">
                        {fmtCompact(b.passengers_2026)} pnp \u2022{' '}
                        {b.share_pct_2026.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%
                      </p>
                    </div>
                    <span
                      className={`num rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        pos
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {fmtPct(b.yoy_pct)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Data rincian moda tidak tersedia.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
