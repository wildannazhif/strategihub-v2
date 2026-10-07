import { useMemo, useState } from 'react';
import { CalendarDays, MapPin, TrendingUp } from 'lucide-react';
import Chart, { baseTooltip, axisStyle, legendStyle, FONT, MONO, fmtNum } from '../components/Chart';
import { Card, SectionHeader, Segmented, Badge } from '../components/ui';
import { useDark } from '../components/theme';
import { data, MODA_KEYS } from '../data';
import { MODA } from '../lib/moda';
import { fmtCompact, fmtInt, fmtPct } from '../lib/format';
import type { EChartsCoreOption } from 'echarts/core';
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
  const mainOption = useMemo<EChartsCoreOption>(() => {
    const dates = timeline.map((r) => r.date);
    const totals = timeline.map((r) => valOf(metric, dir, r, 'TOTAL'));
    let peakIdx = 0;
    totals.forEach((v, i) => {
      if (v > totals[peakIdx]) peakIdx = i;
    });
    return {
      animationDuration: 900,
      tooltip: {
        ...baseTooltip(dark),
        valueFormatter: (v: unknown) =>
          typeof v === 'number' ? `${fmtNum(v)} ${unitShort}` : v,
      },
      legend: {
        ...legendStyle(dark),
        top: 0,
        data: [...shownModas.map((m) => MODA[m].label), 'Total'],
      },
      grid: { left: 8, right: 12, top: 44, bottom: 56, containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        ...axisStyle(dark),
        axisLabel: {
          ...axisStyle(dark).axisLabel,
          formatter: (v: string) => v.slice(5).replace('-', '/'),
          interval: 29,
        },
      },
      yAxis: {
        type: 'value',
        ...axisStyle(dark),
        axisLabel: {
          ...axisStyle(dark).axisLabel,
          formatter: (v: number) =>
            v >= 1e6
              ? `${(v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`
              : `${Math.round(v / 1e3)} rb`,
        },
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0, filterMode: 'none' },
        {
          type: 'slider',
          height: 22,
          bottom: 0,
          borderColor: 'transparent',
          backgroundColor: dark ? '#1e293b' : '#f1f5f9',
          fillerColor: dark ? 'rgba(26,82,135,.35)' : 'rgba(26,82,135,.18)',
          handleStyle: { color: '#1a5287' },
          textStyle: { color: dark ? '#94a3b8' : '#64748b', fontFamily: MONO, fontSize: 10 },
        },
      ],
      series: [
        ...shownModas.map((m) => ({
          name: MODA[m].label,
          type: 'line' as const,
          data: timeline.map((r) => valOf(metric, dir, r, m)),
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 1.8, color: MODA[m].color },
          emphasis: { focus: 'series' as const },
        })),
        {
          name: 'Total',
          type: 'line' as const,
          data: totals,
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2.5, color: dark ? '#f8fafc' : '#0f172a' },
          z: 10,
          markArea: {
            silent: true,
            itemStyle: { color: dark ? 'rgba(217,119,6,.12)' : 'rgba(217,119,6,.08)' },
            label: { color: '#d97706', fontFamily: FONT, fontSize: 11, fontWeight: 700 },
            data: [[{ name: 'Lebaran 2026', xAxis: '2026-03-13' }, { xAxis: '2026-03-29' }]],
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: '#dc2626', type: 'dashed' as const, width: 1.5 },
            label: {
              color: '#dc2626',
              fontFamily: FONT,
              fontSize: 10.5,
              fontWeight: 700,
              formatter: 'Puncak {c}',
            },
            data: [{ xAxis: dates[peakIdx], value: fmtCompact(totals[peakIdx]) }],
          },
        },
      ],
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

  const monthlyOption = useMemo<EChartsCoreOption>(
    () => ({
      animationDuration: 800,
      tooltip: {
        ...baseTooltip(dark),
        valueFormatter: (v: unknown) =>
          typeof v === 'number' ? `${fmtNum(v)} ${unitShort}` : v,
      },
      legend: { ...legendStyle(dark), top: 0, data: shownModas.map((m) => MODA[m].short) },
      grid: { left: 8, right: 12, top: 40, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: monthAgg.map((e) => e.label.slice(0, 3)),
        ...axisStyle(dark),
      },
      yAxis: {
        type: 'value',
        ...axisStyle(dark),
        axisLabel: {
          ...axisStyle(dark).axisLabel,
          formatter: (v: number) =>
            v >= 1e6
              ? `${(v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 0 })} jt`
              : `${Math.round(v / 1e3)} rb`,
        },
      },
      series: shownModas.map((m) => ({
        name: MODA[m].short,
        type: 'bar' as const,
        stack: 'm',
        data: monthAgg.map((e) => e.vals[m] ?? 0),
        itemStyle: { color: MODA[m].color, borderRadius: [3, 3, 0, 0] },
        emphasis: { focus: 'series' as const },
        barMaxWidth: 44,
      })),
    }),
    [dark, monthAgg, shownModas, unitShort],
  );

  /* ---------- Pola hari dalam minggu ---------- */
  const dowOption = useMemo<EChartsCoreOption>(
    () => ({
      animationDuration: 800,
      tooltip: {
        ...baseTooltip(dark),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (p: any) => {
          const r: DailyRow = dowRows[p[0].dataIndex];
          const rows = MODA_KEYS.map(
            (m) =>
              `<div style="display:flex;justify-content:space-between;gap:16px"><span><span style="display:inline-block;width:8px;height:8px;border-radius:99px;background:${MODA[m].color};margin-right:6px"></span>${MODA[m].short}</span><b style="font-family:${MONO}">${fmtInt(valOf(metric, dir, r, m))}</b></div>`,
          ).join('');
          return `<div style="font-family:${FONT}"><b>${r.dow}</b> <span style="color:#94a3b8">• rata-rata harian</span></div><div style="margin-top:6px">${rows}</div><div style="margin-top:6px;display:flex;justify-content:space-between"><span>Total</span><b style="font-family:${MONO}">${fmtInt(valOf(metric, dir, r, 'TOTAL'))} ${unitShort}</b></div>`;
        },
      },
      grid: { left: 8, right: 12, top: 16, bottom: 8, containLabel: true },
      xAxis: { type: 'category', data: dowRows.map((r) => r.dow as string), ...axisStyle(dark) },
      yAxis: {
        type: 'value',
        ...axisStyle(dark),
        axisLabel: {
          ...axisStyle(dark).axisLabel,
          formatter: (v: number) => `${Math.round(v / 1e3)} rb`,
        },
      },
      series: [
        {
          type: 'bar' as const,
          data: dowRows.map((r, i) => {
            const weekend = i >= 5;
            return {
              value: valOf(metric, dir, r, 'TOTAL'),
              itemStyle: {
                color: weekend ? '#dc2626' : dark ? '#38bdf8' : '#1a5287',
                opacity: weekend ? 0.92 : 0.75,
                borderRadius: [7, 7, 0, 0],
              },
            };
          }),
          barMaxWidth: 52,
          label: {
            show: true,
            position: 'top' as const,
            fontFamily: MONO,
            fontSize: 10,
            color: dark ? '#cbd5e1' : '#475569',
            formatter: (p: { value: number }) => fmtCompact(p.value),
          },
        },
      ],
    }),
    [dark, dowRows, metric, dir, unitShort],
  );

  /* ---------- Mini bar provinsi ---------- */
  const provOption = useMemo<EChartsCoreOption | null>(() => {
    if (!provEntry) return null;
    let peakIdx = 0;
    provEntry.monthly.forEach((e, i) => {
      if (e.tot > provEntry.monthly[peakIdx].tot) peakIdx = i;
    });
    return {
      animationDuration: 700,
      tooltip: {
        ...baseTooltip(dark),
        valueFormatter: (v: unknown) => (typeof v === 'number' ? `${fmtNum(v)} pnp` : v),
      },
      grid: { left: 8, right: 12, top: 16, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: provEntry.monthly.map((e) => e.short),
        ...axisStyle(dark),
      },
      yAxis: {
        type: 'value',
        ...axisStyle(dark),
        axisLabel: {
          ...axisStyle(dark).axisLabel,
          formatter: (v: number) =>
            v >= 1e6 ? `${(v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt` : `${Math.round(v / 1e3)} rb`,
        },
      },
      series: [
        {
          type: 'bar' as const,
          data: provEntry.monthly.map((e, i) => ({
            value: e.tot,
            itemStyle: {
              color: i === peakIdx ? '#d97706' : dark ? '#38bdf8' : '#1a5287',
              opacity: i === peakIdx ? 1 : 0.7,
              borderRadius: [5, 5, 0, 0],
            },
          })),
          barMaxWidth: 40,
        },
      ],
    };
  }, [dark, provEntry]);

  return (
    <div className="space-y-6">
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
      <Card className="p-5 sm:p-6">
        <SectionHeader
          eyebrow="Tren Harian"
          title={`${DIR_LABEL[dir]} ${metric === 'pnp' ? 'Penumpang' : 'Armada'} per Moda`}
          desc="Seret untuk zoom, arahkan kursor untuk detail harian."
        />
        <Chart option={mainOption} height={400} />
      </Card>

      {/* Agregasi bulanan + pola mingguan */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <SectionHeader
            eyebrow="Agregasi"
            title="Total Bulanan per Moda"
            desc={`${DIR_LABEL[dir].toLowerCase()} ${metric === 'pnp' ? 'penumpang' : 'armada'} — Januari hingga September 2026`}
          />
          <Chart option={monthlyOption} height={340} />
        </Card>
        <Card className="p-5 sm:p-6">
          <SectionHeader
            eyebrow="Musiman"
            title="Pola Hari dalam Minggu"
            desc="Rata-rata harian per hari — batang merah menandai akhir pekan."
          />
          <Chart option={dowOption} height={340} />
        </Card>
      </div>

      {/* Sorotan provinsi */}
      <Card className="p-5 sm:p-6">
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
              {provOption && <Chart option={provOption} height={260} />}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Data provinsi tidak tersedia.</p>
        )}
      </Card>
    </div>
  );
}
