<script lang="ts">
  import Chart from '$lib/components/Chart.svelte';
  import Card from '$lib/components/Card.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import Segmented from '$lib/components/Segmented.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import { FONT, MONO } from '$lib/components/chart-utils';
  import { data, MODA_KEYS } from '$lib/data';
  import { MODA } from '$lib/moda';
  import { fmtCompact, fmtInt, fmtPct } from '$lib/format';
  import { themeStore, chartTheme } from '$lib/theme.svelte';
  import type { ApexOptions } from 'apexcharts';
  import type { ModaKey, DailyRow } from '$lib/data/types';
  import CalendarDays from 'lucide-svelte/icons/calendar-days';
  import MapPin from 'lucide-svelte/icons/map-pin';
  import TrendingUp from 'lucide-svelte/icons/trending-up';
  import Activity from 'lucide-svelte/icons/activity';
  import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
  import CalendarRange from 'lucide-svelte/icons/calendar-range';

  type Metric = 'pnp' | 'arm';
  type Direction = 'total' | 'dat' | 'brg';

  const MONTH_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  /* Bentuk baru province_monthly_data: per kombinasi metrik
     { provinces, by_province: { [prov]: { provinsi, total, peak_month, peak_vol,
       median_vol, baseline_vol, moda_baselines, max_jump_pct,
       max_jump_vs_median_pct, monthly: [{ m, name, short, val, mom, vs_median, modas }] } } } */
  interface ProvMonthNew {
    m: number;
    name: string;
    short: string;
    val?: number;
    tot?: number;
    brg?: number;
    mom?: number | null;
    vs_median?: number | null;
    dom_moda?: string;
    dom_pct?: number;
    is_peak?: boolean;
    modas?: Partial<Record<ModaKey, number>>;
  }

  interface ProvEntryNew {
    provinsi: string;
    total?: number;
    total_brg?: number;
    peak_month: string;
    peak_month_num?: number;
    peak_vol: number;
    median_vol?: number;
    baseline_vol?: number;
    moda_baselines?: Partial<Record<ModaKey, number>>;
    max_jump_month?: string;
    max_jump_pct?: number;
    max_jump_vs_median_pct?: number;
    monthly: ProvMonthNew[];
  }

  const COMBO_LABEL: Record<string, string> = {
    pnp_brg: 'Penumpang Berangkat',
    pnp_dat: 'Penumpang Datang',
    pnp_tot: 'Total Penumpang',
    arm_brg: 'Armada Berangkat',
    arm_dat: 'Armada Datang',
    arm_tot: 'Total Armada',
  };

  type ProvModa = ModaKey | 'ALL';

  /** Nilai bulanan pada metrik aktif (fallback bentuk lama: tot/brg) */
  function monthVal(mm: ProvMonthNew): number {
    return mm.val ?? mm.tot ?? mm.brg ?? 0;
  }

  /** Ambil nilai sel sesuai metrik + arah yang dipilih */
  function valOf(metric: Metric, dir: Direction, r: DailyRow, m: ModaKey | 'TOTAL'): number {
    const k =
      metric === 'pnp'
        ? dir === 'total'
          ? m
          : `${dir === 'dat' ? 'pdat' : 'pbrg'}_${m}`
        : dir === 'total'
          ? `arm_${m}`
          : `${dir === 'dat' ? 'adat' : 'abrg'}_${m}`;
    return (r[k] as number) ?? 0;
  }

  const ct = $derived(chartTheme(themeStore.current === 'dark'));

  const DIR_LABEL: Record<Direction, string> = { total: 'Total', dat: 'Datang', brg: 'Berangkat' };

  const timeline = data.daily_timeline;
  const dowRows = data.dow_summary;
  let metric = $state<Metric>('pnp');
  let dir = $state<Direction>('total');
  let active = $state<ModaKey[]>([...MODA_KEYS]);
  let prov = $state<string>('ALL');
  let provModa = $state<ProvModa>('ALL');

  const pmd = data.province_monthly_data as unknown as Record<string, any>;
  const comboKey = $derived(`${metric}_${dir === 'total' ? 'tot' : dir}`);
  const comboBlock = $derived(
    (pmd[comboKey] as { provinces?: string[]; by_province?: Record<string, ProvEntryNew> } | undefined)
      ?? (pmd.by_metric as Record<string, { provinces?: string[]; by_province?: Record<string, ProvEntryNew> }> | undefined)?.[comboKey]
      ?? (pmd as unknown as { provinces?: string[]; by_province?: Record<string, ProvEntryNew> }),
  );
  const provList = $derived(
    [...((comboBlock.provinces ?? pmd.provinces ?? []) as string[])]
      .filter((p) => p !== 'ALL' && p !== 'Seluruh Provinsi')
      .sort((a, b) => a.localeCompare(b, 'id', { sensitivity: 'base' })),
  );
  const byProv = $derived<Record<string, ProvEntryNew>>(comboBlock.by_province ?? {});
  const provEntry = $derived<ProvEntryNew | undefined>(
    byProv[prov] ?? (prov === 'ALL' ? byProv[provList[0]] : undefined),
  );
  const provJump = $derived(provEntry?.max_jump_vs_median_pct ?? provEntry?.max_jump_pct ?? 0);
  const scopeBaseline = $derived.by(() => {
    if (!provEntry) return 0;
    if (provModa === 'ALL') return provEntry.baseline_vol ?? provEntry.median_vol ?? 0;
    return provEntry.moda_baselines?.[provModa] ?? provEntry.baseline_vol ?? provEntry.median_vol ?? 0;
  });

  function toggleModa(m: ModaKey) {
    active = active.includes(m) ? active.filter((x) => x !== m) : [...active, m];
  }

  const shownModas = $derived(active.length > 0 ? active : [...MODA_KEYS]);
  const unitShort = $derived(metric === 'pnp' ? 'pnp' : 'trip');

  /* ---------- Grafik utama: line multi-moda 272 hari ---------- */
  const mainSeries = $derived<ApexOptions['series']>(
    shownModas.map((m) => ({
      name: MODA[m].label,
      data: timeline.map((r) => valOf(metric, dir, r, m)),
    })),
  );

  const mainOptions = $derived.by<ApexOptions>(() => {
    const dates = timeline.map((r) => r.date);
    const totals = timeline.map((r) => valOf(metric, dir, r, 'TOTAL'));
    let peakIdx = 0;
    totals.forEach((v, i) => {
      if (v > totals[peakIdx]) peakIdx = i;
    });
    return {
      colors: shownModas.map((m) => MODA[m].color),
      legend: { position: 'top', horizontalAlign: 'left' },
      xaxis: {
        categories: dates,
        tickAmount: 12,
        labels: {
          hideOverlappingLabels: true,
          formatter: (v: string | number) =>
            typeof v === 'string' && v.length >= 10 ? v.slice(5).replace('-', '/') : '',
        },
      },
      tooltip: { y: { formatter: (v: number | string) => `${fmtInt(Number(v))} ${unitShort}` } },
      annotations: {
        xaxis: [
          {
            x: '2026-03-13',
            x2: '2026-03-29',
            fillColor: '#d97706',
            opacity: 0.12,
            label: {
              text: 'Lebaran 2026',
              style: { color: '#d97706', fontSize: '11px', fontWeight: 700, fontFamily: FONT },
            },
          },
          {
            x: dates[peakIdx],
            borderColor: '#dc2626',
            strokeDashArray: 4,
            label: {
              text: `Puncak ${fmtCompact(totals[peakIdx])}`,
              style: { color: '#dc2626', fontSize: '11px', fontWeight: 700, fontFamily: FONT },
            },
          },
        ],
      },
    };
  });

  /* ---------- Agregasi bulanan (dari harian, ikut metrik+arah) ---------- */
  const monthAgg = $derived.by(() => {
    const map = new Map<string, { key: string; label: string; vals: Record<string, number> }>();
    for (const r of timeline) {
      const key = r.date.slice(0, 7);
      let e = map.get(key);
      if (!e) {
        const mo = Number(key.split('-')[1]);
        e = { key, label: MONTH_ID[mo - 1] ?? key, vals: {} };
        map.set(key, e);
      }
      for (const m of MODA_KEYS) e.vals[m] = (e.vals[m] ?? 0) + valOf(metric, dir, r, m);
    }
    return [...map.values()];
  });

  const monthlySeries = $derived<ApexOptions['series']>(
    shownModas.map((m) => ({ name: MODA[m].short, data: monthAgg.map((e) => e.vals[m] ?? 0) })),
  );

  const monthlyOptions = $derived<ApexOptions>({
    chart: { stacked: true },
    colors: shownModas.map((m) => MODA[m].color),
    legend: { position: 'top', horizontalAlign: 'left' },
    plotOptions: { bar: { borderRadius: 3, columnWidth: '62%' } },
    xaxis: { categories: monthAgg.map((e) => e.label.slice(0, 3)) },
    tooltip: { y: { formatter: (v: number | string) => `${fmtInt(Number(v))} ${unitShort}` } },
  });

  /* ---------- Pola hari dalam minggu ---------- */
  const dowSeries = $derived<ApexOptions['series']>([
    { name: 'Rata-rata harian', data: dowRows.map((r) => valOf(metric, dir, r, 'TOTAL')) },
  ]);

  const dowOptions = $derived.by<ApexOptions>(() => {
    const faint = ct.faint;
    return ({
    colors: dowRows.map((_, i) => (i >= 5 ? '#dc2626' : '#38bdf8')),
    plotOptions: { bar: { distributed: true, borderRadius: 7, columnWidth: '55%', dataLabels: { position: 'top' } } },
    dataLabels: {
      enabled: true,
      formatter: (v: number | string) => fmtCompact(Number(v)),
      offsetY: -16,
      style: { fontFamily: MONO, fontSize: '10px', colors: [ct.soft] },
    },
    legend: { show: false },
    xaxis: { categories: dowRows.map((r) => r.dow as string) },
    yaxis: { labels: { formatter: (v: number | string) => `${Math.round(Number(v) / 1e3)} rb` } },
    tooltip: {
      custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
        const r: DailyRow = dowRows[dataPointIndex];
        const rows = MODA_KEYS.map(
          (m) =>
            `<div style="display:flex;justify-content:space-between;gap:16px"><span><span style="display:inline-block;width:8px;height:8px;border-radius:99px;background:${MODA[m].color};margin-right:6px"></span>${MODA[m].short}</span><b style="font-family:${MONO}">${fmtInt(valOf(metric, dir, r, m))}</b></div>`,
        ).join('');
        return `<div style="font-family:${FONT};padding:4px 2px"><b>${r.dow}</b> <span style="color:${faint}">• rata-rata harian</span><div style="margin-top:6px">${rows}</div><div style="margin-top:6px;display:flex;justify-content:space-between"><span>Total</span><b style="font-family:${MONO}">${fmtInt(valOf(metric, dir, r, 'TOTAL'))} ${unitShort}</b></div></div>`;
      },
    },
    });
  });

  /* ---------- Chart provinsi: stacked per moda (ALL) / batang tunggal (satu moda) ---------- */
  const provSeries: ApexOptions['series'] = $derived.by(() => {
    if (!provEntry) return [];
    const months = provEntry.monthly ?? [];
    if (provModa === 'ALL') {
      return MODA_KEYS.map((m) => ({
        name: MODA[m].label,
        data: months.map((mm) => mm.modas?.[m] ?? 0),
      }));
    }
    const singleModa = provModa as ModaKey;
    return [
      {
        name: MODA[singleModa].label,
        data: months.map((mm) => mm.modas?.[singleModa] ?? monthVal(mm)),
      },
    ];
  });

  const provOptions = $derived.by<ApexOptions | null>(() => {
    if (!provEntry) return null;
    const months = provEntry.monthly ?? [];
    const stacked = provModa === 'ALL';
    const singleModa: ModaKey = provModa === 'ALL' ? 'UDARA' : provModa;
    return {
      chart: { stacked },
      colors: stacked ? MODA_KEYS.map((m) => MODA[m].color) : [MODA[singleModa].color],
      legend: { show: stacked, position: 'top', horizontalAlign: 'left' },
      plotOptions: { bar: { borderRadius: stacked ? 0 : 5, columnWidth: '62%' } },
      xaxis: {
        categories: months.map((mm) => mm.short ?? MONTH_ID[(mm.m ?? 1) - 1]?.slice(0, 3) ?? ''),
      },
      tooltip: { y: { formatter: (v: number | string) => `${fmtInt(Number(v))} ${unitShort}` } },
    };
  });

  const metricOpts = [
    { value: 'pnp' as Metric, label: 'Penumpang' },
    { value: 'arm' as Metric, label: 'Armada' },
  ];
  const dirOpts = [
    { value: 'total' as Direction, label: 'Total' },
    { value: 'dat' as Direction, label: 'Datang' },
    { value: 'brg' as Direction, label: 'Berangkat' },
  ];
