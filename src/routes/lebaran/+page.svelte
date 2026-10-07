<script lang="ts">
  import Flame from 'lucide-svelte/icons/flame';
  import Undo2 from 'lucide-svelte/icons/undo-2';
  import CalendarDays from 'lucide-svelte/icons/calendar-days';
  import type { ApexOptions } from 'apexcharts';
  import Chart from '$lib/components/Chart.svelte';
  import { FONT, MONO } from '$lib/components/chart-utils';
  import Card from '$lib/components/Card.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import KpiCard from '$lib/components/KpiCard.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import { data, MODA_KEYS } from '$lib/data';
  import { MODA, densityStatus } from '$lib/moda';
  import { fmtCompact, fmtInt, fmtPct, fmtDateShort } from '$lib/format';

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

  // Fase colors brightened for the dark-only design (accent palette)
  const FASE_META: Record<Fase, { label: string; color: string; bg: string }> = {
    mudik: { label: 'Mudik', color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
    'hari-h': { label: 'Hari-H', color: '#38bdf8', bg: 'rgba(56,189,248,.12)' },
    balik: { label: 'Balik', color: '#a78bfa', bg: 'rgba(167,139,250,.12)' },
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

  const days = data.lebaran_daily;
  const surge = data.surge_summary;

  const kpi = $derived.by(() => {
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
  });

  /* ---------- Grafik 1: multi-line + area per moda, 17 hari ---------- */
  const lineSeries: ApexOptions['series'] = $derived(
    MODA_KEYS.map((m) => ({ name: MODA[m].label, data: days.map((r) => r[m] as number) })),
  );

  const lineOptions: ApexOptions = $derived.by(() => {
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
      fill: { opacity: 0.18 },
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
  });

  /* ---------- Grafik 2: lonjakan per moda (grouped bar) ---------- */
  const surgeSeries: ApexOptions['series'] = $derived([
    { name: 'Mudik', data: MODA_KEYS.map((m) => surge[m].surge_mudik_pct) },
    { name: 'Balik I', data: MODA_KEYS.map((m) => surge[m].surge_balik1_pct) },
    { name: 'Balik II', data: MODA_KEYS.map((m) => surge[m].surge_balik2_pct) },
  ]);

  const surgeOptions: ApexOptions = $derived({
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
  });

  const densityBadges = $derived(
    MODA_KEYS.map((m) => {
      const s = surge[m];
      const max = Math.max(s.surge_mudik_pct, s.surge_balik1_pct, s.surge_balik2_pct);
      return { m, ...densityStatus(max), max };
    }),
  );

  const faseKeys = Object.keys(FASE_META) as Fase[];
</script>

<div class="space-y-4">
  <div>
    <p class="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">Lebaran 1447 H</p>
    <h1 class="mt-1 text-xl font-extrabold tracking-tight text-ink">Puncak Lebaran 2026</h1>
    <p class="mt-1 text-[13px] text-ink-3">
      Analisis 17 hari arus mudik dan balik, 13–29 Maret 2026 (H-8 hingga H+8, Hari-H 21 Maret).
    </p>
  </div>

  <!-- Strip fase H-8 s/d H+8 -->
  <Card class="p-4">
    <p class="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">Linimasa Fase</p>
    <div class="flex gap-1 overflow-x-auto pb-1">
      {#each days as r}
        {@const f = faseOf(r.date)}
        {@const fm = FASE_META[f]}
        {@const key = KEY_DAYS[r.date]}
        <div
          class="min-w-[52px] flex-1 rounded-xl px-1 py-2 text-center {key ? 'ring-2 ring-offset-1' : ''}"
          style={`background: ${fm.bg};${key ? ` --tw-ring-color: ${fm.color}; --tw-ring-offset-color: #0a101d;` : ''}`}
          title={`${fmtDateShort(r.date)} • ${fmtInt(r.TOTAL)} pnp`}
        >
          <p class="num text-[12px] font-extrabold" style={`color: ${fm.color}`}>
            {relLabel(r.date)}
          </p>
          <p class="num mt-0.5 text-[10.5px] text-ink-3">
            {r.date.slice(8, 10)} Mar
          </p>
          {#if key}
            <p class="mt-1 text-[9px] font-bold uppercase leading-tight" style={`color: ${fm.color}`}>
              {key}
            </p>
          {/if}
        </div>
      {/each}
    </div>
    <div class="mt-3 flex flex-wrap gap-2">
      {#each faseKeys as f}
        <Badge color={FASE_META[f].color}>
          {FASE_META[f].label}
          {f === 'mudik' ? ' • 13–20 Mar' : f === 'hari-h' ? ' • 21 Mar' : ' • 22–29 Mar'}
        </Badge>
      {/each}
    </div>
  </Card>

  <!-- KPI -->
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <KpiCard
      label="Puncak Mudik — H-3"
      value={`${fmtCompact(kpi.mudikVal)} pnp`}
      delta={kpi.mudikPct}
      deltaLabel="hari normal • 18 Mar 2026"
      accent="#f59e0b"
    >
      {#snippet icon()}<Flame size={18} />{/snippet}
    </KpiCard>
    <KpiCard
      label="Puncak Balik — H+3"
      value={`${fmtCompact(kpi.balikVal)} pnp`}
      delta={kpi.balikPct}
      deltaLabel="hari normal • 24 Mar 2026"
      accent="#a78bfa"
    >
      {#snippet icon()}<Undo2 size={18} />{/snippet}
    </KpiCard>
    <KpiCard
      label="Hari-H Lebaran"
      value={`${fmtCompact(kpi.hVal)} pnp`}
      sub={`21 Mar 2026 • titik terendah periode (baseline normal ${fmtCompact(kpi.baseline)} pnp)`}
      accent="#38bdf8"
    >
      {#snippet icon()}<CalendarDays size={18} />{/snippet}
    </KpiCard>
  </div>

  <!-- Grafik 1 -->
  <Card class="p-4">
    <CardHeader
      title="Arus Penumpang per Moda selama Lebaran"
      subtitle="Pin menandai puncak tiap moda. Zona kuning = arus mudik, zona ungu = arus balik."
    />
    <Chart type="area" series={lineSeries} options={lineOptions} height={300} />
  </Card>

  <!-- Grafik 2 -->
  <Card class="p-4">
    <CardHeader
      title="Lonjakan per Moda vs Hari Normal"
      subtitle="Persentase kenaikan tiap fase terhadap baseline harian normal."
    />
    <Chart type="bar" series={surgeSeries} options={surgeOptions} height={280} />
    <div class="mt-4 flex flex-wrap gap-2 border-t border-white/[0.07] pt-4">
      <span class="w-full text-[11.5px] font-bold uppercase tracking-wide text-ink-3">
        Status kepadatan (lonjakan tertinggi tiap moda)
      </span>
      {#each densityBadges as d}
        <span
          class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-bold"
          style={`background: ${d.bg}; color: ${d.color}`}
        >
          <span class="size-2 rounded-full" style={`background: ${MODA[d.m].color}`}></span>
          {MODA[d.m].short}: {d.label} ({fmtPct(d.max, 1)})
        </span>
      {/each}
    </div>
  </Card>

  <!-- Tabel 17 hari -->
  <Card class="p-4">
    <CardHeader
      title="Tabel Harian Periode Lebaran"
      subtitle="Gulir untuk melihat seluruh 17 hari."
    />
    <div class="max-h-[440px] overflow-auto rounded-xl border border-white/[0.07]">
      <table class="w-full min-w-[760px] border-collapse text-[12.5px]">
        <thead class="sticky top-0 z-10">
          <tr class="bg-white/[0.04]">
            <th class="px-3 py-2.5 text-left font-bold text-ink-2">Tanggal</th>
            <th class="px-3 py-2.5 text-left font-bold text-ink-2">Relatif</th>
            <th class="num px-3 py-2.5 text-right font-bold text-ink-2">Total</th>
            {#each MODA_KEYS as m}
              <th class="num px-3 py-2.5 text-right font-bold text-ink-2">
                {MODA[m].short}
              </th>
            {/each}
            <th class="px-3 py-2.5 text-left font-bold text-ink-2">Fase</th>
          </tr>
        </thead>
        <tbody>
          {#each days as r}
            {@const f = faseOf(r.date)}
            {@const fm = FASE_META[f]}
            <tr class="border-t border-white/[0.06] transition-colors hover:bg-white/[0.03]">
              <td class="whitespace-nowrap px-3 py-2 font-semibold text-ink-2">
                {fmtDateShort(r.date)}
              </td>
              <td class="num px-3 py-2 text-ink-3">{relLabel(r.date)}</td>
              <td class="num px-3 py-2 text-right font-bold text-ink">
                {fmtInt(r.TOTAL)}
              </td>
              {#each MODA_KEYS as m}
                <td class="num px-3 py-2 text-right text-ink-2">
                  {fmtCompact(r[m] as number)}
                </td>
              {/each}
              <td class="px-3 py-2">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                  style={`background: ${fm.bg}; color: ${fm.color}`}
                >
                  <span class="size-1.5 rounded-full" style={`background: ${fm.color}`}></span>
                  {fm.label}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </Card>
</div>
