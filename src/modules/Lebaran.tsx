import { useMemo } from 'react';
import { Flame, Undo2, CalendarDays } from 'lucide-react';
import Chart, { baseTooltip, axisStyle, legendStyle, FONT, MONO, fmtNum } from '../components/Chart';
import { Card, SectionHeader, KpiCard, Badge } from '../components/ui';
import { useDark } from '../components/theme';
import { data, MODA_KEYS } from '../data';
import { MODA, densityStatus } from '../lib/moda';
import { fmtCompact, fmtInt, fmtPct, fmtDateShort } from '../lib/format';
import type { EChartsCoreOption } from 'echarts/core';

const MUDIK_END = '2026-03-20';
const HARI_H = '2026-03-21';
const MUDIK_START = '2026-03-13';
const BALIK_END = '2026-03-29';

type Fase = 'mudik' | 'hari-h' | 'balik';

function faseOf(date: string): Fase {
  if (date < HARI_H) return 'mudik';
  if (date === HARI_H) return 'hari-h';
  return 'balik';
}

const FASE_META: Record<Fase, { label: string; color: string; bg: string }> = {
  mudik: { label: 'Mudik', color: '#d97706', bg: 'rgba(217,119,6,.12)' },
  'hari-h': { label: 'Hari-H', color: '#1a5287', bg: 'rgba(26,82,135,.14)' },
  balik: { label: 'Balik', color: '#7c3aed', bg: 'rgba(124,58,237,.12)' },
};

function relLabel(iso: string): string {
  const diff = Number(iso.slice(8, 10)) - 21;
  if (diff === 0) return 'H';
  return diff > 0 ? `H+${diff}` : `H${diff}`;
}

const KEY_DAYS: Record<string, string> = {
  '2026-03-18': 'Puncak Mudik',
  '2026-03-21': 'Hari-H',
  '2026-03-24': 'Puncak Balik',
};