</script>

<div class="space-y-4">
  <CardHeader
    title="Kronologi Harian"
    subtitle={`${DIR_LABEL[dir]} ${metric === 'pnp' ? 'penumpang' : 'armada'} harian, 1 Januari – 28 September 2026 (${timeline.length} hari). Zona kuning menandai periode Lebaran.`}
  >
    {#snippet icon()}<Activity size={16} />{/snippet}
    {#snippet action()}
      <div class="flex flex-wrap items-center gap-2">
        <Segmented size="sm" options={metricOpts} value={metric} onChange={(v) => (metric = v)} />
        <Segmented size="sm" options={dirOpts} value={dir} onChange={(v) => (dir = v)} />
      </div>
    {/snippet}
  </CardHeader>

  <!-- Toggle moda -->
  <div class="flex flex-wrap gap-2">
    {#each MODA_KEYS as m}
      {@const on = active.includes(m)}
      <button
        onclick={() => toggleModa(m)}
        class={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${
          on ? 'border-transparent text-white shadow-sm' : 'border-line bg-fill text-ink-3 hover:text-ink'
        }`}
        style={on ? `background: ${MODA[m].color}` : undefined}
      >
        <span class="size-2 rounded-full" style={`background: ${on ? '#fff' : MODA[m].color}`}></span>
        {MODA[m].label}
      </button>
    {/each}
  </div>

  <!-- Grafik utama -->
  <Card class="p-4">
    <CardHeader
      title={`${DIR_LABEL[dir]} ${metric === 'pnp' ? 'Penumpang' : 'Armada'} per Moda`}
      subtitle="Seret untuk zoom, arahkan kursor untuk detail harian."
    >
      {#snippet icon()}<TrendingUp size={16} />{/snippet}
    </CardHeader>
    <Chart type="line" series={mainSeries} options={mainOptions} height={320} />
  </Card>

  <!-- Agregasi bulanan + pola mingguan -->
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <Card class="p-4">
      <CardHeader
        title="Total Bulanan per Moda"
        subtitle={`${DIR_LABEL[dir].toLowerCase()} ${metric === 'pnp' ? 'penumpang' : 'armada'} — Januari hingga September 2026`}
      >
        {#snippet icon()}<BarChart3 size={16} />{/snippet}
      </CardHeader>
      <Chart type="bar" series={monthlySeries} options={monthlyOptions} height={260} />
    </Card>
    <Card class="p-4">
      <CardHeader
        title="Pola Hari dalam Minggu"
        subtitle="Rata-rata harian per hari — batang merah menandai akhir pekan."
      >
        {#snippet icon()}<CalendarRange size={16} />{/snippet}
      </CardHeader>
      <Chart type="bar" series={dowSeries} options={dowOptions} height={260} />
    </Card>
  </div>

  <!-- Tren provinsi -->
  <Card class="p-4">
    <CardHeader
      title="Tren & Lonjakan Bulanan per Provinsi"
      subtitle="Cek tren pergerakan bulanan dan analisis lonjakan terhadap baseline median pra-Lebaran (1 Jan–12 Mar 2026)."
    >
      {#snippet icon()}<MapPin size={16} />{/snippet}
      {#snippet action()}
        <div class="flex flex-wrap items-center gap-2">
          <label class="inline-flex items-center gap-2 text-[12.5px] font-semibold text-ink-3">
            <MapPin size={15} class="text-[#38bdf8]" />
            <select
              value={prov}
              onchange={(e) => (prov = (e.target as HTMLSelectElement).value)}
              class="max-w-[240px] cursor-pointer rounded-xl border border-line bg-fill px-3 py-2 text-[13px] font-semibold text-ink outline-none focus:border-[#38bdf8]"
            >
              <option value="ALL">Seluruh Provinsi (Nasional)</option>
              {#each provList as p}
                <option value={p}>{p}</option>
              {/each}
            </select>
          </label>
          <label class="inline-flex items-center gap-2 text-[12.5px] font-semibold text-ink-3">
            <select
              value={provModa}
              onchange={(e) => (provModa = (e.target as HTMLSelectElement).value as ProvModa)}
              class="max-w-[200px] cursor-pointer rounded-xl border border-line bg-fill px-3 py-2 text-[13px] font-semibold text-ink outline-none focus:border-[#38bdf8]"
            >
              <option value="ALL">Semua Moda (5 Moda)</option>
              {#each MODA_KEYS as m}
                <option value={m}>{MODA[m].label}</option>
              {/each}
            </select>
          </label>
        </div>
      {/snippet}
    </CardHeader>
    {#if provEntry}
      <div class="flex flex-wrap gap-2">
        <Badge color="#f59e0b">
          <CalendarDays size={12} /> Puncak: {provEntry.peak_month} • {fmtCompact(provEntry.peak_vol)}
        </Badge>
        <Badge color="#fb7185">
          <TrendingUp size={12} /> Lonjakan vs Median {fmtPct(provJump, 1)}
        </Badge>
        <Badge color="#38bdf8">
          Baseline median pra-Lebaran: {fmtCompact(scopeBaseline)}/bln
        </Badge>
      </div>
      <div class="mt-4 grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-line bg-fill p-3.5">
          <p class="text-[11.5px] font-semibold text-ink-3">Total {COMBO_LABEL[comboKey] ?? ''} YTD</p>
          <p class="num mt-1 text-xl font-extrabold text-ink">
            {fmtCompact(provEntry.total ?? provEntry.total_brg ?? 0)}
          </p>
        </div>
        <div class="rounded-xl border border-line bg-fill p-3.5">
          <p class="text-[11.5px] font-semibold text-ink-3">Volume puncak</p>
          <p class="num mt-1 text-xl font-extrabold text-ink">
            {fmtCompact(provEntry.peak_vol)}
          </p>
        </div>
      </div>
      <p class="mb-2 mt-5 text-[12.5px] font-bold text-ink-3">
        {COMBO_LABEL[comboKey] ?? ''} bulanan — {provEntry.provinsi}
        {provModa === 'ALL' ? '(stacked per moda)' : `— Moda ${MODA[provModa].label}`}
      </p>
      {#if provOptions}
        <Chart type="bar" series={provSeries} options={provOptions} height={240} />
      {/if}
      <div class="mt-5 overflow-x-auto rounded-xl border border-line">
        <table class="w-full min-w-[760px] text-left text-[12.5px]">
          <thead>
            <tr class="bg-fill">
              <th class="px-3 py-2.5 text-left font-bold text-ink-2">Bulan</th>
              {#each MODA_KEYS as m}
                <th class="num px-3 py-2.5 text-right font-bold text-ink-2">{MODA[m].short}</th>
              {/each}
              <th class="num px-3 py-2.5 text-right font-bold text-ink-2">Total</th>
              <th class="num px-3 py-2.5 text-right font-bold text-ink-2">vs Median (1 Jan–12 Mar)</th>
            </tr>
          </thead>
          <tbody>
            {#each provEntry.monthly ?? [] as mm}
              {@const total = monthVal(mm)}
              {@const modaVal = provModa === 'ALL' ? total : (mm.modas?.[provModa] ?? total)}
              {@const vsMed =
                provModa === 'ALL'
                  ? (mm.vs_median ?? (scopeBaseline > 0 ? ((total - scopeBaseline) / scopeBaseline) * 100 : null))
                  : scopeBaseline > 0
                    ? ((modaVal - scopeBaseline) / scopeBaseline) * 100
                    : null}
              <tr class="border-t border-line transition-colors hover:bg-fill">
                <td class="px-3 py-2 font-semibold text-ink-2">{mm.name}</td>
                {#each MODA_KEYS as m}
                  <td
                    class={`num px-3 py-2 text-right text-ink-2 ${provModa === m ? 'bg-accent/[0.06] font-bold text-ink' : ''}`}
                  >
                    {fmtInt(mm.modas?.[m] ?? 0)}
                  </td>
                {/each}
                <td class="num px-3 py-2 text-right font-bold text-ink">{fmtInt(total)}</td>
                <td
                  class={`num px-3 py-2 text-right font-bold ${(vsMed ?? 0) > 0 ? 'text-emerald-400' : (vsMed ?? 0) < 0 ? 'text-rose-400' : 'text-ink-3'}`}
                >
                  {vsMed == null ? '–' : fmtPct(vsMed, 1)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="mt-3 text-[11.5px] text-ink-3">
        vs Median = deviasi volume bulanan terhadap baseline median pra-Lebaran (1 Jan–12 Mar 2026),
        bukan pertumbuhan MoM.
      </p>
    {:else}
      <p class="text-sm text-ink-3">Data provinsi tidak tersedia.</p>
    {/if}
  </Card>
</div>
