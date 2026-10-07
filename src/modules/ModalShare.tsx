import { useMemo, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import Chart, { baseTooltip, axisStyle, legendStyle, FONT, MONO } from '../components/Chart';
import { Card, SectionHeader, Segmented } from '../components/ui';
import { useDark } from '../components/theme';
import { data, MODA_KEYS } from '../data';
import { MODA } from '../lib/moda';
import { fmtCompact } from '../lib/format';
import type { EChartsCoreOption } from 'echarts/core';
import type { ModaKey } from '../data/types';

type Mode = 'donat' | 'tren' | 'banding';

const fmtPp = (v: number) =>
  `${v >= 0 ? '+' : ''}${v.toLocaleString('id-ID', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} pp`;

const fmtShare = (v: number) =>
  `${v.toLocaleString('id-ID', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`;

export default function ModalShareView() {
  const dark = useDark();
  const monthly = data.monthly_summary;
  const [mode, setMode] = useState<Mode>('donat');
  const [monthIdx, setMonthIdx] = useState(2); // default Maret — puncak Lebaran
  const row = monthly[monthIdx];

  /* ---------- Donat: komposisi satu bulan ---------- */
  const ranking = useMemo(
    () =>
      MODA_KEYS.map((m) => ({
        m,
        value: row[m] as number,
        share: row[`share_${m}`] as number,
      })).sort((a, b) => b.value - a.value),
    [row],
  );
  const maxRank = Math.max(...ranking.map((r) => r.value));

  const donutOption = useMemo<EChartsCoreOption>(
    () => ({
      animationDuration: 800,
      tooltip: {
        ...baseTooltip(dark),
        trigger: 'item' as const,
        // @ts-expect-error echarts percent passthrough
        formatter: (p) =>
          `${p.marker} <b>${p.name}</b><br/><span style="font-family:${MONO}">${fmtCompact(p.value)} pnp • ${p.percent?.toFixed(1)}%</span>`,
      },
      legend: { ...legendStyle(dark), bottom: 0 },
      title: {
        text: fmtCompact(row.TOTAL),
        subtext: `${row.label} 2026 • penumpang`,
        left: 'center',
        top: '36%',
        itemGap: 4,
        textStyle: {
          fontFamily: MONO,
          fontSize: 24,
          fontWeight: 800,
          color: dark ? '#f1f5f9' : '#0f172a',
        },
        subtextStyle: {
          fontFamily: FONT,
          fontSize: 11.5,
          color: dark ? '#94a3b8' : '#64748b',
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['54%', '78%'],
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
            value: row[m] as number,
            itemStyle: { color: MODA[m].color },
          })),
        },
      ],
    }),
    [dark, row],
  );

  /* ---------- Tren: stacked bar 100% + line total ---------- */
  const trenOption = useMemo<EChartsCoreOption>(() => {
    const months = monthly.map((r) => r.label.slice(0, 3));
    const lebaran =
      monthly.find((r) => r.label.toLowerCase().startsWith('mar'))?.label.slice(0, 3) ?? 'Mar';
    return {
      animationDuration: 900,
      tooltip: {
        ...baseTooltip(dark),
        formatter: (ps: any) => {
          const list = ps as Array<{ seriesName: string; value: number; marker: string; dataIndex: number }>;
          const r = monthly[list[0].dataIndex];
          let html = `<b style="font-family:${FONT}">${r.label} 2026</b><br/>`;
          for (const p of list) {
            if (p.seriesName === 'Total (jt)') {
              html += `${p.marker} ${p.seriesName}: <b style="font-family:${MONO}">${fmtCompact(r.TOTAL)} pnp</b><br/>`;
            } else {
              html += `${p.marker} ${p.seriesName}: <b style="font-family:${MONO}">${Number(p.value).toFixed(1)}%</b><br/>`;
            }
          }
          return html;
        },
      },
      legend: { ...legendStyle(dark), top: 0 },
      grid: { left: 8, right: 8, top: 44, bottom: 8, containLabel: true },
      xAxis: { type: 'category', data: months, ...axisStyle(dark) },
      yAxis: [
        {
          type: 'value',
          max: 100,
          ...axisStyle(dark),
          axisLabel: { ...axisStyle(dark).axisLabel, formatter: '{value}%' },
        },
        {
          type: 'value',
          ...axisStyle(dark),
          splitLine: { show: false },
          axisLabel: { ...axisStyle(dark).axisLabel, formatter: '{value} jt' },
        },
      ],
      series: [
        ...MODA_KEYS.map((m) => ({
          name: MODA[m].short,
          type: 'bar' as const,
          stack: 'share',
          data: monthly.map((r) => Number(((r[`share_${m}`] as number) ?? 0).toFixed(1))),
          itemStyle: { color: MODA[m].color },
          barWidth: '58%',
          emphasis: { focus: 'series' as const },
        })),
        {
          name: 'Total (jt)',
          type: 'line' as const,
          yAxisIndex: 1,
          data: monthly.map((r) => Number((r.TOTAL / 1e6).toFixed(1))),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2.5, color: dark ? '#f8fafc' : '#0f172a' },
          itemStyle: { color: dark ? '#f8fafc' : '#0f172a' },
          z: 10,
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: '#d97706', type: 'dashed' as const, width: 1.5 },
            label: {
              color: '#d97706',
              fontFamily: FONT,
              fontSize: 11,
              fontWeight: 700,
              formatter: 'Lebaran',
            },
            data: [{ xAxis: lebaran }],
          },
        },
      ],
    };
  }, [dark, monthly]);

  /* ---------- Perbandingan: Jan vs Sep ---------- */
  const bandingOption = useMemo<EChartsCoreOption>(() => {
    const jan = monthly[0];
    const sep = monthly[monthly.length - 1];
    const dMap: Record<ModaKey, number> = {} as Record<ModaKey, number>;
    for (const m of MODA_KEYS) dMap[m] = (sep[`share_${m}`] as number) - (jan[`share_${m}`] as number);
    return {
      animationDuration: 800,
      tooltip: {
        ...baseTooltip(dark),
        valueFormatter: (v: unknown) => (typeof v === 'number' ? `${v.toFixed(1)}%` : v),
      },
      legend: { ...legendStyle(dark), top: 0 },
      grid: { left: 8, right: 96, top: 40, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        max: 40,
        ...axisStyle(dark),
        axisLabel: { ...axisStyle(dark).axisLabel, formatter: '{value}%' },
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: MODA_KEYS.map((m) => MODA[m].label),
        ...axisStyle(dark),
        axisLabel: {
          ...axisStyle(dark).axisLabel,
          fontFamily: FONT,
          fontSize: 12,
          color: dark ? '#e2e8f0' : '#0f172a',
        },
      },
      series: [
        {
          name: jan.label,
          type: 'bar' as const,
          data: MODA_KEYS.map((m) => Number(((jan[`share_${m}`] as number) ?? 0).toFixed(1))),
          itemStyle: { color: dark ? '#475569' : '#cbd5e1', borderRadius: [0, 6, 6, 0] },
          barWidth: 14,
        },
        {
          name: sep.label,
          type: 'bar' as const,
          data: MODA_KEYS.map((m) => ({
            value: Number(((sep[`share_${m}`] as number) ?? 0).toFixed(1)),
            itemStyle: { color: MODA[m].color, borderRadius: [0, 6, 6, 0] },
          })),
          barWidth: 14,
          label: {
            show: true,
            position: 'right' as const,
            fontFamily: MONO,
            fontSize: 11,
            fontWeight: 700,
            color: dark ? '#cbd5e1' : '#475569',
            formatter: (p: any) => fmtPp(dMap[MODA_KEYS[p.dataIndex]]),
          },
        },
      ],
    };
  }, [dark, monthly]);

  /* ---------- Insight otomatis Jan → Sep ---------- */
  const deltas = useMemo(() => {
    const jan = monthly[0];
    const sep = monthly[monthly.length - 1];
    return MODA_KEYS.map((m) => {
      const j = jan[`share_${m}`] as number;
      const s = sep[`share_${m}`] as number;
      return { m, jan: j, sep: s, d: s - j };
    }).sort((a, b) => b.d - a.d);
  }, [monthly]);
  const topGainer = deltas[0];
  const topLoser = deltas[deltas.length - 1];

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Pangsa Pasar"
        title="Pangsa Pasar Antar-Moda"
        desc="Komposisi penumpang 5 moda transportasi Jan–Sep 2026. Ganti tampilan untuk melihat komposisi bulanan, tren pergeseran preferensi, atau perbandingan awal–akhir periode."
        action={
          <Segmented<Mode>
            options={[
              { value: 'donat', label: 'Donat' },
              { value: 'tren', label: 'Tren Bulanan' },
              { value: 'banding', label: 'Perbandingan' },
            ]}
            value={mode}
            onChange={setMode}
          />
        }
      />

      {mode === 'donat' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <Card className="p-5 sm:p-6 xl:col-span-3">
            <div className="mb-4 flex flex-wrap gap-1.5">
              {monthly.map((r, i) => (
                <button
                  key={r.bulan}
                  onClick={() => setMonthIdx(i)}
                  className={
                    i === monthIdx
                      ? 'rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] font-bold text-white dark:bg-white dark:text-slate-900'
                      : 'rounded-lg bg-slate-100 px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }
                >
                  {r.label.slice(0, 3)}
                </button>
              ))}
            </div>
            <Chart option={donutOption} height={330} />
          </Card>
          <Card className="p-5 sm:p-6 xl:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-kemenhub-600 dark:text-kemenhub-300">
              Peringkat Moda
            </p>
            <h3 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              {row.label} 2026
            </h3>
            <div className="mt-4 space-y-3.5">
              {ranking.map((r, i) => (
                <div key={r.m}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                      <span className="num mr-1.5 text-slate-400 dark:text-slate-500">{i + 1}</span>
                      {MODA[r.m].label}
                    </p>
                    <p className="num text-[13px] font-extrabold" style={{ color: MODA[r.m].color }}>
                      {fmtShare(r.share)}
                    </p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{ width: `${(r.value / maxRank) * 100}%`, background: MODA[r.m].color }}
                    />
                  </div>
                  <p className="num mt-0.5 text-[11px] text-slate-400">{fmtCompact(r.value)} pnp</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {mode === 'tren' && (
        <Card className="p-5 sm:p-6">
          <SectionHeader
            eyebrow="Tren"
            title="Pergeseran Preferensi Moda"
            desc="Stacked bar 100% per bulan (sumbu kiri) + garis total penumpang dalam juta (sumbu kanan). Garis putus-putus menandai Maret — bulan Lebaran 2026."
          />
          <Chart option={trenOption} height={430} />
        </Card>
      )}

      {mode === 'banding' && (
        <Card className="p-5 sm:p-6">
          <SectionHeader
            eyebrow="Perbandingan"
            title={`${monthly[0].label} vs ${monthly[monthly.length - 1].label} 2026`}
            desc="Share tiap moda di awal vs akhir periode. Angka di kanan bar menunjukkan perubahan dalam poin persentase (pp)."
          />
          <Chart option={bandingOption} height={380} />
        </Card>
      )}

      {/* Insight otomatis */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-xl"
              style={{ background: MODA[topGainer.m].colorSoft, color: MODA[topGainer.m].color }}
            >
              <TrendingUp size={18} />
            </span>
            <div>
              <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                Kenaikan share terbesar
              </p>
              <p className="text-[15px] font-bold text-slate-900 dark:text-white">
                {MODA[topGainer.m].label}
              </p>
            </div>
            <span className="num ml-auto text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {fmtPp(topGainer.d)}
            </span>
          </div>
          <p className="num mt-2.5 text-[12.5px] text-slate-500 dark:text-slate-400">
            {fmtShare(topGainer.jan)} → {fmtShare(topGainer.sep)} (Jan → Sep 2026)
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-xl"
              style={{ background: MODA[topLoser.m].colorSoft, color: MODA[topLoser.m].color }}
            >
              <TrendingDown size={18} />
            </span>
            <div>
              <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                {topLoser.d >= 0 ? 'Kenaikan share terkecil' : 'Penurunan share terbesar'}
              </p>
              <p className="text-[15px] font-bold text-slate-900 dark:text-white">
                {MODA[topLoser.m].label}
              </p>
            </div>
            <span
              className={`num ml-auto text-xl font-extrabold ${topLoser.d >= 0 ? 'text-slate-500' : 'text-rose-600 dark:text-rose-400'}`}
            >
              {fmtPp(topLoser.d)}
            </span>
          </div>
          <p className="num mt-2.5 text-[12.5px] text-slate-500 dark:text-slate-400">
            {fmtShare(topLoser.jan)} → {fmtShare(topLoser.sep)} (Jan → Sep 2026)
          </p>
        </Card>
      </div>
    </div>
  );
}
