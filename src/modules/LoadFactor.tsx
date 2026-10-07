import { useMemo } from 'react';
import * as echarts from 'echarts/core';
import { GaugeChart } from 'echarts/charts';
import { Plane, TrainFront, Bus, Ship, Anchor, Info, AlertTriangle } from 'lucide-react';
import Chart, { baseTooltip, axisStyle, legendStyle, FONT, MONO } from '../components/Chart';
import { Card, SectionHeader, Badge } from '../components/ui';
import { useDark } from '../components/theme';
import { data, MODA_KEYS } from '../data';
import { MODA } from '../lib/moda';
import { fmtPct } from '../lib/format';
import type { EChartsCoreOption } from 'echarts/core';
import type { ModaKey } from '../data/types';

echarts.use([GaugeChart]);

const MODA_ICONS = {
  UDARA: <Plane size={18} />,
  KA: <TrainFront size={18} />,
  BUS: <Bus size={18} />,
  ASDP: <Ship size={18} />,
  LAUT: <Anchor size={18} />,
};

/** Warna gauge: hijau <100, kuning 100–200, merah >200 */
const gaugeColor = (v: number) => (v > 200 ? '#dc2626' : v >= 100 ? '#eab308' : '#16a34a');

const fmtLf = (v: number) => v.toLocaleString('id-ID', { maximumFractionDigits: 1 });

