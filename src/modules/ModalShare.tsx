import { useMemo, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import Chart, { FONT, MONO } from '../components/Chart';
import { Card, SectionHeader, Segmented } from '../components/ui';
import { useDark } from '../components/theme';
import { data, MODA_KEYS } from '../data';
import { MODA } from '../lib/moda';
import { fmtCompact } from '../lib/format';
import type { ApexOptions, ApexAxisChartSeries } from 'apexcharts';
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

  const donutSeries = useMemo(() => MODA_KEYS.map((m) => row[m] as number), [row]);

  const donutOptions = useMemo<ApexOptions>(
    () => ({
      labels: MODA_KEYS.map((m) => MODA[m].label),
      colors: MODA_KEYS.map((m) => MODA[m].color),
      legend: { position: 'bottom' },
      stroke: { width: 2, colors: [dark ? '#0f172a' : '#ffffff'] },
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              name: { fontFamily: FONT, fontSize: '12px', fontWeight: 600 },
              value: {
                fontFamily: MONO,
                fontSize: '22px',
                fontWeight: 800,
                color: dark ? '#f1f5f9' : '#0f172a',
              },
              total: {
                show: true,
                label: `${row.label} 2026`,
                fontSize: '13px',
                fontWeight: 700,
                color: dark ? '#94a3b8' : '#64748b',
                formatter: () => fmtCompact(row.TOTAL),
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (_v: number, opts: any) =>
          fmtShare(row[`share_${MODA_KEYS[opts.seriesIndex]}`] as number),
        style: { fontFamily: MONO, fontSize: '11px', fontWeight: 700 },
      },
      tooltip: {
        y: {
          formatter: (v: number, opts: any) =>
            `${fmtCompact(v)} pnp • ${fmtShare(row[`share_${MODA_KEYS[opts.seriesIndex]}`] as number)}`,
          title: { formatter: (name: string) => name },
        },
      },
    }),
    [dark, row],
  );

  /* ---------- Tren: stacked bar 100% + line total ---------- */
  const trenSeries = useMemo(
    (): ApexAxisChartSeries => [
      ...MODA_KEYS.map((m) => ({
        name: MODA[m].short,
        type: 'bar' as const,
        data: monthly.map((r) => Number(((r[`share_${m}`] as number) ?? 0).toFixed(1))),
      })),
      {
        name: 'Total (jt)',
        type: 'line' as const,
        data: monthly.map((r) => Number((r.TOTAL / 1e6).toFixed(1))),
      },
    ],
    [monthly],
  );

  const trenOptions = useMemo<ApexOptions>(() => {
    const months = monthly.map((r) => r.label.slice(0, 3));
    const lebaran =
      monthly.find((r) => r.label.toLowerCase().startsWith('mar'))?.label.slice(0, 3) ?? 'Mar';
    const fg = dark ? '#f1f5f9' : '#0f172a';
    const fgSoft = dark ? '#cbd5e1' : '#475569';
    return {
      chart: { stacked: true, stackType: '100%' },
      colors: [...MODA_KEYS.map((m) => MODA[m].color), dark ? '#f8fafc' : '#0f172a'],
      stroke: { width: [0, 0, 0, 0, 0, 2.5] },
      legend: { position: 'top', horizontalAlign: 'left' },
      plotOptions: { bar: { horizontal: false, columnWidth: '58%' } },
      xaxis: { categories: months },
      yaxis: [
        ...MODA_KEYS.map((m) => ({
          seriesName: MODA[m].short,
          max: 100,
          labels: { formatter: (v: number) => `${Math.round(v)}%` },
        })),
        {
          seriesName: 'Total (jt)',
          opposite: true,
          labels: { formatter: (v: number) => `${v} jt` },
        },
      ],
      annotations: {
        xaxis: [
          {
            x: lebaran,
            borderColor: '#d97706',
            strokeDashArray: 4,
            label: {
              text: 'Lebaran',
              style: {
                color: '#fff',
                background: '#d97706',
                fontFamily: FONT,
                fontSize: '11px',
                fontWeight: 700,
              },
            },
          },
        ],
      },
      tooltip: {
        shared: true,
        custom: (opts: any) => {
          const r = monthly[opts.dataPointIndex];
          const rows = MODA_KEYS.map((m) => {
            const v = Number((((r[`share_${m}`] as number) ?? 0)).toFixed(1));
            return (
              `<div style="display:flex;align-items:center;gap:8px;margin-top:3px">` +
              `<span style="width:8px;height:8px;border-radius:50%;background:${MODA[m].color};flex-shrink:0"></span>` +
              `<span style="color:${fgSoft}">${MODA[m].short}</span>` +
              `<span style="margin-left:auto;font-family:${MONO};font-weight:700;color:${fg}">${v.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</span>` +
              `</div>`
            );
          }).join('');
          return (
            `<div style="padding:10px 12px;min-width:190px">` +
            `<div style="font-weight:800;margin-bottom:5px;color:${fg};font-family:${FONT}">${r.label} 2026</div>` +
            rows +
            `<div style="display:flex;align-items:center;gap:8px;margin-top:7px;padding-top:7px;border-top:1px solid ${dark ? '#1e293b' : '#e2e8f0'}">` +
            `<span style="width:8px;height:8px;border-radius:50%;background:${dark ? '#f8fafc' : '#0f172a'};flex-shrink:0"></span>` +
            `<span style="color:${fgSoft}">Total</span>` +
            `<span style="margin-left:auto;font-family:${MONO};font-weight:700;color:${fg}">${fmtCompact(r.TOTAL)} pnp</span>` +
            `</div></div>`
          );
        },
      },
    };
  }, [dark, monthly]);

  /* ---------- Perbandingan: Jan vs Sep ---------- */
  const bandingSeries = useMemo(
    (): ApexAxisChartSeries => {
      const jan = monthly[0];
      const sep = monthly[monthly.length - 1];
      return [
        {
          name: jan.label,
          type: 'bar',
          data: MODA_KEYS.map((m) => Number(((jan[`share_${m}`] as number) ?? 0).toFixed(1))),
        },
        {
          name: sep.label,
          type: 'bar',
          data: MODA_KEYS.map((m) => ({
            // horizontal bar: nilai pada sumbu x
            x: Number(((sep[`share_${m}`] as number) ?? 0).toFixed(1)),
            fillColor: MODA[m].color,
          })),
        },
      ];
    },
    [monthly],
  );

  const bandingOptions = useMemo<ApexOptions>(() => {
    const jan = monthly[0];
    const sep = monthly[monthly.length - 1];
    const dMap = {} as Record<ModaKey, number>;
    for (const m of MODA_KEYS) dMap[m] = (sep[`share_${m}`] as number) - (jan[`share_${m}`] as number);
    return {
      colors: [dark ? '#475569' : '#cbd5e1', '#94a3b8'],
      stroke: { width: 0 },
      legend: { position: 'top', horizontalAlign: 'left' },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          barHeight: '55%',
          dataLabels: { position: 'top' },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (_v: number, opts: any) =>
          opts.seriesIndex === 1 ? fmtPp(dMap[MODA_KEYS[opts.dataPointIndex]]) : '',
        style: {
          fontFamily: MONO,
          fontSize: '11px',
          fontWeight: 700,
          colors: [dark ? '#cbd5e1' : '#475569'],
        },
        offsetX: 10,
      },
      xaxis: { categories: MODA_KEYS.map((m) => MODA[m].label) },
      yaxis: {
        max: 40,
        labels: { formatter: (v: number) => `${v}%` },
      },
      grid: { padding: { right: 64 } },
      tooltip: {
        y: { formatter: (v: number) => `${v.toFixed(1)}%` },
      },
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
    <div className="space-y-5">
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
            <Chart type="donut" series={donutSeries} options={donutOptions} height={260} />
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
        <Card className="p-4 sm:p-5">
          <SectionHeader
            eyebrow="Tren"
            title="Pergeseran Preferensi Moda"
            desc="Stacked bar 100% per bulan (sumbu kiri) + garis total penumpang dalam juta (sumbu kanan). Garis putus-putus menandai Maret — bulan Lebaran 2026."
          />
          <Chart type="bar" series={trenSeries} options={trenOptions} height={360} />
        </Card>
      )}

      {mode === 'banding' && (
        <Card className="p-4 sm:p-5">
          <SectionHeader
            eyebrow="Perbandingan"
            title={`${monthly[0].label} vs ${monthly[monthly.length - 1].label} 2026`}
            desc="Share tiap moda di awal vs akhir periode. Angka di kanan bar menunjukkan perubahan dalam poin persentase (pp)."
          />
          <Chart type="bar" series={bandingSeries} options={bandingOptions} height={300} />
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
