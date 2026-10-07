import { useMemo, useState } from 'react';
import { CalendarDays, MapPin, TrendingUp } from 'lucide-react';
import Chart, { FONT, MONO } from '../components/Chart';
import { Card, SectionHeader, Segmented, Badge } from '../components/ui';
import { useDark } from '../components/theme';
import { data, MODA_KEYS } from '../data';
import { MODA } from '../lib/moda';
import { fmtCompact, fmtInt, fmtPct } from '../lib/format';
import type { ApexOptions } from 'apexcharts';
import type { ModaKey, DailyRow } from '../data/types';

type Metric = 'pnp' | 'arm';
type Direction = 'total' | 'dat' | 'brg';

const MONTH_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

interface ProvMonth {
  m: number;
  name: string;
  short: string;
  tot: number;
  brg: number;
  dat: number;
}

interface ProvEntry {
  provinsi: string;
  total_brg: number;
  peak_month: string;
  peak_vol: number;
  max_jump_pct: number;
  insight: string;
  monthly: ProvMonth[];
}

/** Ambil nilai sel sesuai metrik + arah yang dipilih */
function valOf(metric: Metric, dir: Direction, r: DailyRow, m: ModaKey | 'TOTAL'): number {
  const k =
    metric === 'pnp'
      ? dir === 'total'
        ? m
        : `${dir === 'dat' ? 'pdat' : 'pbrg'}_${m}`
      : dir === 'total'
        ? `arm_${m}`
        : `${dir === 'dat' ? 'adat' : 'abrg'}_${m}`;
  return (r[k] as number) ?? 0;
}

const DIR_LABEL: Record<Direction, string> = { total: 'Total', dat: 'Datang', brg: 'Berangkat' };

