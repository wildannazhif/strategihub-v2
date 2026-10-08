<script lang="ts">
  import type { ApexOptions } from 'apexcharts';
  import Chart from '$lib/components/Chart.svelte';
  import Card from '$lib/components/Card.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import KpiCard from '$lib/components/KpiCard.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import Segmented from '$lib/components/Segmented.svelte';
  import { FONT, MONO } from '$lib/components/chart-utils';
  import { data, MODA_KEYS } from '$lib/data';
  import { MODA } from '$lib/moda';
  import { fmtCompact, fmtInt, fmtPct, fmtDate } from '$lib/format';
  import { themeStore, chartTheme } from '$lib/theme.svelte';
  import type { ForecastPoint, ModaKey, SimpulRecommendation } from '$lib/data';
  import { base } from '$app/paths';
  import Users from 'lucide-svelte/icons/users';
  import TrendingUp from 'lucide-svelte/icons/trending-up';
  import Bus from 'lucide-svelte/icons/bus';
  import Star from 'lucide-svelte/icons/star';
  import CalendarDays from 'lucide-svelte/icons/calendar-days';
  import Flame from 'lucide-svelte/icons/flame';
  import Cpu from 'lucide-svelte/icons/cpu';
  import Database from 'lucide-svelte/icons/database';
  import CalendarClock from 'lucide-svelte/icons/calendar-clock';
  import Timer from 'lucide-svelte/icons/timer';
  import SlidersHorizontal from 'lucide-svelte/icons/sliders-horizontal';
  import Activity from 'lucide-svelte/icons/activity';
  import Info from 'lucide-svelte/icons/info';
  import LineChart from 'lucide-svelte/icons/line-chart';
  import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
  import ListChecks from 'lucide-svelte/icons/list-checks';
  import PieChartIcon from 'lucide-svelte/icons/pie-chart';
  import BookOpen from 'lucide-svelte/icons/book-open';
  import Search from 'lucide-svelte/icons/search';
  import ChevronLeft from 'lucide-svelte/icons/chevron-left';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';

  type ScenarioKey = 'moderat' | 'optimis' | 'konservatif';

  const SCENARIOS: { key: ScenarioKey; label: string; color: string; desc: string }[] = [
    {
      key: 'moderat', label: 'Moderat', color: '#38bdf8',
      desc: 'Skenario basis (faktor 1,00) — proyeksi mengikuti pola historis model Holt-Winters tanpa asumsi kebijakan tambahan.',
    },
    {
      key: 'optimis', label: 'Optimis', color: '#34d399',
      desc: 'Faktor 1,07 — animo masyarakat tinggi, stimulus pariwisata, dan penambahan kapasitas armada selama Nataru.',
    },
    {
      key: 'konservatif', label: 'Konservatif', color: '#fb7185',
      desc: 'Faktor 0,95 — animo melemah atau adanya pembatasan operasional pada periode Natal dan Tahun Baru.',
    },
  ];

  interface ScenPoint {
    date: string;
    TOTAL: number;
    ci_lower: number;
    ci_upper: number;
    pnp_2025: number;
    yoy_pct: number;
  }

  function asArray(s: ForecastPoint[] | { daily?: ForecastPoint[] } | undefined): ForecastPoint[] {
    if (!s) return [];
    return Array.isArray(s) ? s : (s.daily ?? []);
  }

  interface ModeBreakdown {
    passengers_2026: number;
    yoy_pct: number;
    share_pct_2026: number;
  }

  const fmtDay = (v: string | number) =>
    typeof v === 'string' ? v.slice(5).replace('-', '/') : String(v);

  let scen = $state<ScenarioKey>('moderat');
  const fn = data.forecast_nataru;
  const meta = fn.meta;

  const summary = $derived(fn.summaries[scen]);
  const pts = $derived<ScenPoint[]>(
    asArray(fn.scenarios[scen]).map((d) => ({
      date: String(d.date),
      TOTAL: Number(d.TOTAL),
      ci_lower: Number(d.ci_lower),
      ci_upper: Number(d.ci_upper),
      pnp_2025: Number(d.pnp_2025),
      yoy_pct: Number(d.yoy_pct),
    })),
  );

  const peak = $derived<ScenPoint>(
    pts.reduce((a, b) => (b.TOTAL > a.TOTAL ? b : a), pts[0] ?? ({ date: '', TOTAL: 0 } as ScenPoint)),
  );

  const breakdown = $derived(
    (summary as unknown as { mode_breakdown?: Record<string, ModeBreakdown> }).mode_breakdown,
  );
  const scenarioFactors = (meta as unknown as { scenario_factors?: Record<string, number> }).scenario_factors;
  const ciMethod = (meta as unknown as { ci_method?: string }).ci_method;
  const scenarioNote = (meta as unknown as { scenario_note?: string }).scenario_note;
  const params = meta.parameters ?? {};

  /* ---------- Grafik utama: proyeksi + CI + benchmark ---------- */
  const ct = $derived(chartTheme(themeStore.current === 'dark'));

  const mainSeries = $derived<ApexOptions['series']>([
    { name: 'Proyeksi 2026/2027', type: 'line', data: pts.map((p) => p.TOTAL) },
    {
      name: 'Interval 95%',
      type: 'rangeArea',
      data: pts.map((p) => [p.ci_lower, p.ci_upper]),
    },
    { name: 'Aktual 2025', type: 'line', data: pts.map((p) => p.pnp_2025) },
  ]);

  const mainOptions = $derived<ApexOptions>({
    colors: ['#38bdf8', ct.faint, ct.faint],
    stroke: { width: [2.5, 0, 2], dashArray: [0, 0, 6], curve: 'smooth' },
    fill: { opacity: [1, 0.22, 1], type: ['solid', 'solid', 'solid'] },
    markers: { size: [0, 0, 0] },
    xaxis: {
      categories: pts.map((p) => p.date),
      tickAmount: 10,
      labels: { formatter: fmtDay },
    },
    tooltip: {
      theme: ct.tooltipMode,
      shared: true,
      x: {
        formatter: (v: string | number) => (typeof v === 'string' ? fmtDate(v) : String(v)),
      },
      y: [
        { formatter: (v: number) => `${fmtInt(v)} pnp` },
        {
          formatter: (v: number | number[]) =>
            Array.isArray(v) ? `CI: ${fmtInt(v[0])} – ${fmtInt(v[1])}` : fmtInt(v),
        },
        { formatter: (v: number) => `${fmtInt(v)} pnp` },
      ],
    },
    annotations: {
      xaxis: [
        {
          x: '2026-12-24',
          x2: '2026-12-26',
          fillColor: '#fb7185',
          opacity: 0.1,
          label: {
            text: 'Natal',
            style: { color: '#fb7185', fontFamily: FONT, fontSize: '11px', fontWeight: 700 },
          },
        },
        {
          x: '2026-12-31',
          x2: '2027-01-01',
          fillColor: '#fb7185',
          opacity: 0.1,
          label: {
            text: 'Tahun Baru',
            style: { color: '#fb7185', fontFamily: FONT, fontSize: '11px', fontWeight: 700 },
          },
        },
      ],
      points: [
        {
          x: peak.date,
          y: peak.TOTAL,
          marker: { size: 5, fillColor: '#fb7185', strokeColor: '#fff', strokeWidth: 2 },
          label: {
            text: fmtCompact(peak.TOTAL),
            borderColor: '#fb7185',
            style: {
              color: '#fff',
              background: '#fb7185',
              fontFamily: MONO,
              fontSize: '10px',
              fontWeight: 700,
            },
          },
        },
      ],
    },
  });

  /* ---------- Grafik YoY harian ---------- */
  const yoySeries = $derived<ApexOptions['series']>([
    { name: 'YoY harian', data: pts.map((p) => Number(p.yoy_pct.toFixed(1))) },
  ]);

  const yoyOptions = $derived<ApexOptions>({
    colors: pts.map((p) => (p.yoy_pct >= 0 ? '#34d399' : '#fb7185')),
    legend: { show: false },
    plotOptions: { bar: { distributed: true, borderRadius: 3 } },
    xaxis: {
      categories: pts.map((p) => p.date),
      tickAmount: 14,
      labels: { formatter: fmtDay },
    },
    yaxis: {
      labels: { formatter: (v: number) => `${v.toLocaleString('id-ID')}%` },
    },
    tooltip: {
      theme: ct.tooltipMode,
      x: {
        formatter: (v: string | number) => (typeof v === 'string' ? fmtDate(v) : String(v)),
      },
      y: { formatter: (v: number) => fmtPct(v) },
    },
    annotations: {
      yaxis: [{ y: 0, borderColor: ct.faint, strokeDashArray: 4 }],
    },
  });

  const activeScen = $derived(SCENARIOS.find((s) => s.key === scen)!);

  const methodRows = $derived<{ icon: typeof Cpu; label: string; value: string }[]>([
    { icon: Cpu, label: 'Model', value: meta.model },
    { icon: Database, label: 'Dataset latih', value: meta.training_dataset },
    {
      icon: CalendarClock,
      label: 'Periode latih',
      value: `${fmtDate(meta.train_start)} – ${fmtDate(meta.train_end)} (${fmtInt(meta.train_days)} hari)`,
    },
    {
      icon: Timer,
      label: 'Horizon proyeksi',
      value: `${fmtInt(meta.horizon_days)} hari – ${fmtDate(meta.forecast_start)} s.d. ${fmtDate(meta.forecast_end)}`,
    },
    {
      icon: SlidersHorizontal,
      label: 'Faktor skenario',
      value: scenarioFactors
        ? `Moderat ${scenarioFactors.moderat?.toLocaleString('id-ID')} • Optimis ${scenarioFactors.optimis?.toLocaleString('id-ID')} • Konservatif ${scenarioFactors.konservatif?.toLocaleString('id-ID')}`
        : 'Moderat 1,00 • Optimis 1,07 • Konservatif 0,95',
    },
    { icon: Activity, label: 'Interval kepercayaan', value: ciMethod ?? 'Aproksimasi 95% berbasis RMSE' },
  ]);

  /* ---------- Tabel Rekomendasi Armada (1.010 simpul) ---------- */
  const recs: SimpulRecommendation[] = $derived(data.simpul_recommendations ?? []);

  let recModa = $state('ALL');
  let recStatus = $state('ALL');
  let recLimit = $state('25');
  let recSort = $state('pnp_desc');
  let recSearch = $state('');
  let recPage = $state(1);

  $effect(() => {
    void recModa; void recStatus; void recLimit; void recSort; void recSearch;
    recPage = 1;
  });

  const modaCounts = $derived.by(() => {
    const m = new Map<string, number>();
    for (const r of recs) m.set(r.moda, (m.get(r.moda) ?? 0) + 1);
    return m;
  });

  const recFiltered = $derived.by(() => {
    const q = recSearch.toLowerCase().trim();
    const f = recs.filter((s) => {
      if (recModa !== 'ALL' && s.moda !== recModa) return false;
      if (recStatus !== 'ALL' && String(s.pctTambah) !== recStatus) return false;
      if (q && !`${s.name} ${s.prov} ${s.moda}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const sorted = [...f];
    if (recSort === 'ratio_desc') sorted.sort((a, b) => b.loadRatio - a.loadRatio);
    else if (recSort === 'pct_desc') sorted.sort((a, b) => b.pctTambah - a.pctTambah || b.pnpPuncak - a.pnpPuncak);
    else if (recSort === 'add_desc') sorted.sort((a, b) => b.addArm - a.addArm);
    else if (recSort === 'name_asc') sorted.sort((a, b) => a.name.localeCompare(b.name, 'id'));
    else sorted.sort((a, b) => b.pnpPuncak - a.pnpPuncak);
    return sorted;
  });

  const recTotalPages = $derived(
    recLimit === 'all' ? 1 : Math.max(1, Math.ceil(recFiltered.length / Number(recLimit))),
  );
  const recSafePage = $derived(Math.min(Math.max(recPage, 1), recTotalPages));
  const recRows = $derived(
    recLimit === 'all'
      ? recFiltered
      : recFiltered.slice((recSafePage - 1) * Number(recLimit), recSafePage * Number(recLimit)),
  );
  const recOffset = $derived(recLimit === 'all' ? 0 : (recSafePage - 1) * Number(recLimit));
  const recRangeLabel = $derived(
    recFiltered.length === 0
      ? 'Tidak ada simpul yang cocok dengan filter.'
      : recLimit === 'all'
        ? `Menampilkan seluruh ${fmtInt(recFiltered.length)} simpul (dari ${fmtInt(recs.length)} simpul nasional)`
        : `Menampilkan ${fmtInt(recOffset + 1)}–${fmtInt(recOffset + recRows.length)} dari ${fmtInt(recFiltered.length)} simpul`,
  );

  const recHighlights = $derived(
    MODA_KEYS.map((m) => {
      const sub = recFiltered.filter((r) => r.moda === m);
      const puncakArm = sub.reduce((a, c) => a + (c.armPuncak || 0), 0);
      const addArm = sub.reduce((a, c) => a + (c.addArm || 0), 0);
      return { m, count: sub.length, avgPct: puncakArm > 0 ? (addArm / puncakArm) * 100 : 0, addArm };
    }),
  );

  const recSummary = $derived.by(() => {
    const totalAdd = recFiltered.reduce((a, c) => a + (c.addArm || 0), 0);
    const totalCur = recFiltered.reduce((a, c) => a + (c.armPuncak || 0), 0);
    return {
      n: recFiltered.length,
      totalAdd,
      totalCur,
      avgPct: totalCur > 0 ? (totalAdd / totalCur) * 100 : 0,
      kritis: recFiltered.filter((r) => r.pctTambah === 20).length,
      tinggi: recFiltered.filter((r) => r.pctTambah === 15).length,
      padat: recFiltered.filter((r) => r.pctTambah === 10).length,
      aman: recFiltered.filter((r) => r.pctTambah === 5).length,
    };
  });

  function statusStyle(t: string): { color: string; bg: string } {
    if (t === 'Sangat Kritis') return { color: '#fb7185', bg: 'rgba(251,113,133,.12)' };
    if (t.includes('Tinggi')) return { color: '#fb923c', bg: 'rgba(251,146,60,.12)' };
    if (t === 'Padat') return { color: '#fbbf24', bg: 'rgba(251,191,36,.12)' };
    return { color: '#34d399', bg: 'rgba(52,211,153,.12)' };
  }

  const modaLabelOf = (m: string): string => MODA[m as ModaKey]?.label ?? m;
</script>

<div class="space-y-4">
  <!-- Header ringkas -->
  <Card class="p-4 sm:p-5">
    <div class="flex flex-wrap items-center gap-2">
      <Badge color="#38bdf8">Proyeksi 100 hari • {fmtDate(meta.forecast_start)} – {fmtDate(meta.forecast_end)}</Badge>
      <Badge color="#34d399">3 skenario • {fmtInt(meta.train_days)} hari data latih</Badge>
    </div>
    <h1 class="mt-2.5 text-xl font-extrabold tracking-tight text-ink">Proyeksi Nataru 2026/2027</h1>
    <p class="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-2">
      Perkiraan pergerakan penumpang lintas lima moda pada periode Natal dan Tahun Baru,
      dibandingkan terhadap realisasi periode yang sama tahun 2025 sebagai benchmark.
    </p>
  </Card>

  <!-- Selector skenario -->
  <Card class="p-4 sm:p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">Skenario</p>
        <h2 class="text-lg font-extrabold tracking-tight text-ink">Pilih skenario proyeksi</h2>
      </div>
      <Segmented
        options={SCENARIOS.map((s) => ({ value: s.key, label: s.label, color: s.color }))}
        value={scen}
        onChange={(v) => (scen = v)}
      />
    </div>
    <p class="mt-3 max-w-3xl text-sm leading-relaxed text-ink-2">
      <span class="font-bold" style={`color: ${activeScen.color}`}>{activeScen.label}:</span>
      {' '}{activeScen.desc}
    </p>
  </Card>

  <!-- KPI -->
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <KpiCard
      label="Total Penumpang (100 hari)"
      value={`${fmtCompact(summary.total_passengers)} pnp`}
      delta={summary.yoy_total_pct}
      deltaLabel="YoY vs periode sama 2025"
      accent="#38bdf8"
    >
      {#snippet icon()}<Users size={18} />{/snippet}
    </KpiCard>
    <KpiCard
      label="Rata-rata Harian"
      value={`${fmtCompact(summary.avg_daily_passengers)} pnp`}
      delta={summary.yoy_avg_pct}
      deltaLabel="YoY vs 2025"
      accent="#7dd3fc"
    >
      {#snippet icon()}<TrendingUp size={18} />{/snippet}
    </KpiCard>
    <KpiCard
      label="Total Armada (100 hari)"
      value={`${fmtCompact(summary.total_armada)} trip`}
      delta={summary.yoy_armada_pct}
      deltaLabel="YoY vs periode sama 2025"
      accent="#34d399"
    >
      {#snippet icon()}<Bus size={18} />{/snippet}
    </KpiCard>
    <KpiCard
      label="Puncak Natal"
      value={fmtCompact(summary.xmas_peak_val)}
      delta={summary.xmas_peak_yoy}
      deltaLabel={`${fmtDate(summary.xmas_peak_date)} • Natal`}
      accent="#fbbf24"
    >
      {#snippet icon()}<Star size={18} />{/snippet}
    </KpiCard>
    <KpiCard
      label="Puncak Tahun Baru"
      value={fmtCompact(summary.ny_peak_val)}
      delta={summary.ny_peak_yoy}
      deltaLabel={`${fmtDate(summary.ny_peak_date)} • Tahun Baru`}
      accent="#c084fc"
    >
      {#snippet icon()}<CalendarDays size={18} />{/snippet}
    </KpiCard>
    <KpiCard
      label="Puncak Absolut Proyeksi"
      value={fmtCompact(summary.all_time_peak_val)}
      delta={summary.all_time_peak_yoy}
      deltaLabel={`${fmtDate(summary.all_time_peak_date)} • YoY vs 2025`}
      accent="#fb7185"
    >
      {#snippet icon()}<Flame size={18} />{/snippet}
    </KpiCard>
  </div>

  <!-- Grafik utama -->
  <Card class="p-4 sm:p-5">
    <CardHeader
      title={`Arus Penumpang Harian — Skenario ${activeScen.label}`}
      subtitle="Garis biru proyeksi 2026/2027 dengan pita interval kepercayaan 95%, garis abu-abu putus-putus realisasi 2025, zona merah periode Natal & Tahun Baru."
    >
      {#snippet icon()}<LineChart size={15} />{/snippet}
    </CardHeader>
    <Chart type="line" series={mainSeries} options={mainOptions} height={340} />
  </Card>

  <!-- Grafik YoY -->
  <Card class="p-4 sm:p-5">
    <CardHeader
      title="Pertumbuhan YoY Harian vs 2025"
      subtitle="Batang hijau di atas rata-rata 2025, merah di bawahnya — skenario aktif."
    >
      {#snippet icon()}<BarChart3 size={15} />{/snippet}
    </CardHeader>
    <Chart type="bar" series={yoySeries} options={yoyOptions} height={240} />
  </Card>

  <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
    <!-- Metodologi -->
    <Card class="p-4 sm:p-5 xl:col-span-2">
      <CardHeader
        title="Metodologi Proyeksi"
        subtitle="Parameter model dan asumsi yang dipakai dalam penyusunan proyeksi ini."
      >
        {#snippet icon()}<ListChecks size={15} />{/snippet}
      </CardHeader>
      <dl class="divide-y divide-line">
        {#each methodRows as r}
          <div class="flex gap-3 py-3">
            <span class="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-fill text-ink-2">
              <r.icon size={16} />
            </span>
            <div class="min-w-0">
              <dt class="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">{r.label}</dt>
              <dd class="mt-0.5 text-[13px] font-medium leading-relaxed text-ink-2">{r.value}</dd>
            </div>
          </div>
        {/each}
      </dl>
      {#if Object.keys(params).length > 0}
        <div class="mt-2">
          <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">Parameter Holt-Winters</p>
          <div class="flex flex-wrap gap-1.5">
            {#each Object.entries(params) as [k, v]}
              <span class="num rounded-lg border border-line bg-fill px-2.5 py-1 text-[11px] font-semibold text-ink-2">
                {k}: {String(v)}
              </span>
            {/each}
          </div>
        </div>
      {/if}
      {#if scenarioNote}
        <p class="mt-4 flex gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] p-3.5 text-[12.5px] leading-relaxed text-amber-200/90">
          <Info size={15} class="mt-0.5 shrink-0" />
          {scenarioNote}
        </p>
      {/if}
    </Card>

    <!-- Breakdown moda -->
    <Card class="p-4 sm:p-5">
      <CardHeader
        title="Kontribusi per Moda"
        subtitle={`Skenario ${activeScen.label} — total 100 hari`}
      >
        {#snippet icon()}<PieChartIcon size={15} />{/snippet}
      </CardHeader>
      {#if breakdown}
        <div class="space-y-2.5">
          {#each MODA_KEYS as m}
            {@const b = breakdown[m]}
            {#if b}
              {@const pos = b.yoy_pct >= 0}
              <div class="flex items-center gap-3 rounded-xl border border-line bg-fill p-3">
                <span class="size-3 shrink-0 rounded-full" style={`background: ${MODA[m].color}`}></span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-[13px] font-bold text-ink">{MODA[m].label}</p>
                  <p class="num text-[11.5px] text-ink-3">
                    {fmtCompact(b.passengers_2026)} pnp • {b.share_pct_2026.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%
                  </p>
                </div>
                <span
                  class={`num rounded-full px-2 py-0.5 text-[11px] font-bold ${pos ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'}`}
                >
                  {fmtPct(b.yoy_pct)}
                </span>
              </div>
            {/if}
          {/each}
        </div>
      {:else}
        <p class="text-sm text-ink-3">Data rincian moda tidak tersedia.</p>
      {/if}
    </Card>
  </div>

  <!-- Tabel Rekomendasi Armada 1.010 Simpul -->
  <Card class="p-4 sm:p-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-[15px] font-extrabold tracking-tight text-ink">
          Tabel Rekomendasi Kebutuhan Penambahan Armada di Seluruh Simpul Prasarana Nasional (1.010 Simpul)
        </h3>
        <p class="mt-1 max-w-3xl text-[12px] leading-relaxed text-ink-3">
          Dihitung berbasis metodologi persentil lonjakan Load Factor (LF Puncak / LF Biasa) standar TCQSM TRB.
          Dilengkapi filter jumlah baris, filter moda, status urgensi, dan pencarian cepat.
        </p>
      </div>
      <a
        href={`${base}/dokumentasi`}
        class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-fill px-3 py-2 text-[12px] font-bold text-ink-2 transition-colors hover:text-ink"
      >
        <BookOpen size={14} class="text-accent" />
        Metodologi Data
      </a>
    </div>

    <!-- Highlight cards per moda -->
    <div class="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-5">
      {#each recHighlights as h}
        <div class="rounded-xl border border-line p-3" style={`background: ${MODA[h.m].colorSoft}`}>
          <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider" style={`color: ${MODA[h.m].color}`}>
            <span>{MODA[h.m].short}</span>
            <span>{fmtInt(h.count)} Simpul</span>
          </div>
          <p class="num mt-1 text-lg font-black" style={`color: ${MODA[h.m].color}`}>
            +{h.avgPct.toLocaleString('id-ID', { maximumFractionDigits: 1 })}% Armada
          </p>
          <p class="mt-0.5 text-[11px] text-ink-2">
            Butuh <strong class="text-ink">+{fmtInt(h.addArm)} unit/hari</strong>
          </p>
        </div>
      {/each}
    </div>

    <!-- Filter moda + status -->
    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onclick={() => (recModa = 'ALL')}
          class={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all ${recModa === 'ALL' ? 'text-white shadow-sm' : 'border border-line bg-fill text-ink-3 hover:text-ink'}`}
          style={recModa === 'ALL' ? 'background: #38bdf8; border: 1px solid transparent' : undefined}
        >
          Semua ({fmtInt(recs.length)})
        </button>
        {#each MODA_KEYS as m}
          <button
            type="button"
            onclick={() => (recModa = m)}
            class={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all ${recModa === m ? 'text-white shadow-sm' : 'border border-line bg-fill text-ink-3 hover:text-ink'}`}
            style={recModa === m ? `background: ${MODA[m].color}; border: 1px solid transparent` : undefined}
          >
            {MODA[m].short} ({fmtInt(modaCounts.get(m) ?? 0)})
          </button>
        {/each}
      </div>
      <label class="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-3">
        Status:
        <select
          bind:value={recStatus}
          class="cursor-pointer rounded-lg border border-line bg-fill px-2.5 py-1.5 text-[12px] font-semibold normal-case tracking-normal text-ink outline-none focus:border-accent"
        >
          <option value="ALL">Semua Status Urgensi</option>
          <option value="20">Sangat Kritis (+20%)</option>
          <option value="15">Tinggi / Kritis (+15%)</option>
          <option value="10">Padat (+10%)</option>
          <option value="5">Terkendali (+5%)</option>
        </select>
      </label>
    </div>

    <!-- Limit / sort / search -->
    <div class="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-fill p-3">
      <div class="flex flex-wrap items-center gap-3">
        <label class="inline-flex items-center gap-1.5 text-[12px] font-bold text-ink-2">
          Tampilkan:
          <select
            bind:value={recLimit}
            class="cursor-pointer rounded-lg border border-line bg-panel px-2.5 py-1.5 text-[12px] font-bold text-ink outline-none focus:border-accent"
          >
            <option value="10">Top 10 Simpul Utama</option>
            <option value="25">Top 25 Simpul Terpadat</option>
            <option value="50">Top 50 Simpul Nasional</option>
            <option value="100">Top 100 Simpul Terbesar</option>
            <option value="250">Top 250 Simpul</option>
            <option value="all">Semua Simpul ({fmtInt(recFiltered.length)})</option>
          </select>
        </label>
        <label class="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-3">
          Urutkan:
          <select
            bind:value={recSort}
            class="cursor-pointer rounded-lg border border-line bg-panel px-2.5 py-1.5 text-[12px] font-semibold text-ink outline-none focus:border-accent"
          >
            <option value="pnp_desc">Penumpang Puncak (Tertinggi)</option>
            <option value="ratio_desc">Lonjakan Beban (Tertinggi)</option>
            <option value="pct_desc">% Tambah Armada (Tertinggi)</option>
            <option value="add_desc">Tambahan Unit Fisik (Terbanyak)</option>
            <option value="name_asc">Nama Simpul (A – Z)</option>
          </select>
        </label>
      </div>
      <div class="relative w-full sm:w-64">
        <Search size={14} class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          type="text"
          bind:value={recSearch}
          placeholder="Cari nama simpul, provinsi, moda..."
          class="w-full rounded-lg border border-line bg-panel py-2 pl-9 pr-3 text-[12px] text-ink outline-none placeholder:text-ink-3 focus:border-accent"
        />
      </div>
    </div>

    <!-- Tabel -->
    <div class="mt-3 max-h-[750px] overflow-auto rounded-xl border border-line">
      <table class="w-full border-collapse text-left text-[12px]">
        <thead class="sticky top-0 z-10 bg-panel">
          <tr class="border-b border-line text-[10.5px] font-bold uppercase tracking-wider text-ink-3">
            <th class="px-3 py-2.5">No &amp; Simpul Prasarana</th>
            <th class="px-3 py-2.5">Keberangkatan Normal</th>
            <th class="px-3 py-2.5">Keberangkatan Puncak</th>
            <th class="px-3 py-2.5 text-center">Lonjakan Beban</th>
            <th class="px-3 py-2.5 text-center">Status</th>
            <th class="px-3 py-2.5 text-center">Perlu Tambah (%)</th>
            <th class="px-3 py-2.5 text-right">Tambahan Unit</th>
            <th class="px-3 py-2.5 text-right">Total Operasi</th>
            <th class="px-3 py-2.5">Rekomendasi Aksi Lapangan</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          {#if recRows.length === 0}
            <tr>
              <td colspan="9" class="px-3 py-12 text-center text-[12px] text-ink-3">
                Tidak ada simpul prasarana yang memenuhi kriteria filter atau kata kunci pencarian.
              </td>
            </tr>
          {/if}
          {#each recRows as s, i}
            {@const st = statusStyle(s.statusText)}
            <tr class="transition-colors hover:bg-fill">
              <td class="px-3 py-3">
                <div class="flex items-center gap-2">
                  <span class="num grid size-6 shrink-0 place-items-center rounded-full border border-line bg-fill text-[10px] font-bold text-ink-3">
                    {recOffset + i + 1}
                  </span>
                  <div class="min-w-0">
                    <p class="truncate text-[12.5px] font-bold text-ink">{s.name}</p>
                    <p class="text-[10.5px] text-ink-3">{s.prov} • {modaLabelOf(s.moda)}</p>
                  </div>
                </div>
              </td>
              <td class="num whitespace-nowrap px-3 py-3 text-ink-2">
                <p>{fmtInt(s.pnpBiasa)} pnp/h</p>
                <p class="text-[10.5px] text-ink-3">{fmtInt(s.armBiasa)} {s.saranaUnit} (LF: {s.lfBiasa})</p>
              </td>
              <td class="num whitespace-nowrap px-3 py-3 font-semibold text-ink">
                <p>{fmtInt(s.pnpPuncak)} pnp/h</p>
                <p class="text-[10.5px] font-normal text-rose-400">{fmtInt(s.armPuncak)} {s.saranaUnit} (LF: {s.lfPuncak})</p>
              </td>
              <td class="num px-3 py-3 text-center">
                <p class="text-[13px] font-black text-accent">{s.loadRatio}x</p>
                <p class="text-[10px] font-normal text-ink-3">naik vs biasa</p>
              </td>
              <td class="px-3 py-3 text-center">
                <span
                  class="inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
                  style={`color: ${st.color}; background: ${st.bg}`}
                >
                  {s.statusText}
                </span>
              </td>
              <td class="px-3 py-3 text-center">
                <span class="num inline-block rounded-lg bg-accent px-2.5 py-1 text-[12px] font-black text-white">
                  +{s.pctTambah}%
                </span>
              </td>
              <td class="num whitespace-nowrap px-3 py-3 text-right font-bold text-accent">
                <p>+{fmtInt(s.addArm)}</p>
                <p class="text-[10px] font-normal text-ink-3">{s.saranaUnit}/hari</p>
              </td>
              <td class="num whitespace-nowrap px-3 py-3 text-right font-bold text-emerald-400">
                <p>{fmtInt(s.totalArm)}</p>
                <p class="text-[10px] font-normal text-ink-3">operasi harian</p>
              </td>
              <td class="max-w-[260px] px-3 py-3 text-[11.5px] leading-relaxed text-ink-2">
                {s.fieldAction}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
      <p class="num text-[11.5px] text-ink-3">{recRangeLabel}</p>
      {#if recLimit !== 'all'}
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            onclick={() => (recPage = recSafePage - 1)}
            disabled={recSafePage <= 1}
            class="inline-flex items-center gap-1 rounded-lg border border-line bg-fill px-3 py-1.5 text-[12px] font-semibold text-ink-2 transition-all hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={14} />
            Sebelumnya
          </button>
          <span class="num px-2 text-[12px] font-bold text-ink-3">
            Halaman {recSafePage} dari {recTotalPages}
          </span>
          <button
            type="button"
            onclick={() => (recPage = recSafePage + 1)}
            disabled={recSafePage >= recTotalPages}
            class="inline-flex items-center gap-1 rounded-lg border border-line bg-fill px-3 py-1.5 text-[12px] font-semibold text-ink-2 transition-all hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            Berikutnya
            <ChevronRight size={14} />
          </button>
        </div>
      {/if}
    </div>

    <!-- Summary box -->
    <div class="mt-3 flex items-start gap-2.5 rounded-xl border border-line bg-fill p-4">
      <span class="mt-1 size-2.5 shrink-0 rounded-full bg-accent"></span>
      <div class="space-y-1.5 text-[12px] leading-relaxed">
        <p class="font-bold text-ink">Rangkuman Instruksi Operasional Terpadu ({fmtInt(recSummary.n)} Simpul Terpilih):</p>
        <p class="text-ink-2">
          • <strong class="text-ink">Total Kebutuhan Tambahan Armada:</strong> Diperlukan penambahan
          <strong class="text-ink">+{fmtInt(recSummary.totalAdd)} armada fisik/hari (+{recSummary.avgPct.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%)</strong>
          untuk menjaga kelancaran arus mudik &amp; balik dari total {fmtInt(recSummary.totalCur)} armada operasi puncak.
        </p>
        <p class="text-ink-2">
          • <strong class="text-ink">Distribusi Tingkat Urgensi:</strong>
          <span class="font-semibold text-rose-400">{fmtInt(recSummary.kritis)} Simpul Sangat Kritis (+20%)</span>,
          <span class="font-semibold text-orange-400">{fmtInt(recSummary.tinggi)} Simpul Tinggi (+15%)</span>,
          <span class="font-semibold text-amber-400">{fmtInt(recSummary.padat)} Simpul Padat (+10%)</span>, dan
          <span class="font-semibold text-emerald-400">{fmtInt(recSummary.aman)} Simpul Terkendali/Siaga (+5%)</span>.
        </p>
        <p class="text-ink-2">
          • <strong class="text-ink">Instruksi Utama Lapangan:</strong> Prioritaskan rekayasa
          <em>Tiba Bongkar Berangkat</em> di Pelabuhan Merak-Bakauheni &amp; Ketapang-Gilimanuk, izin slot
          <em>extra flight</em> malam di CGK Soetta &amp; DPS Bali, serta rangkaian Kereta Api Tambahan (KLB)
          di Pasar Senen &amp; Gambir.
        </p>
      </div>
    </div>
  </Card>
</div>
