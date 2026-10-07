<script lang="ts">
  import Users from 'lucide-svelte/icons/users';
  import Flame from 'lucide-svelte/icons/flame';
  import CalendarDays from 'lucide-svelte/icons/calendar-days';
  import Bus from 'lucide-svelte/icons/bus';
  import TrendingUp from 'lucide-svelte/icons/trending-up';
  import PieChartIcon from 'lucide-svelte/icons/pie-chart';
  import Trophy from 'lucide-svelte/icons/trophy';
  import Table2 from 'lucide-svelte/icons/table-2';
  import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
  import Lightbulb from 'lucide-svelte/icons/lightbulb';
  import type { ApexOptions } from 'apexcharts';
  import Chart from '$lib/components/Chart.svelte';
  import { FONT, MONO } from '$lib/components/chart-utils';
  import Card from '$lib/components/Card.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import KpiCard from '$lib/components/KpiCard.svelte';
  import { data, MODA_KEYS } from '$lib/data';
  import { MODA } from '$lib/moda';
  import { fmtCompact, fmtInt, fmtPct, fmtDate } from '$lib/format';

  const meta = data.meta;
  const timeline = data.daily_timeline;
  const monthly = data.monthly_summary;
  const simpul = data.simpul_recommendations;

  const totalByModa: Record<string, number> = $derived.by(() => {
    const t: Record<string, number> = {};
    for (const m of MODA_KEYS) t[m] = timeline.reduce((s, r) => s + (r[m] as number), 0);
    return t;
  });
  const grandTotal = $derived(MODA_KEYS.reduce((s, m) => s + totalByModa[m], 0));
  const topModa = $derived(MODA_KEYS.reduce((a, b) => (totalByModa[a] >= totalByModa[b] ? a : b)));

  const sparkData = $derived(timeline.filter((_, i) => i % 4 === 0).map((r) => r.TOTAL as number));

  /* ---------- Tren area ---------- */
  const areaSeries: ApexOptions['series'] = $derived([
    ...MODA_KEYS.map((m) => ({
      name: MODA[m].label,
      type: 'area' as const,
      data: timeline.map((r) => r[m] as number),
    })),
    { name: 'Total', type: 'line' as const, data: timeline.map((r) => r.TOTAL as number) },
  ]);

  const areaOptions: ApexOptions = $derived({
    chart: { stacked: true, toolbar: { show: false }, zoom: { enabled: false } },
    colors: [...MODA_KEYS.map((m) => MODA[m].color), '#f1f5f9'],
    legend: { position: 'top', horizontalAlign: 'left' },
    stroke: { width: [1.5, 1.5, 1.5, 1.5, 1.5, 2.5] },
    fill: { type: 'solid', opacity: [0.22, 0.22, 0.22, 0.22, 0.22, 0] },
    xaxis: {
      categories: timeline.map((r) => r.date),
      tickAmount: 9,
      labels: {
        formatter: (v: string | number) =>
          typeof v === 'string' && v.length >= 10 ? v.slice(5).replace('-', '/') : '',
      },
    },
    tooltip: { y: { formatter: (v: number | string) => `${fmtInt(Number(v))} pnp` } },
    annotations: {
      xaxis: [
        {
          x: '2026-03-13',
          x2: '2026-03-29',
          fillColor: '#f59e0b',
          opacity: 0.08,
          label: { text: 'Lebaran 2026', style: { color: '#f59e0b', fontWeight: 700, fontFamily: FONT } },
        },
      ],
    },
  });

  /* ---------- Donat ---------- */
  const donutSeries: ApexOptions['series'] = $derived(MODA_KEYS.map((m) => totalByModa[m]));
  const donutOptions: ApexOptions = $derived({
    labels: MODA_KEYS.map((m) => MODA[m].label),
    colors: MODA_KEYS.map((m) => MODA[m].color),
    chart: { toolbar: { show: false } },
    legend: { position: 'bottom', fontSize: '11px' },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              fontSize: '12px',
              fontWeight: 700,
              color: '#8b98ad',
              formatter: () => fmtCompact(grandTotal),
            },
            value: { fontFamily: MONO, fontSize: '20px', fontWeight: 800, color: '#e8eef7' },
            name: { fontFamily: FONT, fontSize: '11px', color: '#8b98ad' },
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (v: number) => `${v.toFixed(0)}%`,
      style: { fontSize: '11px', fontWeight: 700 },
    },
    tooltip: { y: { formatter: (v: number) => `${fmtInt(v)} pnp` } },
  });

  /* ---------- Top 5 simpul ---------- */
  const top5 = $derived([...simpul].sort((a, b) => b.pnpPuncak - a.pnpPuncak).slice(0, 5));
  const top5Series: ApexOptions['series'] = $derived([{ name: 'Puncak', data: top5.map((s) => s.pnpPuncak) }]);
  const top5Options: ApexOptions = $derived({
    colors: top5.map((s) => (MODA as any)[s.moda]?.color ?? '#38bdf8'),
    chart: { toolbar: { show: false } },
    legend: { show: false },
    plotOptions: {
      bar: { horizontal: true, distributed: true, borderRadius: 5, barHeight: '58%', dataLabels: { position: 'right' } },
    },
    dataLabels: {
      enabled: true,
      formatter: (v: number | string) => fmtCompact(Number(v)),
      offsetX: 8,
      style: { fontFamily: MONO, fontSize: '11px', fontWeight: 700, colors: ['#a7b3c7'] },
    },
    xaxis: { categories: top5.map((s) => s.name), max: Math.max(...top5.map((s) => s.pnpPuncak)) * 1.22 },
    yaxis: {
      labels: {
        style: { fontFamily: FONT, colors: '#a7b3c7' },
        formatter: (v: string | number) => (typeof v === 'string' && v.length > 14 ? `${v.slice(0, 13)}…` : String(v)),
      },
    },
    grid: { padding: { right: 44 } },
    tooltip: {
      y: {
        formatter: (_v: number | string, opts: any) => {
          const s = top5[opts.dataPointIndex];
          return s ? `${fmtInt(s.pnpPuncak)} pnp • ${s.prov}` : '';
        },
      },
    },
  });

  /* ---------- Kombo bulanan ---------- */
  const comboSeries: ApexOptions['series'] = $derived([
    { name: 'Penumpang', type: 'bar' as const, data: monthly.map((r) => Number((r.TOTAL / 1e6).toFixed(1))) },
    { name: 'Armada', type: 'line' as const, data: monthly.map((r) => Number((Number(r.TOTAL_ARMADA ?? 0) / 1e3).toFixed(1))) },
  ]);
  const comboOptions: ApexOptions = $derived({
    colors: ['#38bdf8', '#f59e0b'],
    chart: { toolbar: { show: false } },
    legend: { position: 'top', horizontalAlign: 'left' },
    stroke: { width: [0, 2.5] },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
    xaxis: { categories: monthly.map((r) => r.label.slice(0, 3)) },
    yaxis: [
      { seriesName: 'Penumpang', labels: { formatter: (v: number) => `${v} jt` } },
      { seriesName: 'Armada', opposite: true, labels: { formatter: (v: number) => `${v} rb` } },
    ],
    tooltip: {
      shared: true,
      y: [{ formatter: (v: number) => `${v} jt pnp` }, { formatter: (v: number) => `${v} rb trip` }],
    },
  });

  /* ---------- Sparkline KPI ---------- */
  const sparkOptions: ApexOptions = {
    chart: { sparkline: { enabled: true }, toolbar: { show: false } },
    stroke: { width: 2 },
    colors: ['#38bdf8'],
    fill: { type: 'solid', opacity: 0.18 },
    tooltip: { enabled: false },
  };

  const top8 = $derived([...simpul].sort((a, b) => b.pnpPuncak - a.pnpPuncak).slice(0, 8));

  const STATUS_COLOR: Record<string, string> = {
    'Sangat Kritis': '#fb7185',
    'Tinggi / Kritis': '#fb923c',
    Kritis: '#fb923c',
    Waspada: '#fbbf24',
    Terkendali: '#34d399',
  };

  const insights = $derived([
    { color: '#fb7185', text: `Puncak ${fmtDate(meta.all_time_peak_date)} mencapai ${fmtCompact(meta.all_time_peak_val)} penumpang (+${fmtPct(meta.all_time_peak_surge_pct, 1)} vs hari normal).` },
    { color: '#38bdf8', text: `${MODA[topModa].label} dominan dengan ${fmtPct((totalByModa[topModa] / grandTotal) * 100, 1)} pangsa YTD.` },
    { color: '#f59e0b', text: `Arus mudik H-3 (${fmtDate(meta.peak_mudik_date)}) menembus ${fmtCompact(meta.peak_mudik_val)} penumpang (+${fmtPct(meta.peak_mudik_surge_pct, 1)}).` },
    { color: '#a78bfa', text: `Simpul tersibuk: ${top5[0]?.name ?? '-'} (${fmtInt(top5[0]?.pnpPuncak ?? 0)} pnp saat puncak).` },
    { color: '#34d399', text: `${fmtCompact(meta.total_armada_ytd)} trip armada beroperasi selama ${meta.days_count} hari.` },
  ]);