export default function TimelineView() {
  const dark = useDark();
  const timeline = data.daily_timeline;
  const dowRows = data.dow_summary;
  const [metric, setMetric] = useState<Metric>('pnp');
  const [dir, setDir] = useState<Direction>('total');
  const [active, setActive] = useState<ModaKey[]>([...MODA_KEYS]);
  const [prov, setProv] = useState<string>(data.province_monthly_data.provinces[0] ?? '');

  const byProv = data.province_monthly_data.by_province as unknown as Record<string, ProvEntry>;
  const provEntry = byProv[prov];

  const toggleModa = (m: ModaKey) =>
    setActive((a) => (a.includes(m) ? a.filter((x) => x !== m) : [...a, m]));

  const shownModas = active.length > 0 ? active : [...MODA_KEYS];
  const unitShort = metric === 'pnp' ? 'pnp' : 'trip';

  /* ---------- Grafik utama: line multi-moda 272 hari ---------- */
  const mainSeries = useMemo<ApexOptions['series']>(
    () => [
      ...shownModas.map((m) => ({
        name: MODA[m].label,
        data: timeline.map((r) => valOf(metric, dir, r, m)),
      })),
      { name: 'Total', data: timeline.map((r) => valOf(metric, dir, r, 'TOTAL')) },
    ],
    [timeline, metric, dir, shownModas],
  );

  const mainOptions = useMemo<ApexOptions>(() => {
    const dates = timeline.map((r) => r.date);
    const totals = timeline.map((r) => valOf(metric, dir, r, 'TOTAL'));
    let peakIdx = 0;
    totals.forEach((v, i) => {
      if (v > totals[peakIdx]) peakIdx = i;
    });
    return {
      colors: [...shownModas.map((m) => MODA[m].color), dark ? '#f8fafc' : '#0f172a'],
      legend: { position: 'top', horizontalAlign: 'left' },
      xaxis: {
        categories: dates,
        tickAmount: 12,
        labels: {
          hideOverlappingLabels: true,
          formatter: (v: string) => v.slice(5).replace('-', '/'),
        },
      },
      tooltip: { y: { formatter: (v: number | string) => `${fmtInt(Number(v))} ${unitShort}` } },
      annotations: {
        xaxis: [
          {
            x: '2026-03-13',
            x2: '2026-03-29',
            fillColor: '#d97706',
            opacity: dark ? 0.12 : 0.08,
            label: {
              text: 'Lebaran 2026',
              style: { color: '#d97706', fontSize: '11px', fontWeight: 700, fontFamily: FONT },
            },
          },
          {
            x: dates[peakIdx],
            borderColor: '#dc2626',
            strokeDashArray: 4,
            label: {
              text: `Puncak ${fmtCompact(totals[peakIdx])}`,
              style: { color: '#dc2626', fontSize: '11px', fontWeight: 700, fontFamily: FONT },
            },
          },
        ],
      },
    };
  }, [dark, timeline, metric, dir, shownModas, unitShort]);

  /* ---------- Agregasi bulanan (dari harian, ikut metrik+arah) ---------- */
  const monthAgg = useMemo(() => {
    const map = new Map<string, { key: string; label: string; vals: Record<string, number> }>();
    for (const r of timeline) {
      const key = r.date.slice(0, 7);
      let e = map.get(key);
      if (!e) {
        const mo = Number(key.split('-')[1]);
        e = { key, label: MONTH_ID[mo - 1] ?? key, vals: {} };
        map.set(key, e);
      }
      for (const m of MODA_KEYS) e.vals[m] = (e.vals[m] ?? 0) + valOf(metric, dir, r, m);
    }
    return [...map.values()];
  }, [timeline, metric, dir]);

  const monthlySeries = useMemo<ApexOptions['series']>(
    () => shownModas.map((m) => ({ name: MODA[m].short, data: monthAgg.map((e) => e.vals[m] ?? 0) })),
    [monthAgg, shownModas],
  );

  const monthlyOptions = useMemo<ApexOptions>(
    () => ({
      chart: { stacked: true },
      colors: shownModas.map((m) => MODA[m].color),
      legend: { position: 'top', horizontalAlign: 'left' },
      plotOptions: { bar: { borderRadius: 3, columnWidth: '62%' } },
      xaxis: { categories: monthAgg.map((e) => e.label.slice(0, 3)) },
      tooltip: { y: { formatter: (v: number | string) => `${fmtInt(Number(v))} ${unitShort}` } },
    }),
    [monthAgg, shownModas, unitShort],
  );

  /* ---------- Pola hari dalam minggu ---------- */
  const dowSeries = useMemo<ApexOptions['series']>(
    () => [{ name: 'Rata-rata harian', data: dowRows.map((r) => valOf(metric, dir, r, 'TOTAL')) }],
    [dowRows, metric, dir],
  );

  const dowOptions = useMemo<ApexOptions>(
    () => ({
      colors: dowRows.map((_, i) => (i >= 5 ? '#dc2626' : dark ? '#38bdf8' : '#1a5287')),
      plotOptions: { bar: { distributed: true, borderRadius: 7, columnWidth: '55%' } },
      dataLabels: {
        enabled: true,
        formatter: (v: number | string) => fmtCompact(Number(v)),
        offsetY: -8,
        style: { fontFamily: MONO, fontSize: '10px', colors: [dark ? '#cbd5e1' : '#475569'] },
      },
      legend: { show: false },
      xaxis: { categories: dowRows.map((r) => r.dow as string) },
      yaxis: { labels: { formatter: (v: number | string) => `${Math.round(Number(v) / 1e3)} rb` } },
      tooltip: {
        custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
          const r: DailyRow = dowRows[dataPointIndex];
          const rows = MODA_KEYS.map(
            (m) =>
              `<div style="display:flex;justify-content:space-between;gap:16px"><span><span style="display:inline-block;width:8px;height:8px;border-radius:99px;background:${MODA[m].color};margin-right:6px"></span>${MODA[m].short}</span><b style="font-family:${MONO}">${fmtInt(valOf(metric, dir, r, m))}</b></div>`,
          ).join('');
          return `<div style="font-family:${FONT};padding:4px 2px"><b>${r.dow}</b> <span style="color:#94a3b8">• rata-rata harian</span><div style="margin-top:6px">${rows}</div><div style="margin-top:6px;display:flex;justify-content:space-between"><span>Total</span><b style="font-family:${MONO}">${fmtInt(valOf(metric, dir, r, 'TOTAL'))} ${unitShort}</b></div></div>`;
        },
      },
    }),
    [dark, dowRows, metric, dir, unitShort],
  );

  /* ---------- Mini bar provinsi ---------- */
  const provData = useMemo(() => {
    if (!provEntry) return null;
    let peakIdx = 0;
    provEntry.monthly.forEach((e, i) => {
      if (e.tot > provEntry.monthly[peakIdx].tot) peakIdx = i;
    });
    return {
      peakIdx,
      values: provEntry.monthly.map((e) => e.tot),
      cats: provEntry.monthly.map((e) => e.short),
    };
  }, [provEntry]);

  const provSeries: ApexOptions['series'] = provData
    ? [{ name: 'Penumpang', data: provData.values }]
    : [];

  const provOptions = useMemo<ApexOptions | null>(() => {
    if (!provData) return null;
    return {
      colors: provData.cats.map((_, i) => (i === provData.peakIdx ? '#d97706' : dark ? '#38bdf8' : '#1a5287')),
      plotOptions: { bar: { distributed: true, borderRadius: 5, columnWidth: '55%' } },
      legend: { show: false },
      xaxis: { categories: provData.cats },
      tooltip: { y: { formatter: (v: number | string) => `${fmtInt(Number(v))} pnp` } },
    };
  }, [dark, provData]);

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Kronologi"
        title="Kronologi Harian"
        desc={`${DIR_LABEL[dir]} ${metric === 'pnp' ? 'penumpang' : 'armada'} harian, 1 Januari – 28 September 2026 (${timeline.length} hari). Zona kuning menandai periode Lebaran.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              size="sm"
              options={[
                { value: 'pnp' as Metric, label: 'Penumpang' },
                { value: 'arm' as Metric, label: 'Armada' },
              ]}
              value={metric}
              onChange={setMetric}
            />
            <Segmented
              size="sm"
              options={[
                { value: 'total' as Direction, label: 'Total' },
                { value: 'dat' as Direction, label: 'Datang' },
                { value: 'brg' as Direction, label: 'Berangkat' },
              ]}
              value={dir}
              onChange={setDir}
            />
          </div>
        }
      />

      {/* Toggle moda */}
      <div className="flex flex-wrap gap-2">
        {MODA_KEYS.map((m) => {
          const on = active.includes(m);
          return (
            <button
              key={m}
              onClick={() => toggleModa(m)}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${
                on
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-400 hover:text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500'
              }`}
              style={on ? { background: MODA[m].color } : undefined}
            >
              <span
                className="size-2 rounded-full"
                style={{ background: on ? '#fff' : MODA[m].color }}
              />
              {MODA[m].label}
            </button>
          );
        })}
      </div>

      {/* Grafik utama */}
      <Card className="p-4 sm:p-5">
        <SectionHeader
          eyebrow="Tren Harian"
          title={`${DIR_LABEL[dir]} ${metric === 'pnp' ? 'Penumpang' : 'Armada'} per Moda`}
          desc="Seret untuk zoom, arahkan kursor untuk detail harian."
        />
        <Chart type="line" series={mainSeries} options={mainOptions} height={360} />
      </Card>

      {/* Agregasi bulanan + pola mingguan */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <SectionHeader
            eyebrow="Agregasi"
            title="Total Bulanan per Moda"
            desc={`${DIR_LABEL[dir].toLowerCase()} ${metric === 'pnp' ? 'penumpang' : 'armada'} — Januari hingga September 2026`}
          />
          <Chart type="bar" series={monthlySeries} options={monthlyOptions} height={280} />
        </Card>
        <Card className="p-4 sm:p-5">
          <SectionHeader
            eyebrow="Musiman"
            title="Pola Hari dalam Minggu"
            desc="Rata-rata harian per hari — batang merah menandai akhir pekan."
          />
          <Chart type="bar" series={dowSeries} options={dowOptions} height={280} />
        </Card>
      </div>

      {/* Sorotan provinsi */}
      <Card className="p-4 sm:p-5">
        <SectionHeader
          eyebrow="Spasial"
          title="Sorotan Provinsi"
          desc="Pilih provinsi untuk melihat pola bulanan dan catatan wawasan."
          action={
            <label className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-slate-500 dark:text-slate-400">
              <MapPin size={15} className="text-kemenhub-600 dark:text-kemenhub-300" />
              <select
                value={prov}
                onChange={(e) => setProv(e.target.value)}
                className="max-w-[240px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-800 outline-none focus:border-kemenhub-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {data.province_monthly_data.provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          }
        />
        {provEntry ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2">
                <Badge color="#d97706">
                  <CalendarDays size={12} /> Puncak: {provEntry.peak_month}
                </Badge>
                <Badge color="#dc2626">
                  <TrendingUp size={12} /> Lonjakan maks {fmtPct(provEntry.max_jump_pct, 1)}
                </Badge>
              </div>
              <p className="mt-4 text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">
                {provEntry.insight}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
                  <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
                    Total berangkat YTD
                  </p>
                  <p className="num mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                    {fmtCompact(provEntry.total_brg)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
                  <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
                    Volume puncak
                  </p>
                  <p className="num mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                    {fmtCompact(provEntry.peak_vol)}
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3">
              <p className="mb-2 text-[12.5px] font-bold text-slate-500 dark:text-slate-400">
                Penumpang bulanan — {provEntry.provinsi} (batang kuning = bulan puncak)
              </p>
              {provOptions && <Chart type="bar" series={provSeries} options={provOptions} height={200} />}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Data provinsi tidak tersedia.</p>
        )}
      </Card>
    </div>
  );
}
