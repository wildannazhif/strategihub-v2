<script lang="ts">
  import { data } from '$lib/data';
  import { fmtInt, fmtCompact, fmtPct, fmtDate } from '$lib/format';
  import Card from '$lib/components/Card.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import Users from 'lucide-svelte/icons/users';
  import Bus from 'lucide-svelte/icons/bus';
  import ArrowDownToLine from 'lucide-svelte/icons/arrow-down-to-line';
  import ArrowUpFromLine from 'lucide-svelte/icons/arrow-up-from-line';
  import Table2 from 'lucide-svelte/icons/table-2';
  import Sigma from 'lucide-svelte/icons/sigma';
  import type { MetricSummary } from '$lib/data/types';

  const MAIN_KEYS = ['pnp_tot', 'pnp_dat', 'pnp_brg', 'arm_tot', 'arm_dat', 'arm_brg'] as const;
  type MainKey = (typeof MAIN_KEYS)[number];

  const ICONS: Record<MainKey, typeof Users> = {
    pnp_tot: Users,
    pnp_dat: ArrowDownToLine,
    pnp_brg: ArrowUpFromLine,
    arm_tot: Bus,
    arm_dat: ArrowDownToLine,
    arm_brg: ArrowUpFromLine,
  };

  const ACCENTS: Record<MainKey, string> = {
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

  const ms = data.metrics_summary;
  const meta = data.meta;

  const d = $derived.by(() => {
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
        const m: MetricSummary = ms[k];
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
  });
</script>

<div class="space-y-4">
  <div>
    <p class="text-[11px] font-bold uppercase tracking-[0.14em] text-sky-400">Indikator</p>
    <h2 class="mt-0.5 text-xl font-extrabold tracking-tight text-ink">Matriks 13 Indikator</h2>
    <p class="mt-1 max-w-3xl text-[13px] text-ink-3">
      6 metrik dasar pergerakan penumpang &amp; armada plus 7 indikator turunan — YTD, rata-rata
      harian, puncak, dan lonjakan vs baseline Februari 2026.
    </p>
  </div>

  <!-- 6 kartu utama -->
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
    {#each MAIN_KEYS as k (k)}
      {@const m = ms[k] as MetricSummary}
      {@const Icon = ICONS[k]}
      {@const accent = ACCENTS[k]}
      <Card class="animate-fade-up p-4">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="text-[13px] font-bold text-ink">{m.label}</p>
            <p class="mt-1 font-mono text-[10.5px] text-ink-3">{m.formula}</p>
          </div>
          <span
            class="grid size-9 shrink-0 place-items-center rounded-xl"
            style={`background: ${accent}1f; color: ${accent}`}
          >
            <Icon size={18} />
          </span>
        </div>
        <p class="num mt-2.5 text-[26px] font-extrabold tracking-tight text-ink">
          {fmtCompact(m.ytd)}
        </p>
        <p class="text-[11px] text-ink-3">{m.unit} • akumulasi YTD</p>
        <div class="mt-3 grid grid-cols-2 gap-2.5 border-t border-line pt-3">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-ink-3">Rata-rata harian</p>
            <p class="num mt-1 text-[14px] font-bold text-ink">{fmtCompact(m.avg)}</p>
          </div>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-ink-3">Baseline Februari</p>
            <p class="num mt-1 text-[14px] font-bold text-ink">{fmtCompact(m.baseline_feb)}</p>
          </div>
          <div class="col-span-2 rounded-xl bg-fill p-2.5">
            <div class="flex items-center justify-between gap-2">
              <p class="text-[10px] font-bold uppercase tracking-wider text-ink-3">
                Puncak • {m.peak_tag}
              </p>
              <Badge color={surgeColor(m.peak_surge_pct)}>{fmtPct(m.peak_surge_pct)}</Badge>
            </div>
            <p class="num mt-1 text-[14px] font-bold text-ink">
              {fmtCompact(m.peak_val)}
              <span class="text-[11px] font-normal text-ink-3">{fmtDate(m.peak_date)}</span>
            </p>
          </div>
          <div class="col-span-2 rounded-xl bg-fill p-2.5">
            <div class="flex items-center justify-between gap-2">
              <p class="text-[10px] font-bold uppercase tracking-wider text-ink-3">
                Mudik • {m.mudik_tag}
              </p>
              <Badge color={surgeColor(m.mudik_surge_pct)}>{fmtPct(m.mudik_surge_pct)}</Badge>
            </div>
            <p class="num mt-1 text-[14px] font-bold text-ink">
              {fmtCompact(m.mudik_val)}
              <span class="text-[11px] font-normal text-ink-3">{fmtDate(m.mudik_date)}</span>
            </p>
          </div>
        </div>
      </Card>
    {/each}
  </div>

  <!-- 7 kartu turunan -->
  <div>
    <div class="mb-3">
      <p class="text-[11px] font-bold uppercase tracking-[0.14em] text-sky-400">Turunan</p>
      <h3 class="mt-0.5 text-[16px] font-extrabold tracking-tight text-ink">7 Indikator Turunan</h3>
      <p class="mt-1 text-[13px] text-ink-3">
        Dihitung dari 6 metrik dasar dan {meta.days_count} hari periode observasi.
      </p>
    </div>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each d.derived as c (c.id)}
        <Card class="animate-fade-up p-4">
          <div class="mb-2.5 h-1 w-10 rounded-full" style={`background: ${c.accent}`}></div>
          <p class="text-[12.5px] font-bold leading-snug text-ink-2">{c.label}</p>
          <p class="mt-1 font-mono text-[10.5px] text-ink-3">{c.formula}</p>
          <p class="num mt-2.5 text-[22px] font-extrabold tracking-tight" style={`color: ${c.accent}`}>
            {c.value}
          </p>
          <p class="mt-1.5 text-[11.5px] leading-relaxed text-ink-3">{c.desc}</p>
        </Card>
      {/each}
      <Card class="flex flex-col justify-center border-sky-400/25 bg-sky-400/[0.06] p-4">
        <p class="text-[13px] font-bold text-ink">13 indikator terpantau</p>
        <p class="mt-1 text-[12px] leading-relaxed text-ink-3">
          6 metrik dasar + 7 turunan, konsisten memakai definisi formula yang sama dengan tabel
          matriks di bawah.
        </p>
      </Card>
    </div>
  </div>

  <!-- Tabel matriks -->
  <Card class="p-4 sm:p-5">
    <CardHeader
      title="Tabel Perbandingan 13 Indikator"
      subtitle="Gulir horizontal di layar kecil • header menempel saat menggulir vertikal"
    >
      {#snippet icon()}<Table2 size={16} />{/snippet}
    </CardHeader>
    <div class="max-h-[560px] overflow-auto rounded-xl border border-line">
      <table class="w-full min-w-[980px] text-left text-[13px]">
        <thead class="sticky top-0 z-10">
          <tr class="border-y border-line bg-fill">
            {#each ['Indikator', 'Formula', 'YTD', 'Rata-rata', 'Puncak', 'Lonjakan'] as h (h)}
              <th
                class="whitespace-nowrap px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-3"
              >
                {h}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each d.matrix as r (r.indikator)}
            <tr class="border-b border-line transition-colors hover:bg-fill">
              <td class="px-4 py-2.5 font-bold text-ink">{r.indikator}</td>
              <td class="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-ink-3">
                {r.formula}
              </td>
              <td class="num whitespace-nowrap px-4 py-2.5 font-semibold text-ink-2">{r.ytd}</td>
              <td class="num whitespace-nowrap px-4 py-2.5 text-ink-3">{r.avg}</td>
              <td class="num whitespace-nowrap px-4 py-2.5 text-ink-3">{r.puncak}</td>
              <td class="num whitespace-nowrap px-4 py-2.5 font-bold text-rose-400">{r.lonjakan}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="mt-3 text-[12px] text-ink-3">
      Lonjakan = persentase kenaikan vs rata-rata harian Februari 2026 (baseline hari normal).
    </p>
  </Card>

  <!-- Catatan metodologi ringkas -->
  <Card class="p-4 sm:p-5">
    <CardHeader title="Catatan Metodologi" subtitle="Definisi yang dipakai konsisten di seluruh modul">
      {#snippet icon()}<Sigma size={16} />{/snippet}
    </CardHeader>
    <ul class="grid grid-cols-1 gap-2.5 text-[12.5px] leading-relaxed text-ink-2 md:grid-cols-2">
      <li class="flex gap-2">
        <span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-sky-400"></span>
        <span><strong class="text-ink">YTD</strong> — akumulasi 1 Jan s.d. 29 Sep 2026 ({meta.days_count} hari, {fmtInt(meta.total_clean_rows)} baris terverifikasi).</span>
      </li>
      <li class="flex gap-2">
        <span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400"></span>
        <span><strong class="text-ink">Baseline Februari</strong> — rata-rata harian Februari sebagai acuan hari normal di luar musim mudik.</span>
      </li>
      <li class="flex gap-2">
        <span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-rose-400"></span>
        <span><strong class="text-ink">Lonjakan</strong> — (puncak − baseline) ÷ baseline × 100%.</span>
      </li>
      <li class="flex gap-2">
        <span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-400"></span>
        <span><strong class="text-ink">Load factor</strong> — rasio penumpang per trip armada (pnp/trip).</span>
      </li>
    </ul>
  </Card>
</div>
