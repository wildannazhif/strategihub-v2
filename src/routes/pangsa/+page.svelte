<script lang="ts">
  import TrendingUp from 'lucide-svelte/icons/trending-up';
  import TrendingDown from 'lucide-svelte/icons/trending-down';
  import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
  import ArrowLeftRight from 'lucide-svelte/icons/arrow-left-right';
  import type { ApexOptions, ApexAxisChartSeries } from 'apexcharts';
  import Chart from '$lib/components/Chart.svelte';
  import { FONT, MONO } from '$lib/components/chart-utils';
  import Card from '$lib/components/Card.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import Segmented from '$lib/components/Segmented.svelte';
  import { data, MODA_KEYS } from '$lib/data';
  import type { ModaKey } from '$lib/data';
  import { MODA } from '$lib/moda';
  import { fmtCompact } from '$lib/format';

  type Mode = 'donat' | 'tren' | 'banding';

  const fmtPp = (v: number) =>
    `${v >= 0 ? '+' : ''}${v.toLocaleString('id-ID', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} pp`;
  const fmtShare = (v: number) =>
    `${v.toLocaleString('id-ID', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`;

  const monthly = data.monthly_summary;
  let mode: Mode = $state('donat');
  let monthIdx: number = $state(2); // default Maret — puncak Lebaran
  const row = $derived(monthly[monthIdx]);

  /* ---------- Donat: komposisi satu bulan ---------- */
  const ranking = $derived(
    MODA_KEYS.map((m) => ({
      m,
      value: row[m] as number,
      share: row[`share_${m}`] as number,
    })).sort((a, b) => b.value - a.value),
  );
  const maxRank = $derived(Math.max(...ranking.map((r) => r.value)));

  const donutSeries = $derived(MODA_KEYS.map((m) => row[m] as number));

  const donutOptions: ApexOptions = $derived({
    labels: MODA_KEYS.map((m) => MODA[m].label),
    colors: MODA_KEYS.map((m) => MODA[m].color),
    chart: { toolbar: { show: false } },
    legend: { position: 'bottom' },
    stroke: { width: 2, colors: ['#0a101d'] },
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            name: { fontFamily: FONT, fontSize: '12px', fontWeight: 600, color: '#8b98ad' },
            value: { fontFamily: MONO, fontSize: '22px', fontWeight: 800, color: '#e8eef7' },
            total: {
              show: true,
              label: `${row.label} 2026`,
              fontSize: '13px',
              fontWeight: 700,
              color: '#8b98ad',
              formatter: () => fmtCompact(row.TOTAL),
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (_v: number, opts: any) =>
        fmtShare(row[`share_${MODA_KEYS[opts.seriesIndex]}`] as number),
      style: { fontFamily: MONO, fontSize: '11px', fontWeight: 700 },
    },
    tooltip: {
      y: {
        formatter: (v: number, opts: any) =>
          `${fmtCompact(v)} pnp • ${fmtShare(row[`share_${MODA_KEYS[opts.seriesIndex]}`] as number)}`,
        title: { formatter: (name: string) => name },
      },
    },
  });

  /* ---------- Tren: stacked bar 100% + line total ---------- */
  const trenSeries: ApexAxisChartSeries = $derived([
    ...MODA_KEYS.map((m) => ({
      name: MODA[m].short,
      type: 'bar' as const,
      data: monthly.map((r) => Number(((r[`share_${m}`] as number) ?? 0).toFixed(1))),
    })),
    {
      name: 'Total (jt)',
      type: 'line' as const,
      data: monthly.map((r) => Number((r.TOTAL / 1e6).toFixed(1))),
    },
  ]);

  const trenOptions: ApexOptions = $derived.by(() => {
    const months = monthly.map((r) => r.label.slice(0, 3));
    const lebaran =
      monthly.find((r) => r.label.toLowerCase().startsWith('mar'))?.label.slice(0, 3) ?? 'Mar';
    const fg = '#e8eef7';
    const fgSoft = '#a7b3c7';
    return {
      chart: { stacked: true, stackType: '100%' },
      colors: [...MODA_KEYS.map((m) => MODA[m].color), '#f1f5f9'],
      stroke: { width: [0, 0, 0, 0, 0, 2.5] },
      legend: { position: 'top', horizontalAlign: 'left' },
      plotOptions: { bar: { horizontal: false, columnWidth: '58%' } },
      xaxis: { categories: months },
      yaxis: [
        ...MODA_KEYS.map((m) => ({
          seriesName: MODA[m].short,
          max: 100,
          labels: { formatter: (v: number) => `${Math.round(v)}%` },
        })),
        {
          seriesName: 'Total (jt)',
          opposite: true,
          labels: { formatter: (v: number) => `${v} jt` },
        },
      ],
      annotations: {
        xaxis: [
          {
            x: lebaran,
            borderColor: '#d97706',
            strokeDashArray: 4,
            label: {
              text: 'Lebaran',
              style: {
                color: '#fff',
                background: '#d97706',
                fontFamily: FONT,
                fontSize: '11px',
                fontWeight: 700,
              },
            },
          },
        ],
      },
      tooltip: {
        shared: true,
        custom: (opts: any) => {
          const r = monthly[opts.dataPointIndex];
          const rows = MODA_KEYS.map((m) => {
            const v = Number(((r[`share_${m}`] as number) ?? 0).toFixed(1));
            return (
              `<div style="display:flex;align-items:center;gap:8px;margin-top:3px">` +
              `<span style="width:8px;height:8px;border-radius:50%;background:${MODA[m].color};flex-shrink:0"></span>` +
              `<span style="color:${fgSoft}">${MODA[m].short}</span>` +
              `<span style="margin-left:auto;font-family:${MONO};font-weight:700;color:${fg}">${v.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</span>` +
              `</div>`
            );
          }).join('');
          return (
            `<div style="padding:10px 12px;min-width:190px">` +
            `<div style="font-weight:800;margin-bottom:5px;color:${fg};font-family:${FONT}">${r.label} 2026</div>` +
            rows +
            `<div style="display:flex;align-items:center;gap:8px;margin-top:7px;padding-top:7px;border-top:1px solid rgba(255,255,255,0.08)">` +
            `<span style="width:8px;height:8px;border-radius:50%;background:#f1f5f9;flex-shrink:0"></span>` +
            `<span style="color:${fgSoft}">Total</span>` +
            `<span style="margin-left:auto;font-family:${MONO};font-weight:700;color:${fg}">${fmtCompact(r.TOTAL)} pnp</span>` +
            `</div></div>`
          );
        },
      },
    };
  });

  /* ---------- Perbandingan: Jan vs Sep (horizontal bars) ---------- */
  const bandingSeries: ApexAxisChartSeries = $derived.by(() => {
    const jan = monthly[0];
    const sep = monthly[monthly.length - 1];
    return [
      {
        name: jan.label,
        type: 'bar',
        data: MODA_KEYS.map((m) => Number(((jan[`share_${m}`] as number) ?? 0).toFixed(1))),
      },
      {
        name: sep.label,
        type: 'bar',
        data: MODA_KEYS.map((m) => ({
          // horizontal bar: nilai pada sumbu x (sumbu tertukar)
          x: Number(((sep[`share_${m}`] as number) ?? 0).toFixed(1)),
          fillColor: MODA[m].color,
        })),
      },
    ];
  });

  const bandingOptions: ApexOptions = $derived.by(() => {
    const jan = monthly[0];
    const sep = monthly[monthly.length - 1];
    const dMap = {} as Record<ModaKey, number>;
    for (const m of MODA_KEYS) dMap[m] = (sep[`share_${m}`] as number) - (jan[`share_${m}`] as number);
    return {
      colors: ['#475569', '#94a3b8'],
      stroke: { width: 0 },
      legend: { position: 'top', horizontalAlign: 'left' },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          barHeight: '55%',
          dataLabels: { position: 'right' },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (_v: number, opts: any) =>
          opts.seriesIndex === 1 ? fmtPp(dMap[MODA_KEYS[opts.dataPointIndex]]) : '',
        style: { fontFamily: MONO, fontSize: '11px', fontWeight: 700, colors: ['#a7b3c7'] },
        offsetX: 10,
      },
      xaxis: { categories: MODA_KEYS.map((m) => MODA[m].label) },
      yaxis: {
        max: 40,
        labels: { formatter: (v: number) => `${v}%` },
      },
      grid: { padding: { right: 64 } },
      tooltip: {
        y: { formatter: (v: number) => `${v.toFixed(1)}%` },
      },
    };
  });

  /* ---------- Insight otomatis Jan → Sep ---------- */
  const deltas = $derived(
    (() => {
      const jan = monthly[0];
      const sep = monthly[monthly.length - 1];
      return MODA_KEYS.map((m) => {
        const j = jan[`share_${m}`] as number;
        const s = sep[`share_${m}`] as number;
        return { m, jan: j, sep: s, d: s - j };
      }).sort((a, b) => b.d - a.d);
    })(),
  );
  const topGainer = $derived(deltas[0]);
  const topLoser = $derived(deltas[deltas.length - 1]);