export default function LebaranView() {
  const dark = useDark();
  const days = data.lebaran_daily;
  const surge = data.surge_summary;

  const kpi = useMemo(() => {
    const mudik = days.find((r) => r.date === '2026-03-18');
    const balik = days.find((r) => r.date === '2026-03-24');
    const h = days.find((r) => r.date === HARI_H);
    return {
      mudikVal: mudik?.TOTAL ?? 0,
      mudikPct: surge.TOTAL.surge_mudik_pct,
      balikVal: balik?.TOTAL ?? 0,
      balikPct: surge.TOTAL.surge_balik1_pct,
      hVal: h?.TOTAL ?? 0,
      baseline: surge.TOTAL.baseline,
    };
  }, [days, surge]);

  /* ---------- Grafik 1: multi-line per moda 17 hari ---------- */
  const lineOption = useMemo<EChartsCoreOption>(() => {
    const dates = days.map((r) => r.date);
    return {
      animationDuration: 900,
      tooltip: {
        ...baseTooltip(dark),
        valueFormatter: (v: unknown) => (typeof v === 'number' ? `${fmtNum(v)} pnp` : v),
      },
      legend: { ...legendStyle(dark), top: 0, data: MODA_KEYS.map((m) => MODA[m].label) },
      grid: { left: 8, right: 12, top: 44, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        ...axisStyle(dark),
        axisLabel: {
          ...axisStyle(dark).axisLabel,
          formatter: (v: string) => `${relLabel(v)}\n${v.slice(8)}/3`,
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
      series: MODA_KEYS.map((m, si) => {
        let pIdx = 0;
        days.forEach((r, i) => {
          if (r[m] > days[pIdx][m]) pIdx = i;
        });
        const pDate = dates[pIdx];
        const pVal = days[pIdx][m] as number;
        return {
          name: MODA[m].label,
          type: 'line' as const,
          data: days.map((r) => r[m]),
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: MODA[m].color },
          areaStyle: { color: MODA[m].color, opacity: dark ? 0.16 : 0.08 },
          emphasis: { focus: 'series' as const },
          markPoint: {
            symbol: 'pin',
            symbolSize: 44,
            itemStyle: { color: MODA[m].color },
            label: {
              color: '#fff',
              fontFamily: MONO,
              fontSize: 9,
              fontWeight: 700,
              formatter: fmtCompact(pVal),
            },
            data: [{ coord: [pDate, pVal] }],
          },
          ...(si === 0
            ? {
                markArea: {
                  silent: true,
                  itemStyle: { color: dark ? 'rgba(217,119,6,.10)' : 'rgba(217,119,6,.07)' },
                  label: { color: '#d97706', fontFamily: FONT, fontSize: 11, fontWeight: 700 },
                  data: [[{ name: 'Arus Mudik', xAxis: MUDIK_START }, { xAxis: MUDIK_END }]],
                },
              }
            : {}),
          ...(si === 1
            ? {
                markArea: {
                  silent: true,
                  itemStyle: { color: dark ? 'rgba(124,58,237,.10)' : 'rgba(124,58,237,.07)' },
                  label: { color: '#7c3aed', fontFamily: FONT, fontSize: 11, fontWeight: 700 },
                  data: [[{ name: 'Arus Balik', xAxis: '2026-03-22' }, { xAxis: BALIK_END }]],
                },
              }
            : {}),
        };
      }),
    };
  }, [dark, days]);

  /* ---------- Grafik 2: lonjakan per moda (grouped bar) ---------- */
  const surgeOption = useMemo<EChartsCoreOption>(
    () => ({
      animationDuration: 800,
      tooltip: {
        ...baseTooltip(dark),
        valueFormatter: (v: unknown) => (typeof v === 'number' ? fmtPct(v, 1) : v),
      },
      legend: { ...legendStyle(dark), top: 0, data: ['Mudik', 'Balik I', 'Balik II'] },
      grid: { left: 8, right: 12, top: 44, bottom: 8, containLabel: true },
      xAxis: { type: 'category', data: MODA_KEYS.map((m) => MODA[m].short), ...axisStyle(dark) },
      yAxis: {
        type: 'value',
        ...axisStyle(dark),
        axisLabel: { ...axisStyle(dark).axisLabel, formatter: (v: number) => `${v}%` },
      },
      series: [
        {
          name: 'Mudik',
          type: 'bar' as const,
          data: MODA_KEYS.map((m) => surge[m].surge_mudik_pct),
          itemStyle: { color: '#d97706', borderRadius: [5, 5, 0, 0] },
          barMaxWidth: 34,
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: '#dc2626', type: 'dashed' as const, width: 1.2 },
            label: {
              color: '#dc2626',
              fontFamily: FONT,
              fontSize: 10,
              fontWeight: 700,
              formatter: 'Ambang Sangat Kritis 80%',
            },
            data: [{ yAxis: 80 }],
          },
        },
        {
          name: 'Balik I',
          type: 'bar' as const,
          data: MODA_KEYS.map((m) => surge[m].surge_balik1_pct),
          itemStyle: { color: '#dc2626', borderRadius: [5, 5, 0, 0] },
          barMaxWidth: 34,
        },
        {
          name: 'Balik II',
          type: 'bar' as const,
          data: MODA_KEYS.map((m) => surge[m].surge_balik2_pct),
          itemStyle: { color: '#7c3aed', borderRadius: [5, 5, 0, 0] },
          barMaxWidth: 34,
        },
      ],
    }),
    [dark, surge],
  );

  const densityBadges = useMemo(
    () =>
      MODA_KEYS.map((m) => {
        const s = surge[m];
        const max = Math.max(s.surge_mudik_pct, s.surge_balik1_pct, s.surge_balik2_pct);
        return { m, ...densityStatus(max), max };
      }),
    [surge],
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Lebaran 1447 H"
        title="Puncak Lebaran 2026"
        desc="Analisis 17 hari arus mudik dan balik, 13–29 Maret 2026 (H-8 hingga H+8, Hari-H 21 Maret)."
      />

      {/* Strip fase H-8 s/d H+8 */}
      <Card className="p-5 sm:p-6">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-kemenhub-600 dark:text-kemenhub-300">
          Linimasa Fase
        </p>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {days.map((r) => {
            const f = faseOf(r.date);
            const fm = FASE_META[f];
            const key = KEY_DAYS[r.date];
            return (
              <div
                key={r.date}
                className={`min-w-[52px] flex-1 rounded-xl px-1 py-2 text-center ${
                  key ? 'ring-2 ring-offset-1 dark:ring-offset-slate-900' : ''
                }`}
                style={{
                  background: fm.bg,
                  ...(key ? { ['--tw-ring-color' as string]: fm.color } : {}),
                }}
                title={`${fmtDateShort(r.date)} • ${fmtInt(r.TOTAL)} pnp`}
              >
                <p className="num text-[12px] font-extrabold" style={{ color: fm.color }}>
                  {relLabel(r.date)}
                </p>
                <p className="num mt-0.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                  {r.date.slice(8, 10)} Mar
                </p>
                {key && (
                  <p className="mt-1 text-[9px] font-bold uppercase leading-tight" style={{ color: fm.color }}>
                    {key}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(FASE_META) as Fase[]).map((f) => (
            <Badge key={f} color={FASE_META[f].color}>
              {FASE_META[f].label}
              {f === 'mudik' && ' • 13–20 Mar'}
              {f === 'hari-h' && ' • 21 Mar'}
              {f === 'balik' && ' • 22–29 Mar'}
            </Badge>
          ))}
        </div>
      </Card>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Puncak Mudik — H-3"
          value={`${fmtCompact(kpi.mudikVal)} pnp`}
          delta={kpi.mudikPct}
          deltaLabel="vs hari normal • 18 Mar 2026"
          icon={<Flame size={18} />}
          accent="#d97706"
        />
        <KpiCard
          label="Puncak Balik — H+3"
          value={`${fmtCompact(kpi.balikVal)} pnp`}
          delta={kpi.balikPct}
          deltaLabel="vs hari normal • 24 Mar 2026"
          icon={<Undo2 size={18} />}
          accent="#7c3aed"
        />
        <KpiCard
          label="Hari-H Lebaran"
          value={`${fmtCompact(kpi.hVal)} pnp`}
          sub={`21 Mar 2026 • titik terendah periode (baseline normal ${fmtCompact(kpi.baseline)} pnp)`}
          icon={<CalendarDays size={18} />}
          accent="#1a5287"
        />
      </div>

      {/* Grafik 1 */}
      <Card className="p-5 sm:p-6">
        <SectionHeader
          eyebrow="Pergerakan Harian"
          title="Arus Penumpang per Moda selama Lebaran"
          desc="Pin menandai puncak tiap moda. Zona kuning = arus mudik, zona ungu = arus balik."
        />
        <Chart option={lineOption} height={400} />
      </Card>

      {/* Grafik 2 */}
      <Card className="p-5 sm:p-6">
        <SectionHeader
          eyebrow="Intensitas"
          title="Lonjakan per Moda vs Hari Normal"
          desc="Persentase kenaikan tiap fase terhadap baseline harian normal."
        />
        <Chart option={surgeOption} height={360} />
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <span className="w-full text-[11.5px] font-bold uppercase tracking-wide text-slate-400">
            Status kepadatan (lonjakan tertinggi tiap moda)
          </span>
          {densityBadges.map((d) => (
            <span
              key={d.m}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-bold"
              style={{ background: d.bg, color: d.color }}
            >
              <span className="size-2 rounded-full" style={{ background: MODA[d.m].color }} />
              {MODA[d.m].short}: {d.label} ({fmtPct(d.max, 1)})
            </span>
          ))}
        </div>
      </Card>

      {/* Tabel 17 hari */}
      <Card className="p-5 sm:p-6">
        <SectionHeader
          eyebrow="Rincian"
          title="Tabel Harian Periode Lebaran"
          desc="Gulir untuk melihat seluruh 17 hari."
        />
        <div className="max-h-[440px] overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[760px] border-collapse text-[12.5px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="px-3 py-2.5 text-left font-bold text-slate-600 dark:text-slate-300">Tanggal</th>
                <th className="px-3 py-2.5 text-left font-bold text-slate-600 dark:text-slate-300">Relatif</th>
                <th className="num px-3 py-2.5 text-right font-bold text-slate-600 dark:text-slate-300">Total</th>
                {MODA_KEYS.map((m) => (
                  <th key={m} className="num px-3 py-2.5 text-right font-bold text-slate-600 dark:text-slate-300">
                    {MODA[m].short}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-left font-bold text-slate-600 dark:text-slate-300">Fase</th>
              </tr>
            </thead>
            <tbody>
              {days.map((r) => {
                const f = faseOf(r.date);
                const fm = FASE_META[f];
                return (
                  <tr
                    key={r.date}
                    className="border-t border-slate-100 odd:bg-white even:bg-slate-50/60 hover:bg-slate-100/70 dark:border-slate-800 dark:odd:bg-slate-900 dark:even:bg-slate-800/40 dark:hover:bg-slate-800"
                  >
                    <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
                      {fmtDateShort(r.date)}
                    </td>
                    <td className="num px-3 py-2 text-slate-500 dark:text-slate-400">{relLabel(r.date)}</td>
                    <td className="num px-3 py-2 text-right font-bold text-slate-900 dark:text-white">
                      {fmtInt(r.TOTAL)}
                    </td>
                    {MODA_KEYS.map((m) => (
                      <td key={m} className="num px-3 py-2 text-right text-slate-600 dark:text-slate-300">
                        {fmtCompact(r[m] as number)}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                        style={{ background: fm.bg, color: fm.color }}
                      >
                        <span className="size-1.5 rounded-full" style={{ background: fm.color }} />
                        {fm.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
