import { useMemo } from 'react';
import {
  Users, Bus, CalendarDays, Flame, Plane, TrainFront, Ship, Anchor,
} from 'lucide-react';
import Chart, { baseTooltip, axisStyle, legendStyle, FONT, MONO, fmtNum } from '../components/Chart';
import { Card, SectionHeader, KpiCard, Badge } from '../components/ui';
import { useDark } from '../components/theme';
import { data, MODA_KEYS } from '../data';
import { MODA } from '../lib/moda';
import { fmtCompact, fmtInt, fmtPct, fmtDate } from '../lib/format';
import type { EChartsCoreOption } from 'echarts/core';

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

  const areaOption = useMemo<EChartsCoreOption>(() => {
    const dates = timeline.map((r) => r.date);
    return {
      animationDuration: 900,
      tooltip: {
        ...baseTooltip(dark),
        valueFormatter: (v: unknown) => (typeof v === 'number' ? fmtNum(v) : v),
      },
      legend: { ...legendStyle(dark), top: 0, data: [...MODA_KEYS.map((m) => MODA[m].label), 'Total'] },
      grid: { left: 8, right: 12, top: 44, bottom: 8, containLabel: true },
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
          formatter: (v: number) => (v >= 1e6 ? `${(v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt` : `${Math.round(v / 1e3)} rb`),
        },
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0, filterMode: 'none' },
        {
          type: 'slider', height: 22, bottom: 0,
          borderColor: 'transparent',
          backgroundColor: dark ? '#1e293b' : '#f1f5f9',
          fillerColor: dark ? 'rgba(26,82,135,.35)' : 'rgba(26,82,135,.18)',
          handleStyle: { color: '#1a5287' },
          textStyle: { color: dark ? '#94a3b8' : '#64748b', fontFamily: MONO, fontSize: 10 },
        },
      ],
      series: [
        ...MODA_KEYS.map((m) => ({
          name: MODA[m].label,
          type: 'line' as const,
          stack: 'moda',
          data: timeline.map((r) => r[m]),
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 1.5, color: MODA[m].color },
          areaStyle: { color: MODA[m].color, opacity: dark ? 0.28 : 0.16 },
          emphasis: { focus: 'series' as const },
        })),
        {
          name: 'Total',
          type: 'line' as const,
          data: timeline.map((r) => r.TOTAL),
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2.5, color: dark ? '#f8fafc' : '#0f172a' },
          z: 10,
          markArea: {
            silent: true,
            itemStyle: { color: dark ? 'rgba(217,119,6,.10)' : 'rgba(217,119,6,.08)' },
            label: { color: '#d97706', fontFamily: FONT, fontSize: 11, fontWeight: 700 },
            data: [[{ name: 'Lebaran 2026', xAxis: '2026-03-13' }, { xAxis: '2026-03-29' }]],
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: '#dc2626', type: 'dashed' as const, width: 1.5 },
            label: { color: '#dc2626', fontFamily: FONT, fontSize: 10.5, fontWeight: 700, formatter: 'Puncak {c}' },
            data: [{ xAxis: meta.all_time_peak_date, value: fmtCompact(meta.all_time_peak_val) }],
          },
        },
      ],
    };
  }, [dark, timeline, meta]);

  const donutOption = useMemo<EChartsCoreOption>(() => ({
    animationDuration: 800,
    tooltip: {
      ...baseTooltip(dark),
      trigger: 'item' as const,
      valueFormatter: (v: unknown) => (typeof v === 'number' ? `${fmtNum(v)} pnp` : v),
      // @ts-expect-error echarts percent passthrough
      formatter: (p) => `${p.marker} <b>${p.name}</b><br/><span style="font-family:${MONO}">${fmtNum(p.value)} pnp • ${p.percent?.toFixed(1)}%</span>`,
    },
    legend: { ...legendStyle(dark), bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['52%', '76%'],
        center: ['50%', '44%'],
        padAngle: 2,
        itemStyle: { borderRadius: 8 },
        label: {
          color: dark ? '#cbd5e1' : '#475569',
          fontFamily: MONO,
          fontSize: 11,
          formatter: '{d}%',
        },
        emphasis: { scale: true, scaleSize: 6 },
        data: MODA_KEYS.map((m) => ({
          name: MODA[m].label,
          value: totalByModa[m],
          itemStyle: { color: MODA[m].color },
        })),
      },
    ],
  }), [dark, totalByModa]);

  const spark = (m: (typeof MODA_KEYS)[number]) =>
    timeline.filter((_, i) => i % 4 === 0).map((r) => r[m] as number);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-kemenhub-800 via-kemenhub-900 to-slate-950 p-6 text-white sm:p-8">
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
          <h1 className="mt-3 max-w-3xl text-2xl font-extrabold leading-tight tracking-tight sm:text-[34px] sm:leading-[1.15]">
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
      <Card className="p-5 sm:p-6">
        <SectionHeader
          eyebrow="Kronologi"
          title="Arus Harian Penumpang per Moda"
          desc="Area bertumpuk 272 hari — seret untuk zoom, arahkan kursor untuk detail. Zona kuning menandai periode Lebaran 2026."
        />
        <Chart option={areaOption} height={420} />
      </Card>

      {/* Share + moda cards */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="p-5 sm:p-6 xl:col-span-2">
          <SectionHeader eyebrow="Komposisi" title="Pangsa Pasar Moda" desc="Akumulasi Jan–Sep 2026" />
          <Chart option={donutOption} height={300} />
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