</script>

<div class="space-y-4">
  <!-- Header -->
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <p class="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">Pangsa Pasar</p>
      <h1 class="mt-0.5 text-xl font-extrabold tracking-tight text-ink">Pangsa Pasar Antar-Moda</h1>
      <p class="mt-1 max-w-2xl text-[13px] text-ink-2">
        Komposisi penumpang 5 moda transportasi Jan–Sep 2026. Ganti tampilan untuk melihat komposisi
        bulanan, tren pergeseran preferensi, atau perbandingan awal–akhir periode.
      </p>
    </div>
    <Segmented
      options={[
        { value: 'donat', label: 'Donat' },
        { value: 'tren', label: 'Tren Bulanan' },
        { value: 'banding', label: 'Perbandingan' },
      ]}
      value={mode}
      onChange={(v) => (mode = v)}
    />
  </div>

  {#if mode === 'donat'}
    <div class="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <Card class="p-4 sm:p-5 xl:col-span-3">
        <div class="mb-4 flex flex-wrap gap-1.5">
          {#each monthly as r, i}
            <button
              onclick={() => (monthIdx = i)}
              class={`cursor-pointer rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                i === monthIdx
                  ? 'bg-white font-bold text-slate-900'
                  : 'bg-white/[0.06] text-ink-2 hover:bg-white/[0.1]'
              }`}
            >
              {r.label.slice(0, 3)}
            </button>
          {/each}
        </div>
        <Chart type="donut" series={donutSeries} options={donutOptions} height={280} />
      </Card>
      <Card class="p-4 sm:p-5 xl:col-span-2">
        <p class="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">Peringkat Moda</p>
        <h3 class="mt-1 text-lg font-extrabold tracking-tight text-ink">{row.label} 2026</h3>
        <div class="mt-4 space-y-3.5">
          {#each ranking as r, i}
            <div>
              <div class="mb-1 flex items-baseline justify-between gap-2">
                <p class="text-[13px] font-semibold text-ink-2">
                  <span class="num mr-1.5 text-ink-3">{i + 1}</span>
                  {MODA[r.m].label}
                </p>
                <p class="num text-[13px] font-extrabold" style={`color: ${MODA[r.m].color}`}>
                  {fmtShare(r.share)}
                </p>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  class="h-2 rounded-full transition-all duration-700"
                  style={`width: ${(r.value / maxRank) * 100}%; background: ${MODA[r.m].color}`}
                ></div>
              </div>
              <p class="num mt-0.5 text-[11px] text-ink-3">{fmtCompact(r.value)} pnp</p>
            </div>
          {/each}
        </div>
      </Card>
    </div>
  {/if}

  {#if mode === 'tren'}
    <Card class="p-4 sm:p-5">
      <CardHeader
        title="Pergeseran Preferensi Moda"
        subtitle="Stacked bar 100% per bulan (sumbu kiri) + garis total penumpang dalam juta (sumbu kanan). Garis putus-putus menandai Maret — bulan Lebaran 2026."
      >
        {#snippet icon()}<BarChart3 size={15} />{/snippet}
      </CardHeader>
      <Chart type="bar" series={trenSeries} options={trenOptions} height={340} />
    </Card>
  {/if}

  {#if mode === 'banding'}
    <Card class="p-4 sm:p-5">
      <CardHeader
        title={`${monthly[0].label} vs ${monthly[monthly.length - 1].label} 2026`}
        subtitle="Share tiap moda di awal vs akhir periode. Angka di kanan bar menunjukkan perubahan dalam poin persentase (pp)."
      >
        {#snippet icon()}<ArrowLeftRight size={15} />{/snippet}
      </CardHeader>
      <Chart type="bar" series={bandingSeries} options={bandingOptions} height={300} />
    </Card>
  {/if}

  <!-- Insight otomatis -->
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <Card class="p-4 sm:p-5">
      <div class="flex items-center gap-3">
        <span
          class="grid size-10 shrink-0 place-items-center rounded-xl"
          style={`background: ${MODA[topGainer.m].colorSoft}; color: ${MODA[topGainer.m].color}`}
        >
          <TrendingUp size={18} />
        </span>
        <div>
          <p class="text-[12px] font-semibold text-ink-3">Kenaikan share terbesar</p>
          <p class="text-[15px] font-bold text-ink">{MODA[topGainer.m].label}</p>
        </div>
        <span class="num ml-auto text-xl font-extrabold text-emerald-400">{fmtPp(topGainer.d)}</span>
      </div>
      <p class="num mt-2.5 text-[12.5px] text-ink-2">
        {fmtShare(topGainer.jan)} → {fmtShare(topGainer.sep)} (Jan → Sep 2026)
      </p>
    </Card>
    <Card class="p-4 sm:p-5">
      <div class="flex items-center gap-3">
        <span
          class="grid size-10 shrink-0 place-items-center rounded-xl"
          style={`background: ${MODA[topLoser.m].colorSoft}; color: ${MODA[topLoser.m].color}`}
        >
          <TrendingDown size={18} />
        </span>
        <div>
          <p class="text-[12px] font-semibold text-ink-3">
            {topLoser.d >= 0 ? 'Kenaikan share terkecil' : 'Penurunan share terbesar'}
          </p>
          <p class="text-[15px] font-bold text-ink">{MODA[topLoser.m].label}</p>
        </div>
        <span
          class={`num ml-auto text-xl font-extrabold ${topLoser.d >= 0 ? 'text-ink-3' : 'text-rose-400'}`}
        >
          {fmtPp(topLoser.d)}
        </span>
      </div>
      <p class="num mt-2.5 text-[12.5px] text-ink-2">
        {fmtShare(topLoser.jan)} → {fmtShare(topLoser.sep)} (Jan → Sep 2026)
      </p>
    </Card>
  </div>
</div>
