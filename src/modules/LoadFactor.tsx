import { useMemo } from 'react';
import { Plane, TrainFront, Bus, Ship, Anchor, AlertTriangle, Gauge } from 'lucide-react';
import { Card, CardHeader } from '../components/ui';
import { useDark } from '../components/theme';
import { data, MODA_KEYS } from '../data';
import { MODA } from '../lib/moda';
import { fmtPct } from '../lib/format';

const MODA_ICONS = {
  UDARA: <Plane size={16} />,
  KA: <TrainFront size={16} />,
  BUS: <Bus size={16} />,
  ASDP: <Ship size={16} />,
  LAUT: <Anchor size={16} />,
};

/** Skala visual: 0–300 pnp/trip */
const SCALE_MAX = 300;
/** Warna bar: hijau <100, kuning 100–200, merah >200 */
const barColor = (v: number) => (v > 200 ? '#dc2626' : v >= 100 ? '#eab308' : '#16a34a');
const surgeColor = (v: number) => (v >= 100 ? '#dc2626' : v >= 50 ? '#ea580c' : '#16a34a');

const fmtLf = (v: number) => v.toLocaleString('id-ID', { maximumFractionDigits: 1 });

export default function LoadFactorView() {
  const dark = useDark();
  const stats = data.load_factor_stats;

  const rows = useMemo(
    () =>
      [...MODA_KEYS]
        .map((m) => ({ m, s: stats[m] }))
        .sort((a, b) => b.s.peak_lf - a.s.peak_lf),
    [stats],
  );

  const asdp = stats.ASDP;
  const maxPeak = Math.max(...MODA_KEYS.map((m) => stats[m].peak_lf));

  return (
    <div className="space-y-4">
      {/* Satu tabel padat menggantikan 5 kartu gauge */}
      <Card className="overflow-hidden">
        <div className="p-4 pb-2 sm:px-5 sm:pt-4">
          <CardHeader
            icon={<Gauge size={16} />}
            title="Load Factor per Moda"
            action={
              <span className="text-[11px] text-slate-400">
                Rasio penumpang per trip armada (pnp/trip) • ambang padat 100
              </span>
            }
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/70 text-[10.5px] uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-4 py-2 font-bold sm:px-5">Moda</th>
                <th className="px-2 py-2 text-right font-bold">Normal</th>
                <th className="px-2 py-2 text-right font-bold">Mudik</th>
                <th className="px-2 py-2 text-right font-bold">Balik</th>
                <th className="px-2 py-2 text-right font-bold">Puncak</th>
                <th className="px-2 py-2 text-right font-bold">vs Normal</th>
                <th className="hidden px-4 py-2 font-bold sm:px-5 md:table-cell" style={{ width: '26%' }}>
                  Tingkat kepadatan
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ m, s }) => (
                <tr
                  key={m}
                  className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                >
                  <td className="px-4 py-2.5 sm:px-5">
                    <div className="flex items-center gap-2">
                      <span
                        className="grid size-7 shrink-0 place-items-center rounded-lg"
                        style={{ background: MODA[m].colorSoft, color: MODA[m].color }}
                      >
                        {MODA_ICONS[m]}
                      </span>
                      <span className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">
                        {MODA[m].label}
                      </span>
                    </div>
                  </td>
                  <td className="num px-2 py-2.5 text-right text-[12.5px] text-slate-500 dark:text-slate-400">
                    {fmtLf(s.baseline_lf)}
                  </td>
                  <td className="num px-2 py-2.5 text-right text-[12.5px] font-semibold text-slate-700 dark:text-slate-200">
                    {fmtLf(s.mudik_lf)}
                  </td>
                  <td className="num px-2 py-2.5 text-right text-[12.5px] font-semibold text-slate-700 dark:text-slate-200">
                    {fmtLf(s.balik_lf)}
                  </td>
                  <td
                    className="num px-2 py-2.5 text-right text-[13px] font-extrabold"
                    style={{ color: barColor(s.peak_lf) }}
                  >
                    {fmtLf(s.peak_lf)}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <span
                      className="num inline-block rounded-md px-1.5 py-0.5 text-[11px] font-bold"
                      style={{
                        background: `${surgeColor(s.surge_lf_pct)}1a`,
                        color: surgeColor(s.surge_lf_pct),
                      }}
                    >
                      {fmtPct(s.surge_lf_pct)}
                    </span>
                  </td>
                  <td className="hidden px-4 py-2.5 sm:px-5 md:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (s.peak_lf / SCALE_MAX) * 100)}%`,
                            background: barColor(s.peak_lf),
                          }}
                        />
                      </div>
                      <span className="num w-10 text-right text-[11px] text-slate-400">
                        {Math.round((s.peak_lf / maxPeak) * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-100 px-4 py-2.5 text-[11px] leading-relaxed text-slate-400 sm:px-5 dark:border-slate-800">
          Load factor = <strong className="text-slate-500 dark:text-slate-300">rasio P/A</strong> (penumpang per
          trip). Nilai 100 = 100 penumpang/trip; &gt;200 = kepadatan ekstrem. Diurutkan dari puncak tertinggi.
        </p>
      </Card>

      {/* Sorotan ASDP: strip ringkas, bukan kartu gradien besar */}
      <div
        className="flex items-center gap-3 rounded-xl border px-4 py-3"
        style={{
          borderColor: `${'#dc2626'}33`,
          background: dark ? 'rgba(220,38,38,.08)' : 'rgba(220,38,38,.05)',
        }}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
          <AlertTriangle size={18} />
        </span>
        <p className="text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300">
          <strong className="text-slate-800 dark:text-slate-100">Titik paling kritis: ASDP Penyeberangan</strong>
          {' — '}
          puncak <strong className="num text-rose-600 dark:text-rose-400">{fmtLf(asdp.peak_lf)} pnp/trip</strong>
          {' '}({fmtPct(asdp.surge_lf_pct)} vs normal {fmtLf(asdp.baseline_lf)}). Kapal feri tak bisa ditambah
          secepat bus — antrean menumpuk di Merak–Bakauheni & Ketapang–Gilimanuk.
        </p>
      </div>
    </div>
  );
}
