import { useMemo } from 'react';
import { Plane, TrainFront, Bus, Ship, Anchor, Info, AlertTriangle } from 'lucide-react';
import Chart, { FONT, MONO } from '../components/Chart';
import { Card, SectionHeader, Badge } from '../components/ui';
import { useDark } from '../components/theme';
import { data, MODA_KEYS } from '../data';
import { MODA } from '../lib/moda';
import { fmtPct } from '../lib/format';
import type { ApexOptions, ApexAxisChartSeries } from 'apexcharts';

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

  /* ---------- Grouped bar: Normal / Mudik / Balik + ambang padat ---------- */
  const barSeries = useMemo(
    (): ApexAxisChartSeries => {
      const f = (v: number) => Number(v.toFixed(1));
      return [
        { name: 'Normal', type: 'bar', data: MODA_KEYS.map((m) => f(stats[m].baseline_lf)) },
        { name: 'Mudik', type: 'bar', data: MODA_KEYS.map((m) => f(stats[m].mudik_lf)) },
        { name: 'Balik', type: 'bar', data: MODA_KEYS.map((m) => f(stats[m].balik_lf)) },
      ];
    },
    [stats],
  );

  const barOptions = useMemo<ApexOptions>(
    () => ({
      colors: [dark ? '#64748b' : '#94a3b8', '#d97706', '#dc2626'],
      stroke: { width: 0 },
      legend: { position: 'top', horizontalAlign: 'left' },
      plotOptions: { bar: { horizontal: false, borderRadius: 6, columnWidth: '55%' } },
      xaxis: { categories: MODA_KEYS.map((m) => MODA[m].short) },
      yaxis: {
        title: {
          text: 'pnp / trip',
          style: {
            fontFamily: FONT,
            fontSize: '11px',
            fontWeight: 600,
            color: dark ? '#94a3b8' : '#64748b',
          },
        },
      },
      annotations: {
        yaxis: [
          {
            y: 100,
            borderColor: '#7c3aed',
            strokeDashArray: 4,
            label: {
              text: 'Ambang padat (100)',
              style: {
                color: '#fff',
                background: '#7c3aed',
                fontFamily: FONT,
                fontSize: '11px',
                fontWeight: 700,
              },
            },
          },
        ],
      },
      tooltip: {
        y: {
          formatter: (v: number) =>
            `${v.toLocaleString('id-ID', { maximumFractionDigits: 1 })} pnp/trip`,
        },
      },
    }),
    [dark, stats],
  );

  const asdp = stats.ASDP;

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Kinerja"
        title="Kinerja Load Factor"
        desc="Kepadatan tiap moda transportasi: Normal vs Mudik vs Balik Lebaran 2026. Garis ungu menandai ambang padat 100 penumpang per trip armada."
      />

      {/* Penjelasan konsep */}
      <Card className="p-4 sm:p-5">
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
          const color = gaugeColor(s.peak_lf);
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
              <Chart
                type="radialBar"
                height={150}
                series={[Math.min(100, (s.peak_lf / 300) * 100)]}
                options={{
                  colors: [color],
                  chart: { toolbar: { show: false } },
                  plotOptions: {
                    radialBar: {
                      startAngle: -90,
                      endAngle: 90,
                      hollow: { size: '62%' },
                      track: { background: dark ? '#1e293b' : '#e2e8f0' },
                      dataLabels: {
                        name: { show: false },
                        value: {
                          fontFamily: MONO,
                          fontSize: '20px',
                          fontWeight: 700,
                          color: dark ? '#f1f5f9' : '#0f172a',
                          formatter: () => s.peak_lf.toFixed(1),
                        },
                      },
                    },
                  },
                  stroke: { lineCap: 'round' },
                  tooltip: { enabled: false },
                  legend: { show: false },
                }}
              />
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
      <Card className="p-4 sm:p-5">
        <SectionHeader
          eyebrow="Perbandingan"
          title="Normal vs Mudik vs Balik per Moda"
          desc="Tiga bar per moda dalam satuan penumpang per trip armada. Garis putus-putus ungu = ambang padat 100 pnp/trip."
        />
        <Chart type="bar" series={barSeries} options={barOptions} height={320} />
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
