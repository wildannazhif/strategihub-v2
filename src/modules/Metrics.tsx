import { useMemo, type ReactNode } from 'react';
import { Users, Bus, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Card, SectionHeader, Badge } from '../components/ui';
import { data } from '../data';
import { fmtInt, fmtCompact, fmtPct, fmtDate } from '../lib/format';
import type { MetricSummary } from '../data/types';

const MAIN_KEYS = ['pnp_tot', 'pnp_dat', 'pnp_brg', 'arm_tot', 'arm_dat', 'arm_brg'] as const;

const ICONS: Record<(typeof MAIN_KEYS)[number], ReactNode> = {
  pnp_tot: <Users size={18} />,
  pnp_dat: <ArrowDownToLine size={18} />,
  pnp_brg: <ArrowUpFromLine size={18} />,
  arm_tot: <Bus size={18} />,
  arm_dat: <ArrowDownToLine size={18} />,
  arm_brg: <ArrowUpFromLine size={18} />,
};

const ACCENTS: Record<(typeof MAIN_KEYS)[number], string> = {
  pnp_tot: '#0284c7',
  pnp_dat: '#0ea5e9',
  pnp_brg: '#0369a1',
  arm_tot: '#16a34a',
  arm_dat: '#22c55e',
  arm_brg: '#15803d',
};

const fmt1 = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 1 });
const fmt2 = (n: number) =>
  n.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function surgeColor(pct: number): string {
  if (pct >= 80) return '#dc2626';
  if (pct >= 40) return '#ea580c';
  return '#d97706';
}

/* ---------- Kartu indikator utama ---------- */
function MetricCard({ m, accent, icon }: { m: MetricSummary; accent: string; icon: ReactNode }) {
  return (
    <Card className="animate-fade-up p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100">{m.label}</p>
          <p className="mt-1 font-mono text-[11px] text-slate-400 dark:text-slate-500">{m.formula}</p>
        </div>
        <span
          className="grid size-9 shrink-0 place-items-center rounded-xl"
          style={{ background: `${accent}1a`, color: accent }}
        >
          {icon}
        </span>
      </div>
      <p className="num mt-3 text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">
        {fmtCompact(m.ytd)}
      </p>
      <p className="text-[11.5px] text-slate-400">
        {m.unit} • akumulasi YTD
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            Rata-rata harian
          </p>
          <p className="num mt-1 text-[15px] font-bold text-slate-800 dark:text-slate-100">
            {fmtCompact(m.avg)}
          </p>
        </div>
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            Baseline Februari
          </p>
          <p className="num mt-1 text-[15px] font-bold text-slate-800 dark:text-slate-100">
            {fmtCompact(m.baseline_feb)}
          </p>
        </div>
        <div className="col-span-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              Puncak • {m.peak_tag}
            </p>
            <Badge color={surgeColor(m.peak_surge_pct)}>{fmtPct(m.peak_surge_pct)}</Badge>
          </div>
          <p className="num mt-1 text-[15px] font-bold text-slate-800 dark:text-slate-100">
            {fmtCompact(m.peak_val)}{' '}
            <span className="text-[11px] font-normal text-slate-400">{fmtDate(m.peak_date)}</span>
          </p>
        </div>
        <div className="col-span-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              Mudik • {m.mudik_tag}
            </p>
            <Badge color={surgeColor(m.mudik_surge_pct)}>{fmtPct(m.mudik_surge_pct)}</Badge>
          </div>
          <p className="num mt-1 text-[15px] font-bold text-slate-800 dark:text-slate-100">
            {fmtCompact(m.mudik_val)}{' '}
            <span className="text-[11px] font-normal text-slate-400">{fmtDate(m.mudik_date)}</span>
          </p>
        </div>
      </div>
    </Card>
  );
}

