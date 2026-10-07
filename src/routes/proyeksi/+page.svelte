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
  import type { ForecastPoint } from '$lib/data';
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
    colors: ['#38bdf8', '#8b98ad', '#8b98ad'],
    stroke: { width: [2.5, 0, 2], dashArray: [0, 0, 6], curve: 'smooth' },
    fill: { opacity: [1, 0.22, 1], type: ['solid', 'solid', 'solid'] },
    markers: { size: [0, 0, 0] },
    xaxis: {
      categories: pts.map((p) => p.date),
      tickAmount: 10,
      labels: { formatter: fmtDay },
    },
    tooltip: {
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
      x: {
        formatter: (v: string | number) => (typeof v === 'string' ? fmtDate(v) : String(v)),
      },
      y: { formatter: (v: number) => fmtPct(v) },
    },
    annotations: {
      yaxis: [{ y: 0, borderColor: '#8b98ad', strokeDashArray: 4 }],
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
      <dl class="divide-y divide-white/[0.06]">
        {#each methodRows as r}
          <div class="flex gap-3 py-3">
            <span class="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-ink-2">
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
              <span class="num rounded-lg border border-white/[0.07] bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-ink-2">
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
              <div class="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
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
</div>
