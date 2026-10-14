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
  import type { ForecastPoint } from '$lib/data';
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
  import ChevronDown from 'lucide-svelte/icons/chevron-down';
  import MapPin from 'lucide-svelte/icons/map-pin';
  import Trophy from 'lucide-svelte/icons/trophy';

  /* Skenario terkunci Moderat (mengikuti v1): tidak ada pemilih skenario di UI. */
  const scen = 'moderat' as const;

  interface ChampionModel {
    name: string;
    code: string;
    mape: number;
    rmse: number;
    mae: number;
    wape: number;
    dir_acc: number;
  }

  interface BenchmarkRow {
    model_name: string;
    model_code: string;
    rank: number;
    mape: number;
    wape: number;
    rmse: number;
    mae: number;
    dir_acc: number;
    is_stable: boolean;
  }

  interface ModeBreakdown {
    passengers_2026: number;
    yoy_pct: number;
    share_pct_2026: number;
    armada_2026?: number;
    armada_2025?: number;
  }

  interface ScopeSummary {
    total_passengers: number;
    yoy_total_pct: number;
    avg_daily_passengers: number;
    yoy_avg_pct: number;
    total_armada: number;
    yoy_armada_pct: number;
    xmas_peak_val: number;
    xmas_peak_yoy: number;
    xmas_peak_date: string;
    ny_peak_val: number;
    ny_peak_yoy: number;
    ny_peak_date: string;
    all_time_peak_val: number;
    all_time_peak_yoy: number;
    all_time_peak_date: string;
    mode_breakdown?: Record<string, ModeBreakdown>;
  }

  interface ScopeForecast {
    champion_model?: ChampionModel;
    benchmarks?: BenchmarkRow[];
    metrics?: { TOTAL?: { model_name?: string; mape?: number; rmse?: number; mae?: number; wape?: number; dir_acc?: number } };
    summaries?: Record<string, ScopeSummary>;
    scenarios?: Record<string, ForecastPoint[] | { daily?: ForecastPoint[] }>;
    history_2026?: { dates?: string[]; TOTAL?: number[] };
    history_2025_md?: Record<string, number>;
  }

  type RawForecast = ScopeForecast & {
    meta: {
      model: string;
      training_dataset: string;
      train_start: string;
      train_end: string;
      train_days: number;
      forecast_start: string;
      forecast_end: string;
      horizon_days: number;
      parameters?: Record<string, unknown>;
      scenario_factors?: Record<string, number>;
      scenario_note?: string;
      ci_method?: string;
    };
    provinces?: string[];
    by_province?: Record<string, ScopeForecast>;
  };

  const fn = data.forecast_nataru as unknown as RawForecast;
  const meta = fn.meta;
  const provinces = [...(fn.provinces ?? [])].sort((a, b) => a.localeCompare(b, 'id'));

  let prov = $state('ALL');
  let showBench = $state(false);
  let fcRange = $state<'nataru' | 'des' | 'nov' | 'okt' | 'all'>('nataru');

  const byProv = fn.by_province ?? {};
  const scope = $derived<ScopeForecast>(prov === 'ALL' ? fn : (byProv[prov] ?? fn));
  const isNational = $derived(prov === 'ALL');
  const scopeLabel = $derived(isNational ? 'Seluruh Provinsi (Nasional)' : prov);

  const summary = $derived<ScopeSummary>(
    scope.summaries?.[scen] ?? fn.summaries?.[scen] ?? ({} as ScopeSummary),
  );

  function asArray(s: ForecastPoint[] | { daily?: ForecastPoint[] } | undefined): ForecastPoint[] {
    if (!s) return [];
    return Array.isArray(s) ? s : (s.daily ?? []);
  }

  const num = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  interface FcPoint {
    date: string;
    TOTAL: number;
    ci_lower: number;
    ci_upper: number;
    base2025: number;
    yoy: number;
    is_nataru: boolean;
    UDARA: number;
    KA: number;
    BUS: number;
    ASDP: number;
    LAUT: number;
    arm_TOTAL: number;
  }

  const fcPts = $derived<FcPoint[]>(
    asArray((scope.scenarios?.[scen] ?? fn.scenarios?.[scen]) as ForecastPoint[] | { daily?: ForecastPoint[] } | undefined).map(
      (d) => {
        const rec = d as unknown as Record<string, unknown>;
        const base2025 = num(rec.TOTAL_2025 ?? rec.pnp_2025);
        const storedYoy = num(rec.yoy_pct);
        const yoy = base2025 > 0 ? ((num(d.TOTAL) - base2025) / base2025) * 100 : storedYoy;
        return {
          date: String(d.date),
          TOTAL: num(d.TOTAL),
          ci_lower: num(rec.ci_lower),
          ci_upper: num(rec.ci_upper),
          base2025,
          yoy,
          is_nataru:
            rec.is_nataru === true ||
            (String(d.date) >= '2026-12-18' && String(d.date) <= '2027-01-04'),
          UDARA: num(rec.UDARA),
          KA: num(rec.KA),
          BUS: num(rec.BUS),
          ASDP: num(rec.ASDP),
          LAUT: num(rec.LAUT),
          arm_TOTAL: num(rec.arm_TOTAL),
        };
      },
    ),
  );

  /* Champion: dari data baru; fallback ke model HW nasional bila data lama. */
  const champ = $derived<ChampionModel>(
    scope.champion_model ??
      fn.champion_model ?? {
        name: 'Holt-Winters Mul Damped (phi=0.98)',
        code: 'hw_mul_damped',
        mape: scope.metrics?.TOTAL?.mape ?? 4.1,
        rmse: scope.metrics?.TOTAL?.rmse ?? 62051,
        mae: scope.metrics?.TOTAL?.mae ?? 49146,
        wape: scope.metrics?.TOTAL?.wape ?? 4.02,
        dir_acc: scope.metrics?.TOTAL?.dir_acc ?? 89.3,
      },
  );
  const benchmarks = $derived<BenchmarkRow[]>([...(scope.benchmarks ?? fn.benchmarks ?? [])].sort((a, b) => a.rank - b.rank));

  const breakdown = $derived(summary.mode_breakdown);
  const scenarioFactors = meta.scenario_factors;
  const ciMethod = meta.ci_method;
  const scenarioNote = meta.scenario_note;
  const params = meta.parameters ?? {};

  /* ---------- Histori 272 hari ---------- */
  const histDates = $derived<string[]>(
    scope.history_2026?.dates && scope.history_2026.dates.length > 0
      ? scope.history_2026.dates
      : data.daily_timeline.map((r) => String(r.date)),
  );
  const histVals = $derived<number[]>(
    scope.history_2026?.TOTAL && scope.history_2026.TOTAL.length > 0
      ? scope.history_2026.TOTAL.map((v) => num(v))
      : data.daily_timeline.map((r) => num(r.TOTAL)),
  );

  /* Pembanding 2025 per MM-DD: nasional dari timeline_2025, provinsi dari history_2025_md. */
  const md2025 = $derived.by<Map<string, number>>(() => {
    const m = new Map<string, number>();
    if (scope.history_2025_md) {
      for (const [k, v] of Object.entries(scope.history_2025_md)) m.set(k, num(v));
    } else {
      for (const r of data.timeline_2025 ?? []) {
        const d = String(r.date);
        if (d.length >= 10) m.set(d.slice(5), num(r.TOTAL));
      }
    }
    return m;
  });

  const allDates = $derived<string[]>([...histDates, ...fcPts.map((p) => p.date)]);
  const lastHist = $derived(histVals.length > 0 ? histVals[histVals.length - 1] : 0);
  const hist2025Vals = $derived<number[]>(histDates.map((d) => md2025.get(d.slice(5)) ?? 0));
  const fc2025Vals = $derived<number[]>(fcPts.map((p) => p.base2025));

  const peak = $derived<FcPoint>(
    fcPts.reduce((a, b) => (b.TOTAL > a.TOTAL ? b : a), fcPts[0] ?? ({ date: '', TOTAL: 0 } as FcPoint)),
  );

  /* ---------- Grafik utama 372 titik ---------- */
  const ct = $derived(chartTheme(themeStore.current === 'dark'));

  const mainSeries = $derived(
    [
      {
        name: 'Realisasi 2026',
        type: 'line',
        data: [...histVals, ...Array(fcPts.length).fill(null)],
      },
      {
        name: `Proyeksi ${champ.name}`,
        type: 'line',
        data: [...Array(Math.max(histVals.length - 1, 0)).fill(null), lastHist, ...fcPts.map((p) => p.TOTAL)],
      },
      {
        name: 'Interval 95%',
        type: 'rangeArea',
        data: [
          ...Array(Math.max(histVals.length - 1, 0)).fill(null),
          [lastHist, lastHist],
          ...fcPts.map((p) => [p.ci_lower, p.ci_upper]),
        ],
      },
      {
        name: 'Realisasi 2025',
        type: 'line',
        data: [...hist2025Vals, ...fc2025Vals],
      },
    ] as unknown as ApexOptions['series'],
  );

  const fmtDay = (v: string | number) =>
    typeof v === 'string' ? v.slice(5).replace('-', '/') : String(v);

  const mainOptions = $derived<ApexOptions>({
    colors: ['#38bdf8', '#a78bfa', ct.faint, ct.faint],
    stroke: { width: [2.5, 2.5, 0, 2], dashArray: [0, 4, 0, 6], curve: 'smooth' },
    fill: { opacity: [1, 1, 0.22, 1], type: ['solid', 'solid', 'solid', 'solid'] },
    markers: { size: [0, 0, 0, 0] },
    xaxis: {
      categories: allDates,
      tickAmount: 12,
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
    { name: 'YoY harian', data: fcPts.map((p) => Number(p.yoy.toFixed(1))) },
  ]);

  const yoyOptions = $derived<ApexOptions>({
    colors: fcPts.map((p) => (p.yoy >= 0 ? '#34d399' : '#fb7185')),
    legend: { show: false },
    plotOptions: { bar: { distributed: true, borderRadius: 3 } },
    xaxis: {
      categories: fcPts.map((p) => p.date),
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

  /* ---------- Tabel rincian 100 hari ---------- */
  const tableRows = $derived.by<FcPoint[]>(() => {
    if (fcRange === 'nataru') return fcPts.filter((p) => p.is_nataru);
    if (fcRange === 'des') return fcPts.filter((p) => p.date.startsWith('2026-12'));
    if (fcRange === 'nov') return fcPts.filter((p) => p.date.startsWith('2026-11'));
    if (fcRange === 'okt') return fcPts.filter((p) => p.date.startsWith('2026-10'));
    return fcPts;
  });

  const MODEL_11 = [
    'Holt-Winters Mul Standar',
    'Holt-Winters Mul Damped (phi=0,98)',
    'Holt-Winters Add Damped (phi=0,98)',
    'SARIMA (1,1,1)x(1,1,1,7)',
    'ARIMA (1,1,1) Non-Seasonal',
    'Holt Linear Trend (No Seasonal)',
    'Simple Exp Smoothing (SES)',
    'Linear Regression / Ridge (Trend + DOW)',
    'Seasonal Naive (Lag 7)',
    'Naive Random Walk (Lag 1)',
    '7-Day Moving Average (MA7)',
  ];

  const methodRows = $derived<{ icon: typeof Cpu; label: string; value: string }[]>([
    {
      icon: Cpu,
      label: 'Model',
      value:
        'Seleksi otomatis 11 model per provinsi (auto-model); champion = MAPE terendah di antara model stabil.',
    },
    {
      icon: Trophy,
      label: 'Model terpilih (champion)',
      value: `${champ.name} — MAPE ${champ.mape.toLocaleString('id-ID', { maximumFractionDigits: 2 })}% (holdout 28 hari)`,
    },
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
      label: 'Skenario',
      value: scenarioFactors
        ? `Terkunci Moderat (faktor ${scenarioFactors.moderat?.toLocaleString('id-ID')}). Faktor Optimis ${scenarioFactors.optimis?.toLocaleString('id-ID')} & Konservatif ${scenarioFactors.konservatif?.toLocaleString('id-ID')} tetap dihitung di data, tidak dapat dipilih di UI.`
        : 'Terkunci Moderat (faktor 1,00). Faktor Optimis 1,07 & Konservatif 0,95 tetap dihitung di data, tidak dapat dipilih di UI.',
    },
    { icon: Activity, label: 'Interval kepercayaan', value: ciMethod ?? 'Aproksimasi 95% berbasis RMSE' },
  ]);
</script>

<div class="space-y-4">
  <!-- Header ringkas -->
  <Card class="p-4 sm:p-5">
    <div class="flex flex-wrap items-center gap-2">
      <Badge color="#38bdf8">Proyeksi 100 hari • {fmtDate(meta.forecast_start)} – {fmtDate(meta.forecast_end)}</Badge>
      <Badge color="#34d399">Skenario Moderat (terkunci) • {fmtInt(meta.train_days)} hari data latih</Badge>
      <Badge color="#a78bfa">{scopeLabel}</Badge>
    </div>
    <h1 class="mt-2.5 text-xl font-extrabold tracking-tight text-ink">Proyeksi Nataru 2026/2027</h1>
    <p class="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-2">
      Perkiraan pergerakan penumpang lintas lima moda pada periode Natal dan Tahun Baru,
      dibandingkan terhadap realisasi periode yang sama tahun 2025 sebagai benchmark.
    </p>
  </Card>

  <!-- Filter provinsi + champion -->
  <Card class="p-4 sm:p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">Wilayah &amp; Model</p>
        <h2 class="text-lg font-extrabold tracking-tight text-ink">Filter provinsi &amp; model terpilih</h2>
      </div>
      <label class="inline-flex items-center gap-2 text-[12px] font-bold text-ink-2">
        <MapPin size={15} class="text-accent" />
        Provinsi:
        <select
          bind:value={prov}
          class="cursor-pointer rounded-lg border border-line bg-fill px-2.5 py-2 text-[13px] font-semibold text-ink outline-none focus:border-accent"
        >
          <option value="ALL">Seluruh Provinsi (Nasional)</option>
          {#each provinces as p}
            <option value={p}>{p}</option>
          {/each}
        </select>
      </label>
    </div>
    <p class="mt-3 max-w-3xl text-sm leading-relaxed text-ink-2">
      <span class="font-bold text-ink">Model Terpilih: {champ.name} (Auto-Model: MAPE {champ.mape.toLocaleString('id-ID', { maximumFractionDigits: 2 })}%)</span>
      {' '}— model dengan MAPE terendah di antara model stabil pada backtest holdout 28 hari. Nasional dipaksa ke Holt-Winters Mul Damped (MAPE 4,1%) meski Holt-Winters Mul Standar lebih kecil (3,8%).
    </p>
    <button
      type="button"
      onclick={() => (showBench = !showBench)}
      class="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line bg-fill px-3 py-2 text-[12px] font-bold text-ink-2 transition-colors hover:text-ink"
    >
      {showBench ? 'Sembunyikan' : 'Lihat'} Komparasi 11 Model Peramalan
      <ChevronDown size={14} class={`transition-transform ${showBench ? 'rotate-180' : ''}`} />
    </button>
  </Card>

  <!-- Panel benchmark 11 model -->
  {#if showBench}
    <Card class="p-4 sm:p-5">
      <CardHeader
        title="Hasil Benchmark 11 Model Peramalan (Holdout 28 Hari)"
        subtitle={`Model dengan MAPE terendah yang memenuhi syarat stabilitas horizon 100 hari otomatis terpilih. Wilayah: ${scopeLabel}.`}
      >
        {#snippet icon()}<Trophy size={15} />{/snippet}
      </CardHeader>
      {#if benchmarks.length > 0}
        <div class="overflow-x-auto rounded-xl border border-line">
          <table class="w-full border-collapse text-left text-[12px]">
            <thead class="bg-panel">
              <tr class="border-b border-line text-[10.5px] font-bold uppercase tracking-wider text-ink-3">
                <th class="px-3 py-2.5">Peringkat</th>
                <th class="px-3 py-2.5">Model Peramalan</th>
                <th class="px-3 py-2.5 text-right">MAPE (%)</th>
                <th class="px-3 py-2.5 text-right">WAPE (%)</th>
                <th class="px-3 py-2.5 text-right">RMSE (pnp)</th>
                <th class="px-3 py-2.5 text-right">MAE (pnp)</th>
                <th class="px-3 py-2.5 text-right">Akurasi Arah</th>
                <th class="px-3 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              {#each benchmarks as b}
                {@const isChamp = b.model_code === champ.code}
                <tr class={isChamp ? 'bg-emerald-400/[0.07]' : 'hover:bg-fill'}>
                  <td class="num px-3 py-2.5 font-bold text-ink">
                    {#if isChamp}#1 Terpilih{:else}#{b.rank}{/if}
                  </td>
                  <td class="px-3 py-2.5 font-semibold text-ink">{b.model_name}</td>
                  <td class="num px-3 py-2.5 text-right font-bold text-ink">{b.mape.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</td>
                  <td class="num px-3 py-2.5 text-right text-ink-2">{b.wape.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</td>
                  <td class="num px-3 py-2.5 text-right text-ink-2">{fmtInt(b.rmse)}</td>
                  <td class="num px-3 py-2.5 text-right text-ink-2">{fmtInt(b.mae)}</td>
                  <td class="num px-3 py-2.5 text-right font-semibold text-ink-2">{b.dir_acc.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%</td>
                  <td class="px-3 py-2.5 text-center">
                    {#if isChamp}
                      <span class="inline-block whitespace-nowrap rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-300">Terpilih (Champion)</span>
                    {:else if !b.is_stable}
                      <span class="inline-block whitespace-nowrap rounded-full bg-rose-400/10 px-2.5 py-0.5 text-[10.5px] font-bold text-rose-300">Kurang Stabil</span>
                    {:else}
                      <span class="inline-block whitespace-nowrap rounded-full bg-fill px-2.5 py-0.5 text-[10.5px] font-bold text-ink-3">Kandidat Alternatif</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <p class="text-sm text-ink-3">Data benchmark belum tersedia pada bundle data saat ini.</p>
      {/if}
    </Card>
  {/if}

  <!-- KPI (ringkasan jendela Nataru 18 hari) -->
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <KpiCard
      label="Total Penumpang (Nataru 18 hari)"
      value={`${fmtCompact(summary.total_passengers)} pnp`}
      delta={summary.yoy_total_pct}
      deltaLabel="YoY vs periode sama 2025"
      accent="#38bdf8"
    >
      {#snippet icon()}<Users size={18} />{/snippet}
    </KpiCard>
    <KpiCard
      label="Rata-rata Harian (Nataru 18 hari)"
      value={`${fmtCompact(summary.avg_daily_passengers)} pnp`}
      delta={summary.yoy_avg_pct}
      deltaLabel="YoY vs 2025"
      accent="#7dd3fc"
    >
      {#snippet icon()}<TrendingUp size={18} />{/snippet}
    </KpiCard>
    <KpiCard
      label="Total Armada (Nataru 18 hari)"
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

  <!-- Grafik utama 372 titik -->
  <Card class="p-4 sm:p-5">
    <CardHeader
      title={`Arus Penumpang Harian — ${champ.name} (${scopeLabel})`}
      subtitle="Garis solid mewakili realisasi riil (1 Jan – 29 Sep 2026). Garis putus-putus ungu mewakili kurva peramalan model terbaik (Okt 2026 – Jan 2027) dengan kalibrasi shock Nataru dari data latih 2025 dan pita keyakinan 95% CI. Total 372 titik, tersambung di 29 Sep 2026."
    >
      {#snippet icon()}<LineChart size={15} />{/snippet}
    </CardHeader>
    <Chart type="line" series={mainSeries} options={mainOptions} height={340} />
  </Card>

  <!-- Grafik YoY -->
  <Card class="p-4 sm:p-5">
    <CardHeader
      title="Pertumbuhan YoY Harian vs 2025"
      subtitle="Batang hijau di atas realisasi 2025, merah di bawahnya — skenario Moderat."
    >
      {#snippet icon()}<BarChart3 size={15} />{/snippet}
    </CardHeader>
    <Chart type="bar" series={yoySeries} options={yoyOptions} height={240} />
  </Card>

  <!-- Tabel rincian harian -->
  <Card class="p-4 sm:p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 class="text-[15px] font-extrabold tracking-tight text-ink">Tabel Rincian Harian Prediksi Mobilitas Multimoda (Horizon 100 Hari)</h3>
        <p class="mt-1 text-[12px] text-ink-3">Skenario Moderat • {scopeLabel} • YoY dihitung terhadap realisasi tanggal yang sama tahun 2025.</p>
      </div>
      <Segmented
        options={[
          { value: 'nataru', label: 'Posko Nataru (18H)' },
          { value: 'des', label: 'Desember' },
          { value: 'nov', label: 'November' },
          { value: 'okt', label: 'Oktober' },
          { value: 'all', label: 'Semua (100H)' },
        ]}
        value={fcRange}
        onChange={(v) => (fcRange = v)}
      />
    </div>
    <div class="mt-3 max-h-[520px] overflow-auto rounded-xl border border-line">
      <table class="w-full border-collapse text-left text-[12px]">
        <thead class="sticky top-0 z-10 bg-panel">
          <tr class="border-b border-line text-[10.5px] font-bold uppercase tracking-wider text-ink-3">
            <th class="px-3 py-2.5">Tanggal</th>
            <th class="px-3 py-2.5 text-right">Total</th>
            <th class="px-3 py-2.5 text-right">Udara</th>
            <th class="px-3 py-2.5 text-right">KA</th>
            <th class="px-3 py-2.5 text-right">Bus</th>
            <th class="px-3 py-2.5 text-right">ASDP</th>
            <th class="px-3 py-2.5 text-right">Laut</th>
            <th class="px-3 py-2.5 text-right">Armada</th>
            <th class="px-3 py-2.5 text-right">Total 2025</th>
            <th class="px-3 py-2.5 text-right">YoY</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          {#if tableRows.length === 0}
            <tr><td colspan="10" class="px-3 py-8 text-center text-ink-3">Tidak ada baris pada rentang ini.</td></tr>
          {/if}
          {#each tableRows as p}
            <tr class="hover:bg-fill">
              <td class="num whitespace-nowrap px-3 py-2 text-ink">{fmtDate(p.date)}</td>
              <td class="num px-3 py-2 text-right font-bold text-ink">{fmtInt(p.TOTAL)}</td>
              <td class="num px-3 py-2 text-right text-ink-2">{fmtInt(p.UDARA)}</td>
              <td class="num px-3 py-2 text-right text-ink-2">{fmtInt(p.KA)}</td>
              <td class="num px-3 py-2 text-right text-ink-2">{fmtInt(p.BUS)}</td>
              <td class="num px-3 py-2 text-right text-ink-2">{fmtInt(p.ASDP)}</td>
              <td class="num px-3 py-2 text-right text-ink-2">{fmtInt(p.LAUT)}</td>
              <td class="num px-3 py-2 text-right text-ink-2">{fmtInt(p.arm_TOTAL)}</td>
              <td class="num px-3 py-2 text-right text-ink-3">{fmtInt(p.base2025)}</td>
              <td class={`num px-3 py-2 text-right font-bold ${p.yoy >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmtPct(p.yoy)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
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
      <div class="mt-2">
        <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">11 model kandidat auto-model</p>
        <div class="flex flex-wrap gap-1.5">
          {#each MODEL_11 as m}
            <span class="num rounded-lg border border-line bg-fill px-2.5 py-1 text-[11px] font-semibold text-ink-2">{m}</span>
          {/each}
        </div>
        <p class="mt-2 text-[12px] leading-relaxed text-ink-3">
          Protokol: backtest holdout temporal 28 hari (2–29 Sep 2026, latih 609 hari) dengan metrik MAPE / WAPE / RMSE / MAE / akurasi arah + cek stabilitas horizon 100 hari. Champion = MAPE terendah di antara model stabil. Data latih 2025 per provinsi adalah rekonstruksi alokasi proporsional dari nasional memakai struktur moda 2026, bukan observasi langsung.
        </p>
      </div>
      {#if Object.keys(params).length > 0}
        <div class="mt-2">
          <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">Parameter model Holt-Winters (champion nasional)</p>
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
        <p class="mt-4 flex gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] p-3.5 text-[12.5px] leading-relaxed text-ink dark:text-amber-200/90">
          <Info size={15} class="mt-0.5 shrink-0" />
          {scenarioNote}
        </p>
      {/if}
    </Card>

    <!-- Breakdown moda -->
    <Card class="p-4 sm:p-5">
      <CardHeader
        title="Kontribusi per Moda"
        subtitle="Skenario Moderat — jendela Nataru 18 hari"
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
                  {#if b.armada_2026 !== undefined}
                    <p class="num text-[11.5px] text-ink-3">
                      Armada {fmtCompact(b.armada_2026)} trip • 2025: {fmtCompact(b.armada_2025 ?? 0)} trip
                    </p>
                  {/if}
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

  <!-- Tautan ke Rekomendasi -->
  <Card class="p-4 sm:p-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-[15px] font-extrabold tracking-tight text-ink">
          Rekomendasi Penambahan Armada (1.010 Simpul)
        </h3>
        <p class="mt-1 max-w-3xl text-[12px] leading-relaxed text-ink-3">
          Tabel rekomendasi kebutuhan penambahan armada di seluruh simpul prasarana nasional kini berada di halaman tersendiri.
        </p>
      </div>
      <a
        href={`${base}/rekomendasi`}
        class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-fill px-3 py-2 text-[12px] font-bold text-ink-2 transition-colors hover:text-ink"
      >
        <BookOpen size={14} class="text-accent" />
        Buka Tabel Rekomendasi
      </a>
    </div>
  </Card>
</div>
