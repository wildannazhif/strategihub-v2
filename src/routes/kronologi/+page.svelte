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

  interface ProvMonth {
    m: number;
    name: string;
    short: string;
    tot: number;
    brg: number;
    dat: number;
  }

  interface ProvEntry {
    provinsi: string;
    total_brg: number;
    peak_month: string;
    peak_vol: number;
    max_jump_pct: number;
    insight: string;
    monthly: ProvMonth[];
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

  const DIR_LABEL: Record<Direction, string> = { total: 'Total', dat: 'Datang', brg: 'Berangkat' };

  const timeline = data.daily_timeline;
  const dowRows = data.dow_summary;
  let metric = $state<Metric>('pnp');
  let dir = $state<Direction>('total');
  let active = $state<ModaKey[]>([...MODA_KEYS]);
  let prov = $state<string>(data.province_monthly_data.provinces[0] ?? '');

  const byProv = data.province_monthly_data.by_province as unknown as Record<string, ProvEntry>;
  const provEntry = $derived(byProv[prov]);

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

  const dowOptions = $derived.by<ApexOptions>(() => ({
    colors: dowRows.map((_, i) => (i >= 5 ? '#dc2626' : '#38bdf8')),
    plotOptions: { bar: { distributed: true, borderRadius: 7, columnWidth: '55%' } },
    dataLabels: {
      enabled: true,
      formatter: (v: number | string) => fmtCompact(Number(v)),
      offsetY: -8,
      style: { fontFamily: MONO, fontSize: '10px', colors: ['#a7b3c7'] },
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
        return `<div style="font-family:${FONT};padding:4px 2px"><b>${r.dow}</b> <span style="color:#94a3b8">• rata-rata harian</span><div style="margin-top:6px">${rows}</div><div style="margin-top:6px;display:flex;justify-content:space-between"><span>Total</span><b style="font-family:${MONO}">${fmtInt(valOf(metric, dir, r, 'TOTAL'))} ${unitShort}</b></div></div>`;
      },
    },
  }));

  /* ---------- Mini bar provinsi ---------- */
  const provData = $derived.by(() => {
    if (!provEntry) return null;
    let peakIdx = 0;
    provEntry.monthly.forEach((e, i) => {
      if (e.tot > provEntry.monthly[peakIdx].tot) peakIdx = i;
    });
    return {
      peakIdx,
      values: provEntry.monthly.map((e) => e.tot),
      cats: provEntry.monthly.map((e) => e.short),
    };
  });

  const provSeries: ApexOptions['series'] = $derived(
    provData ? [{ name: 'Penumpang', data: provData.values }] : [],
  );

  const provOptions = $derived.by<ApexOptions | null>(() => {
    if (!provData) return null;
    return {
      colors: provData.cats.map((_, i) => (i === provData.peakIdx ? '#f59e0b' : '#38bdf8')),
      plotOptions: { bar: { distributed: true, borderRadius: 5, columnWidth: '55%' } },
      legend: { show: false },
      xaxis: { categories: provData.cats },
      tooltip: { y: { formatter: (v: number | string) => `${fmtInt(Number(v))} pnp` } },
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
          on ? 'border-transparent text-white shadow-sm' : 'border-white/10 bg-white/[0.03] text-ink-3 hover:text-ink'
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
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
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

  <!-- Sorotan provinsi -->
  <Card class="p-4">
    <CardHeader
      title="Sorotan Provinsi"
      subtitle="Pilih provinsi untuk melihat pola bulanan dan catatan wawasan."
    >
      {#snippet icon()}<MapPin size={16} />{/snippet}
      {#snippet action()}
        <label class="inline-flex items-center gap-2 text-[12.5px] font-semibold text-ink-3">
          <MapPin size={15} class="text-[#38bdf8]" />
          <select
            value={prov}
            onchange={(e) => (prov = (e.target as HTMLSelectElement).value)}
            class="max-w-[240px] cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] font-semibold text-ink outline-none focus:border-[#38bdf8]"
          >
            {#each data.province_monthly_data.provinces as p}
              <option value={p}>{p}</option>
            {/each}
          </select>
        </label>
      {/snippet}
    </CardHeader>
    {#if provEntry}
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div class="lg:col-span-2">
          <div class="flex flex-wrap gap-2">
            <Badge color="#f59e0b">
              <CalendarDays size={12} /> Puncak: {provEntry.peak_month}
            </Badge>
            <Badge color="#fb7185">
              <TrendingUp size={12} /> Lonjakan maks {fmtPct(provEntry.max_jump_pct, 1)}
            </Badge>
          </div>
          <p class="mt-4 text-[14px] leading-relaxed text-ink-2">
            {provEntry.insight}
          </p>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <div class="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
              <p class="text-[11.5px] font-semibold text-ink-3">Total berangkat YTD</p>
              <p class="num mt-1 text-xl font-extrabold text-ink">
                {fmtCompact(provEntry.total_brg)}
              </p>
            </div>
            <div class="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
              <p class="text-[11.5px] font-semibold text-ink-3">Volume puncak</p>
              <p class="num mt-1 text-xl font-extrabold text-ink">
                {fmtCompact(provEntry.peak_vol)}
              </p>
            </div>
          </div>
        </div>
        <div class="lg:col-span-3">
          <p class="mb-2 text-[12.5px] font-bold text-ink-3">
            Penumpang bulanan — {provEntry.provinsi} (batang kuning = bulan puncak)
          </p>
          {#if provOptions}
            <Chart type="bar" series={provSeries} options={provOptions} height={200} />
          {/if}
        </div>
      </div>
    {:else}
      <p class="text-sm text-ink-3">Data provinsi tidak tersedia.</p>
    {/if}
  </Card>
</div>
