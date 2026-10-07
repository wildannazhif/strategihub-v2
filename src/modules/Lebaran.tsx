import { useMemo } from 'react';
import { Flame, Undo2, CalendarDays } from 'lucide-react';
import Chart, { FONT, MONO } from '../components/Chart';
import { Card, SectionHeader, KpiCard, Badge } from '../components/ui';
import { useDark } from '../components/theme';
import { data, MODA_KEYS } from '../data';
import { MODA, densityStatus } from '../lib/moda';
import { fmtCompact, fmtInt, fmtPct, fmtDateShort } from '../lib/format';
import type { ApexOptions } from 'apexcharts';

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

  /* ---------- Grafik 1: multi-line + area per moda, 17 hari ---------- */
  const lineSeries = useMemo<ApexOptions['series']>(
    () => MODA_KEYS.map((m) => ({ name: MODA[m].label, data: days.map((r) => r[m] as number) })),
    [days],
  );

  const lineOptions = useMemo<ApexOptions>(() => {
    const dates = days.map((r) => r.date);
    const peaks = MODA_KEYS.map((m) => {
      let pIdx = 0;
      days.forEach((r, i) => {
        if ((r[m] as number) > (days[pIdx][m] as number)) pIdx = i;
      });
      return { x: dates[pIdx], y: days[pIdx][m] as number, color: MODA[m].color };
    });
    const zoneLabel = (color: string) => ({
      color,
      fontSize: '11px',
      fontWeight: 700,
      fontFamily: FONT,
    });
    return {
      colors: MODA_KEYS.map((m) => MODA[m].color),
      legend: { position: 'top', horizontalAlign: 'left' },
      fill: { opacity: dark ? 0.18 : 0.1 },
      xaxis: {
        categories: dates,
        labels: {
          formatter: (v: string | number) =>
            typeof v === 'string' && v.length >= 10 ? `${relLabel(v)} ${v.slice(8)}/3` : '',
        },
      },
      tooltip: { y: { formatter: (v: number | string) => `${fmtInt(Number(v))} pnp` } },
      annotations: {
        xaxis: [
          {
            x: MUDIK_START,
            x2: MUDIK_END,
            fillColor: '#d97706',
            opacity: 0.08,
            label: { text: 'Arus Mudik', style: zoneLabel('#d97706') },
          },
          {
            x: '2026-03-22',
            x2: BALIK_END,
            fillColor: '#7c3aed',
            opacity: 0.08,
            label: { text: 'Arus Balik', style: zoneLabel('#7c3aed') },
          },
        ],
        points: peaks.map((p) => ({
          x: p.x,
          y: p.y,
          marker: { size: 5, fillColor: p.color, strokeColor: '#ffffff', strokeWidth: 2 },
          label: {
            text: fmtCompact(p.y),
            style: {
              color: '#ffffff',
              background: p.color,
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: MONO,
            },
          },
        })),
      },
    };
  }, [dark, days]);

  /* ---------- Grafik 2: lonjakan per moda (grouped bar) ---------- */
  const surgeSeries = useMemo<ApexOptions['series']>(
    () => [
      { name: 'Mudik', data: MODA_KEYS.map((m) => surge[m].surge_mudik_pct) },
      { name: 'Balik I', data: MODA_KEYS.map((m) => surge[m].surge_balik1_pct) },
      { name: 'Balik II', data: MODA_KEYS.map((m) => surge[m].surge_balik2_pct) },
    ],
    [surge],
  );

  const surgeOptions = useMemo<ApexOptions>(
    () => ({
      colors: ['#d97706', '#dc2626', '#7c3aed'],
      legend: { position: 'top', horizontalAlign: 'left' },
      plotOptions: { bar: { borderRadius: 5, columnWidth: '62%' } },
      xaxis: { categories: MODA_KEYS.map((m) => MODA[m].short) },
      yaxis: { labels: { formatter: (v: number | string) => `${v}%` } },
      tooltip: { y: { formatter: (v: number | string) => fmtPct(Number(v), 1) } },
      annotations: {
        yaxis: [
          {
            y: 80,
            borderColor: '#dc2626',
            strokeDashArray: 4,
            label: {
              text: 'Ambang Sangat Kritis 80%',
              style: { color: '#dc2626', fontSize: '11px', fontWeight: 700, fontFamily: FONT },
            },
          },
        ],
      },
    }),
    [surge],
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
    <div className="space-y-4">
      <SectionHeader
        eyebrow="Lebaran 1447 H"
        title="Puncak Lebaran 2026"
        desc="Analisis 17 hari arus mudik dan balik, 13–29 Maret 2026 (H-8 hingga H+8, Hari-H 21 Maret)."
      />

      {/* Strip fase H-8 s/d H+8 */}
      <Card className="p-4 sm:p-5">
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
      <Card className="p-4 sm:p-5">
        <SectionHeader
          eyebrow="Pergerakan Harian"
          title="Arus Penumpang per Moda selama Lebaran"
          desc="Pin menandai puncak tiap moda. Zona kuning = arus mudik, zona ungu = arus balik."
        />
        <Chart type="area" series={lineSeries} options={lineOptions} height={320} />
      </Card>

      {/* Grafik 2 */}
      <Card className="p-4 sm:p-5">
        <SectionHeader
          eyebrow="Intensitas"
          title="Lonjakan per Moda vs Hari Normal"
          desc="Persentase kenaikan tiap fase terhadap baseline harian normal."
        />
        <Chart type="bar" series={surgeSeries} options={surgeOptions} height={300} />
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
      <Card className="p-4 sm:p-5">
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