</script>

<div class="space-y-4">
  <!-- KPI -->
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <KpiCard label="Total Penumpang" value={fmtCompact(meta.total_passengers_ytd)} sub={`${meta.days_count} hari • ${fmtInt(meta.total_clean_rows)} baris`} accent="#38bdf8">
      {#snippet icon()}<Users size={19} />{/snippet}
      {#snippet spark()}<Chart type="area" series={[{ name: 'Harian', data: sparkData }]} options={sparkOptions} height={36} />{/snippet}
    </KpiCard>
    <KpiCard label="Puncak Pergerakan" value={fmtCompact(meta.all_time_peak_val)} delta={meta.all_time_peak_surge_pct} deltaLabel="hari normal" sub={fmtDate(meta.all_time_peak_date)} accent="#fb7185">
      {#snippet icon()}<Flame size={19} />{/snippet}
    </KpiCard>
    <KpiCard label="Puncak Mudik (H-3)" value={fmtCompact(meta.peak_mudik_val)} delta={meta.peak_mudik_surge_pct} deltaLabel="hari normal" sub={meta.peak_mudik_date ? fmtDate(meta.peak_mudik_date) : ''} accent="#f59e0b">
      {#snippet icon()}<CalendarDays size={19} />{/snippet}
    </KpiCard>
    <KpiCard label="Total Armada" value={`${fmtCompact(meta.total_armada_ytd)} trip`} sub={`${fmtInt(Math.round(meta.total_armada_ytd / meta.days_count))} trip/hari`} accent="#34d399">
      {#snippet icon()}<Bus size={19} />{/snippet}
    </KpiCard>
  </div>

  <!-- Grafik utama -->
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-12">
    <Card class="p-4 sm:p-5 xl:col-span-8">
      <CardHeader title="Tren Penumpang Harian" subtitle="Area bertumpuk 272 hari • zona kuning = Lebaran 2026">
        {#snippet icon()}<TrendingUp size={15} />{/snippet}
      </CardHeader>
      <Chart type="area" series={areaSeries} options={areaOptions} height={320} />
    </Card>
    <Card class="p-4 sm:p-5 xl:col-span-4">
      <CardHeader title="Pangsa Moda" subtitle="Komposisi YTD">
        {#snippet icon()}<PieChartIcon size={15} />{/snippet}
      </CardHeader>
      <Chart type="donut" series={donutSeries} options={donutOptions} height={320} />
    </Card>
  </div>

  <!-- Baris kedua -->
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-12">
    <Card class="p-4 sm:p-5 xl:col-span-4">
      <CardHeader title="Top 5 Simpul" subtitle="Penumpang saat puncak">
        {#snippet icon()}<Trophy size={15} />{/snippet}
      </CardHeader>
      <Chart type="bar" series={top5Series} options={top5Options} height={300} />
    </Card>
    <Card class="p-4 sm:p-5 xl:col-span-4">
      <CardHeader title="Penumpang vs Armada" subtitle="Agregasi bulanan">
        {#snippet icon()}<BarChart3 size={15} />{/snippet}
      </CardHeader>
      <Chart type="bar" series={comboSeries} options={comboOptions} height={300} />
    </Card>
    <Card class="p-4 sm:p-5 xl:col-span-4">
      <CardHeader title="Insight Cepat" subtitle="Dihitung otomatis">
        {#snippet icon()}<Lightbulb size={15} />{/snippet}
      </CardHeader>
      <ul class="space-y-3.5">
        {#each insights as ins}
          <li class="flex gap-2.5">
            <span class="mt-1.5 size-2 shrink-0 rounded-full" style={`background: ${ins.color}; box-shadow: 0 0 8px ${ins.color}`}></span>
            <p class="text-[12.5px] leading-relaxed text-ink-2">{ins.text}</p>
          </li>
        {/each}
      </ul>
    </Card>
  </div>

  <!-- Tabel -->
  <Card class="overflow-hidden">
    <div class="p-4 pb-2 sm:px-5 sm:pt-4">
      <CardHeader title="Simpul Tersibuk" subtitle="8 simpul dengan penumpang puncak tertinggi">
        {#snippet icon()}<Table2 size={15} />{/snippet}
      </CardHeader>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead>
          <tr class="border-y border-white/[0.06] bg-white/[0.02] text-[10.5px] uppercase tracking-[0.08em] text-ink-3">
            <th class="px-4 py-2.5 font-bold sm:px-5">Simpul</th>
            <th class="px-3 py-2.5 font-bold">Moda</th>
            <th class="px-3 py-2.5 font-bold">Provinsi</th>
            <th class="px-3 py-2.5 text-right font-bold">Puncak</th>
            <th class="px-4 py-2.5 text-right font-bold sm:pr-5">Status</th>
          </tr>
        </thead>
        <tbody>
          {#each top8 as s}
            <tr class="border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.02]">
              <td class="px-4 py-3 sm:px-5"><p class="text-[13px] font-bold text-ink">{s.name}</p></td>
              <td class="px-3 py-3">
                <span class="num rounded-md border border-white/[0.07] bg-white/[0.04] px-1.5 py-0.5 text-[11px] font-bold text-ink-2">{s.moda}</span>
              </td>
              <td class="px-3 py-3 text-[12.5px] text-ink-3">{s.prov}</td>
              <td class="num px-3 py-3 text-right text-[12.5px] font-bold text-ink">{fmtCompact(s.pnpPuncak)}</td>
              <td class="px-4 py-3 text-right sm:pr-5">
                <span
                  class="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                  style={`background: ${(STATUS_COLOR[s.statusText] ?? '#8b98ad')}1f; color: ${STATUS_COLOR[s.statusText] ?? '#8b98ad'}`}
                >{s.statusText}</span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </Card>
</div>