export default function LoadFactorView() {
  const dark = useDark();
  const stats = data.load_factor_stats;

  /* ---------- Gauge per moda (peak_lf, skala 0–300) ---------- */
  const gauges = useMemo(() => {
    const g = {} as Record<ModaKey, EChartsCoreOption>;
    for (const m of MODA_KEYS) {
      const v = stats[m].peak_lf;
      const color = gaugeColor(v);
      g[m] = {
        animationDuration: 800,
        series: [
          {
            type: 'gauge',
            min: 0,
            max: 300,
            radius: '100%',
            center: ['50%', '62%'],
            startAngle: 180,
            endAngle: 0,
            progress: { show: true, width: 14, roundCap: true, itemStyle: { color } },
            axisLine: { lineStyle: { width: 14, color: [[1, dark ? '#1e293b' : '#e2e8f0']] } },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            pointer: { show: false },
            anchor: { show: false },
            title: { show: false },
            detail: {
              valueAnimation: true,
              offsetCenter: [0, '-8%'],
              formatter: (val: number) => val.toFixed(1),
              fontFamily: MONO,
              fontSize: 26,
              fontWeight: 800,
              color,
            },
            data: [{ value: v }],
          },
        ],
      };
    }
    return g;
  }, [dark, stats]);

  /* ---------- Grouped bar: Normal / Mudik / Balik + ambang padat ---------- */
  const barOption = useMemo<EChartsCoreOption>(() => {
    const f = (v: number) => Number(v.toFixed(1));
    return {
      animationDuration: 900,
      tooltip: {
        ...baseTooltip(dark),
        valueFormatter: (v: unknown) =>
          typeof v === 'number' ? `${v.toLocaleString('id-ID', { maximumFractionDigits: 1 })} pnp/trip` : v,
      },
      legend: { ...legendStyle(dark), top: 0 },
      grid: { left: 8, right: 12, top: 44, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: MODA_KEYS.map((m) => MODA[m].short),
        ...axisStyle(dark),
      },
      yAxis: {
        type: 'value',
        name: 'pnp / trip',
        nameTextStyle: { color: dark ? '#94a3b8' : '#64748b', fontFamily: FONT, fontSize: 11 },
        ...axisStyle(dark),
      },
      series: [
        {
          name: 'Normal',
          type: 'bar' as const,
          data: MODA_KEYS.map((m) => f(stats[m].baseline_lf)),
          itemStyle: { color: dark ? '#64748b' : '#94a3b8', borderRadius: [6, 6, 0, 0] },
          barWidth: 20,
        },
        {
          name: 'Mudik',
          type: 'bar' as const,
          data: MODA_KEYS.map((m) => f(stats[m].mudik_lf)),
          itemStyle: { color: '#d97706', borderRadius: [6, 6, 0, 0] },
          barWidth: 20,
        },
        {
          name: 'Balik',
          type: 'bar' as const,
          data: MODA_KEYS.map((m) => f(stats[m].balik_lf)),
          itemStyle: { color: '#dc2626', borderRadius: [6, 6, 0, 0] },
          barWidth: 20,
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: '#7c3aed', type: 'dashed' as const, width: 1.5 },
            label: {
              color: '#7c3aed',
              fontFamily: FONT,
              fontSize: 11,
              fontWeight: 700,
              position: 'insideEndTop' as const,
              formatter: 'Ambang padat (100)',
            },
            data: [{ yAxis: 100 }],
          },
        },
      ],
    };
  }, [dark, stats]);

  const asdp = stats.ASDP;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Kinerja"
        title="Kinerja Load Factor"
        desc="Kepadatan tiap moda transportasi: Normal vs Mudik vs Balik Lebaran 2026. Garis ungu menandai ambang padat 100 penumpang per trip armada."
      />

      {/* Penjelasan konsep */}
      <Card className="p-5 sm:p-6">
        <div className="flex gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Info size={20} />
          </span>
          <div>
            <p className="text-[15px] font-bold text-slate-900 dark:text-white">Apa itu load factor?</p>
            <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              Load factor di sini dihitung sebagai <strong className="text-slate-700 dark:text-slate-200">rasio P/A</strong> —
              jumlah penumpang per satu trip armada. Semakin tinggi angkanya, semakin padat isi tiap keberangkatan:
              nilai 100 berarti rata-rata 100 penumpang per trip, sedangkan nilai di atas 200 menandakan kepadatan
              ekstrem yang mendekati atau melampaui kapasitas nyaman armada.
            </p>
          </div>
        </div>
      </Card>

      {/* 5 kartu moda */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {MODA_KEYS.map((m) => {
          const s = stats[m];
          const surgeColor = s.surge_lf_pct >= 100 ? '#dc2626' : s.surge_lf_pct >= 50 ? '#ea580c' : '#16a34a';
          const rows: Array<[string, number]> = [
            ['Normal', s.baseline_lf],
            ['Mudik', s.mudik_lf],
            ['Balik', s.balik_lf],
          ];
          return (
            <Card key={m} className="flex flex-col p-5">
              <div className="flex items-center gap-2.5">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-xl"
                  style={{ background: MODA[m].colorSoft, color: MODA[m].color }}
                >
                  {MODA_ICONS[m]}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-slate-800 dark:text-slate-100">
                    {MODA[m].label}
                  </p>
                  <p className="num text-[11px] text-slate-500 dark:text-slate-400">
                    puncak {fmtLf(s.peak_lf)} pnp/trip
                  </p>
                </div>
              </div>
              <Chart option={gauges[m]} height={150} />
              <div className="mt-1 space-y-1.5">
                {rows.map(([label, v]) => (
                  <div key={label} className="flex items-center justify-between text-[12.5px]">
                    <span className="text-slate-500 dark:text-slate-400">{label}</span>
                    <span className="num font-bold text-slate-800 dark:text-slate-100">
                      {fmtLf(v)} <span className="font-normal text-slate-400">pnp/trip</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                <Badge color={surgeColor}>{fmtPct(s.surge_lf_pct)} vs normal</Badge>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Grafik utama */}
      <Card className="p-5 sm:p-6">
        <SectionHeader
          eyebrow="Perbandingan"
          title="Normal vs Mudik vs Balik per Moda"
          desc="Tiga bar per moda dalam satuan penumpang per trip armada. Garis putus-putus ungu = ambang padat 100 pnp/trip."
        />
        <Chart option={barOption} height={400} />
      </Card>

      {/* Sorotan ASDP */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-purple-700 via-purple-900 to-slate-950 p-6 text-white sm:p-7">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 85% 15%, rgba(192,132,252,.3), transparent 45%), radial-gradient(circle at 10% 90%, rgba(56,189,248,.18), transparent 40%)',
          }}
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-purple-200">
            <AlertTriangle size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-purple-300">
              Sorotan Ekstrem
            </p>
            <h3 className="mt-1 text-xl font-extrabold tracking-tight">
              ASDP Penyeberangan: {fmtLf(asdp.peak_lf)} penumpang per trip
            </h3>
            <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-slate-300">
              Lonjakan <strong className="text-white">{fmtPct(asdp.surge_lf_pct)}</strong> dibanding kondisi
              normal — dari {fmtLf(asdp.baseline_lf)} menjadi {fmtLf(asdp.peak_lf)} pnp/trip. Kapal feri tidak
              bisa ditambah secepat bus: armada terbatas, satu kapal melayani ratusan penumpang sekaligus, dan
              jadwal sandar terikat alur pelayaran. Akibatnya saat arus mudik–balik Lebaran, penumpang menumpuk
              di kantong-kantong pelabuhan (Merak–Bakauheni, Ketapang–Gilimanuk) dan antrean kendaraan mengular
              hingga berjam-jam. Inilah titik paling kritis seluruh sistem angkutan Lebaran 2026.
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-3 gap-6 sm:grid-cols-1 sm:gap-3 sm:text-right">
            {(
              [
                ['Normal', asdp.baseline_lf],
                ['Mudik', asdp.mudik_lf],
                ['Balik', asdp.balik_lf],
              ] as Array<[string, number]>
            ).map(([label, v]) => (
              <div key={label}>
                <p className="num text-2xl font-extrabold text-purple-200">{fmtLf(v)}</p>
                <p className="text-[11px] text-slate-400">{label} • pnp/trip</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