/* ================= MetricsView ================= */
export default function MetricsView() {
  const ms = data.metrics_summary;
  const meta = data.meta;

  const d = useMemo(() => {
    const pnp = ms.pnp_tot;
    const pnpD = ms.pnp_dat;
    const pnpB = ms.pnp_brg;
    const arm = ms.arm_tot;
    const armD = ms.arm_dat;
    const armB = ms.arm_brg;

    const rasioPnp = pnpD.ytd / pnpB.ytd;
    const rasioPnpPeak = pnpD.peak_val / pnpB.peak_val;
    const rasioArm = armD.ytd / armB.ytd;
    const rasioArmPeak = armD.peak_val / armB.peak_val;
    const lfNas = pnp.ytd / arm.ytd;
    const lfBase = pnp.baseline_feb / arm.baseline_feb;
    const lfPeak = pnp.peak_val / arm.peak_val;
    const lfSurge = ((lfPeak - lfBase) / lfBase) * 100;
    const mudikShare = (pnp.mudik_val / pnp.ytd) * 100;
    const peakGrowth = ((pnp.peak_val - pnp.baseline_feb) / pnp.baseline_feb) * 100;

    const derived = [
      {
        id: 'rasio_pnp',
        label: 'Rasio Datang : Berangkat — Penumpang',
        formula: 'pnp_dat.ytd ÷ pnp_brg.ytd',
        value: `${fmt2(rasioPnp)} : 1`,
        desc: 'Imbangan arus dua arah penumpang sepanjang YTD.',
        accent: '#0284c7',
      },
      {
        id: 'rasio_arm',
        label: 'Rasio Datang : Berangkat — Armada',
        formula: 'arm_dat.ytd ÷ arm_brg.ytd',
        value: `${fmt2(rasioArm)} : 1`,
        desc: 'Imbangan trip armada dua arah sepanjang YTD.',
        accent: '#16a34a',
      },
      {
        id: 'lf_nas',
        label: 'Load Factor Nasional',
        formula: 'pnp_tot.ytd ÷ arm_tot.ytd',
        value: `${fmt1(lfNas)} pnp/trip`,
        desc: 'Rata-rata penumpang yang terangkut per trip armada.',
        accent: '#7c3aed',
      },
      {
        id: 'lf_peak',
        label: 'Load Factor Puncak',
        formula: 'pnp_tot.peak_val ÷ arm_tot.peak_val',
        value: `${fmt1(lfPeak)} pnp/trip`,
        desc: `Kepadatan pada hari puncak — ${fmtPct(lfSurge)} vs baseline Februari.`,
        accent: '#dc2626',
      },
      {
        id: 'mudik_share',
        label: 'Pangsa Mudik vs YTD',
        formula: 'pnp_tot.mudik_val ÷ pnp_tot.ytd × 100%',
        value: `${fmt1(mudikShare)}%`,
        desc: `Kontribusi hari puncak mudik ${fmtDate(pnp.mudik_date)} terhadap total YTD.`,
        accent: '#d97706',
      },
      {
        id: 'peak_growth',
        label: 'Pertumbuhan Puncak vs Baseline',
        formula: '(puncak − baseline Feb) ÷ baseline Feb',
        value: fmtPct(peakGrowth),
        desc: 'Kenaikan hari tersibuk dibanding rata-rata harian Februari.',
        accent: '#0891b2',
      },
      {
        id: 'intensitas',
        label: 'Intensitas Armada',
        formula: `arm_tot.ytd ÷ ${meta.days_count} hari`,
        value: `${fmtInt(arm.avg)} trip/hari`,
        desc: 'Rata-rata trip armada yang beroperasi setiap hari.',
        accent: '#4d7c0f',
      },
    ];

    const matrix = [
      ...MAIN_KEYS.map((k) => {
        const m = ms[k];
        return {
          indikator: m.label,
          formula: m.formula,
          ytd: `${fmtInt(m.ytd)} ${m.unit}`,
          avg: `${fmtInt(m.avg)} /hari`,
          puncak: `${fmtDate(m.peak_date)} • ${fmtInt(m.peak_val)}`,
          lonjakan: fmtPct(m.peak_surge_pct),
        };
      }),
      {
        indikator: 'Rasio Datang : Berangkat — Penumpang',
        formula: 'pnp_dat.ytd ÷ pnp_brg.ytd',
        ytd: `${fmt2(rasioPnp)} : 1`,
        avg: '–',
        puncak: `${fmtDate(pnpD.peak_date)} • ${fmt2(rasioPnpPeak)} : 1`,
        lonjakan: '–',
      },
      {
        indikator: 'Rasio Datang : Berangkat — Armada',
        formula: 'arm_dat.ytd ÷ arm_brg.ytd',
        ytd: `${fmt2(rasioArm)} : 1`,
        avg: '–',
        puncak: `${fmtDate(armD.peak_date)} • ${fmt2(rasioArmPeak)} : 1`,
        lonjakan: '–',
      },
      {
        indikator: 'Load Factor Nasional',
        formula: 'pnp_tot.ytd ÷ arm_tot.ytd',
        ytd: `${fmt1(lfNas)} pnp/trip`,
        avg: `${fmt1(lfNas)} pnp/trip`,
        puncak: `${fmtDate(pnp.peak_date)} • ${fmt1(lfPeak)} pnp/trip`,
        lonjakan: fmtPct(lfSurge),
      },
      {
        indikator: 'Load Factor Puncak',
        formula: 'pnp_tot.peak_val ÷ arm_tot.peak_val',
        ytd: '–',
        avg: `${fmt1(lfBase)} pnp/trip`,
        puncak: `${fmtDate(pnp.peak_date)} • ${fmt1(lfPeak)} pnp/trip`,
        lonjakan: fmtPct(lfSurge),
      },
      {
        indikator: 'Pangsa Mudik vs YTD',
        formula: 'pnp_tot.mudik_val ÷ pnp_tot.ytd × 100%',
        ytd: '–',
        avg: '–',
        puncak: `${fmtDate(pnp.mudik_date)} • ${fmtInt(pnp.mudik_val)} pnp`,
        lonjakan: `${fmt1(mudikShare)}% dari YTD`,
      },
      {
        indikator: 'Pertumbuhan Puncak vs Baseline',
        formula: '(puncak − baseline Feb) ÷ baseline Feb',
        ytd: '–',
        avg: `${fmtInt(pnp.baseline_feb)} /hari`,
        puncak: `${fmtDate(pnp.peak_date)} • ${fmtInt(pnp.peak_val)}`,
        lonjakan: fmtPct(peakGrowth),
      },
      {
        indikator: 'Intensitas Armada',
        formula: `arm_tot.ytd ÷ ${meta.days_count} hari`,
        ytd: '–',
        avg: `${fmtInt(arm.avg)} trip/hari`,
        puncak: `${fmtDate(arm.peak_date)} • ${fmtInt(arm.peak_val)} trip`,
        lonjakan: fmtPct(arm.peak_surge_pct),
      },
    ];

    return { derived, matrix };
  }, [ms, meta]);

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="Indikator"
        title="Matriks 13 Indikator"
        desc="6 metrik dasar pergerakan penumpang & armada plus 7 indikator turunan — YTD, rata-rata harian, puncak, dan lonjakan vs baseline Februari 2026."
      />

      {/* 6 kartu utama */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MAIN_KEYS.map((k) => (
          <MetricCard key={k} m={ms[k]} accent={ACCENTS[k]} icon={ICONS[k]} />
        ))}
      </div>

      {/* 7 kartu turunan */}
      <div>
        <div className="mb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-kemenhub-600 dark:text-kemenhub-300">
            Turunan
          </p>
          <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            7 Indikator Turunan
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Dihitung dari 6 metrik dasar dan {meta.days_count} hari periode observasi.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {d.derived.map((c) => (
            <Card key={c.id} className="animate-fade-up p-5">
              <div
                className="mb-3 h-1 w-10 rounded-full"
                style={{ background: c.accent }}
              />
              <p className="text-[12.5px] font-bold leading-snug text-slate-700 dark:text-slate-200">
                {c.label}
              </p>
              <p className="mt-1 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                {c.formula}
              </p>
              <p
                className="num mt-3 text-[24px] font-extrabold tracking-tight"
                style={{ color: c.accent }}
              >
                {c.value}
              </p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-400">{c.desc}</p>
            </Card>
          ))}
          <Card className="flex flex-col justify-center bg-gradient-to-br from-kemenhub-700 to-kemenhub-900 p-5 text-white dark:from-kemenhub-800 dark:to-slate-900">
            <p className="text-[13px] font-bold">13 indikator terpantau</p>
            <p className="mt-1 text-[12px] leading-relaxed text-white/70">
              6 metrik dasar + 7 turunan, konsisten memakai definisi formula yang sama dengan
              tabel matriks di bawah.
            </p>
          </Card>
        </div>
      </div>

      {/* Tabel matriks */}
      <Card className="p-5">
        <SectionHeader
          eyebrow="Matriks"
          title="Tabel Perbandingan 13 Indikator"
          desc="Gulir horizontal di layar kecil • header menempel saat menggulir vertikal"
        />
        <div className="max-h-[560px] overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[980px] text-left text-[13px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-100 dark:bg-slate-800">
                {['Indikator', 'Formula', 'YTD', 'Rata-rata', 'Puncak', 'Lonjakan'].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.matrix.map((r, i) => (
                <tr
                  key={r.indikator}
                  className={`border-t border-slate-100 dark:border-slate-800/60 ${
                    i % 2 === 1 ? 'bg-slate-50/70 dark:bg-slate-800/30' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                    {r.indikator}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[11.5px] text-slate-500 dark:text-slate-400">
                    {r.formula}
                  </td>
                  <td className="num whitespace-nowrap px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                    {r.ytd}
                  </td>
                  <td className="num whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                    {r.avg}
                  </td>
                  <td className="num whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                    {r.puncak}
                  </td>
                  <td className="num whitespace-nowrap px-4 py-3 font-bold text-rose-600 dark:text-rose-400">
                    {r.lonjakan}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[12px] text-slate-400">
          Lonjakan = persentase kenaikan vs rata-rata harian Februari 2026 (baseline hari normal).
        </p>
      </Card>
    </div>
  );
}
