<script lang="ts">
  import Search from 'lucide-svelte/icons/search';
  import ChevronLeft from 'lucide-svelte/icons/chevron-left';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';
  import Ship from 'lucide-svelte/icons/ship';
  import type { ApexOptions } from 'apexcharts';
  import Chart from '$lib/components/Chart.svelte';
  import { MONO } from '$lib/components/chart-utils';
  import Card from '$lib/components/Card.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import Segmented from '$lib/components/Segmented.svelte';
  import { data, MODA_KEYS } from '$lib/data';
  import { MODA, densityStatus } from '$lib/moda';
  import { fmtInt, fmtCompact, fmtPct } from '$lib/format';
  import { themeStore, chartTheme } from '$lib/theme.svelte';
  import type { ModaKey, HubRow, SimpulRecommendation } from '$lib/data/types';

  type Periode = 'peak' | 'ytd';
  type SortBy = 'pnp' | 'arm';
  type Arah = 'total' | 'dat' | 'brg';

  const PAGE = 10;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();

  function metricOf(r: HubRow, sortBy: SortBy, arah: Arah): number {
    if (sortBy === 'pnp') return arah === 'dat' ? r.p_dat : arah === 'brg' ? r.p_brg : r.pnp;
    return arah === 'dat' ? r.a_dat : arah === 'brg' ? r.a_brg : r.arm;
  }

  const ARAH_LABEL: Record<Arah, string> = { total: 'Total', dat: 'Datang', brg: 'Berangkat' };

  function recColor(statusText: string): string {
    if (statusText.includes('Kritis')) return '#f87171';
    if (statusText.includes('Tinggi')) return '#fb923c';
    if (statusText.includes('Waspada') || statusText.includes('Sedang')) return '#fbbf24';
    return '#34d399';
  }

  let moda = $state<ModaKey>('UDARA');
  let periode = $state<Periode>('peak');
  let search = $state('');
  let sortBy = $state<SortBy>('pnp');
  let arah = $state<Arah>('total');
  let selectedHub = $state<string | null>(null);
  let page = $state(0);

  const base = $derived((periode === 'peak' ? data.top_hubs_peak : data.top_hubs_ytd)[moda]);

  const rows = $derived.by(() => {
    const q = search.trim().toLowerCase();
    const f = q
      ? base.filter(
          (r) =>
            r.nama_prasarana.toLowerCase().includes(q) || r.provinsi.toLowerCase().includes(q),
        )
      : base;
    return [...f].sort((a, b) => metricOf(b, sortBy, arah) - metricOf(a, sortBy, arah));
  });

  $effect(() => {
    void moda;
    void periode;
    void search;
    void sortBy;
    void arah;
    page = 0;
  });

  const medianPnp = $derived.by(() => {
    const v = base.map((r) => r.pnp).sort((a, b) => a - b);
    return v[Math.floor(v.length / 2)] || 1;
  });

  const recByModa = $derived(data.simpul_recommendations.filter((r) => r.moda === moda));

  const recIndex = $derived.by(() => {
    const m = new Map<string, SimpulRecommendation>();
    for (const r of recByModa) {
      const k = norm(r.name);
      if (!m.has(k)) m.set(k, r);
    }
    return m;
  });

  function findRec(nama: string): SimpulRecommendation | undefined {
    const exact = recIndex.get(norm(nama));
    if (exact) return exact;
    const n = norm(nama);
    return recByModa.find((r) => n.includes(norm(r.name)) || norm(r.name).includes(n));
  }

  function surgeOf(r: HubRow): number {
    const rec = findRec(r.nama_prasarana);
    if (rec && rec.pnpBiasa > 0) return (rec.pnpPuncak / rec.pnpBiasa - 1) * 100;
    return (r.pnp / medianPnp - 1) * 100;
  }

  function handleSelect(name: string) {
    selectedHub = name;
    const idx = rows.findIndex((r) => r.nama_prasarana === name);
    if (idx >= 0) page = Math.floor(idx / PAGE);
  }

  const chartRows = $derived(rows.slice(0, 10));
  const totalPages = $derived(Math.max(1, Math.ceil(rows.length / PAGE)));
  const safePage = $derived(Math.min(page, totalPages - 1));
  const pageRows = $derived(rows.slice(safePage * PAGE, safePage * PAGE + PAGE));

  const selRec = $derived(selectedHub ? findRec(selectedHub) : undefined);
  const topRecs = $derived.by(() => {
    const sorted = [...recByModa].sort((a, b) => Number(b.addArm) - Number(a.addArm));
    if (selRec) {
      const rest = sorted.filter((r) => r.id !== selRec.id);
      return [selRec, ...rest].slice(0, 5);
    }
    return sorted.slice(0, 5);
  });

  const unit = $derived(sortBy === 'pnp' ? 'pnp' : 'trip');

  const ct = $derived(chartTheme(themeStore.current === 'dark'));

  /* ---------- Horizontal bar chart (top 10), click -> select hub ---------- */
  const chartNames = $derived(chartRows.map((r) => r.nama_prasarana));
  const chartSeries = $derived<ApexOptions['series']>([
    {
      name: unit === 'pnp' ? 'Penumpang' : 'Armada',
      data: chartRows.map((r) => metricOf(r, sortBy, arah)),
    },
  ]);
  const chartOptions = $derived<ApexOptions>({
    chart: {
      events: {
        dataPointSelection: (_e: unknown, _c: unknown, config?: { dataPointIndex: number }) => {
          const i = config?.dataPointIndex;
          if (typeof i === 'number' && chartNames[i]) handleSelect(chartNames[i]);
        },
      },
    },
    colors: [MODA[moda].color],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        barHeight: '60%',
        dataLabels: { position: 'right' },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (v: number) => fmtCompact(v),
      offsetX: 22,
      style: { fontFamily: MONO, fontSize: '11px', colors: [ct.soft] },
    },
    xaxis: { categories: chartNames },
    yaxis: {
      reversed: true,
      labels: {
        formatter: (v: string | number) =>
          typeof v === 'string' && v.length > 22 ? `${v.slice(0, 21)}…` : String(v),
      },
    },
    grid: {
      padding: { right: 48 },
      xaxis: { lines: { show: true } },
    },
    tooltip: {
      theme: ct.tooltipMode,
      y: { formatter: (v: number) => `${fmtInt(v)} ${unit}` },
    },
  });
</script>

<div class="space-y-4">
  <div>
    <p class="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">Registri Simpul</p>
    <h1 class="mt-1 text-xl font-extrabold tracking-tight text-ink">Registri Simpul Top 30</h1>
    <p class="mt-1 max-w-3xl text-[13px] text-ink-3">
      30 simpul tersibuk per moda — periode Puncak Lebaran vs akumulasi YTD 2026. Klik bar grafik atau
      baris tabel untuk melihat rekomendasi armada.
    </p>
  </div>

  <!-- Controls -->
  <Card class="space-y-4 p-5">
    <div class="flex flex-wrap gap-2">
      {#each MODA_KEYS as m}
        {@const active = moda === m}
        <button
          onclick={() => (moda = m)}
          class={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-[13px] font-bold transition-all ${
            active
              ? 'border-transparent text-white shadow-md'
              : 'border-line text-ink-2 hover:border-line hover:bg-fill'
          }`}
          style={active ? `background: ${MODA[m].color}` : undefined}
        >
          <span class="size-2.5 rounded-full" style={`background: ${active ? '#fff' : MODA[m].color}`}></span>
          {MODA[m].short}
        </button>
      {/each}
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <Segmented
        value={periode}
        onChange={(v) => (periode = v)}
        options={[
          { value: 'peak', label: 'Puncak Lebaran' },
          { value: 'ytd', label: 'YTD 2026' },
        ]}
      />
      <div class="relative min-w-[220px] flex-1">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">
          <Search size={15} />
        </span>
        <input
          bind:value={search}
          placeholder="Cari simpul atau provinsi…"
          class="w-full rounded-xl border border-line bg-fill py-2 pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none"
        />
      </div>
      <Segmented
        value={sortBy}
        onChange={(v) => (sortBy = v)}
        options={[
          { value: 'pnp', label: 'Penumpang' },
          { value: 'arm', label: 'Armada' },
        ]}
      />
      <Segmented
        value={arah}
        onChange={(v) => (arah = v)}
        options={[
          { value: 'total', label: 'Total' },
          { value: 'dat', label: 'Datang' },
          { value: 'brg', label: 'Berangkat' },
        ]}
      />
    </div>
  </Card>

  <!-- Chart + recommendations -->
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
    <Card class="p-5 xl:col-span-2">
      <CardHeader
        title={`Top 10 Simpul — ${periode === 'peak' ? 'Puncak Lebaran' : 'YTD 2026'}`}
        subtitle={`Urut ${sortBy === 'pnp' ? 'penumpang' : 'armada'} • arah ${ARAH_LABEL[arah].toLowerCase()} — klik bar untuk memilih simpul`}
      />
      {#if chartRows.length > 0}
        <Chart type="bar" series={chartSeries} options={chartOptions} height={320} />
      {:else}
        <div class="grid place-items-center rounded-xl border border-dashed border-line py-14 text-center">
          <div>
            <p class="text-[14px] font-bold text-ink">Tidak ada data</p>
            <p class="mt-1 text-[12.5px] text-ink-3">Ubah kata kunci pencarian.</p>
          </div>
        </div>
      {/if}
    </Card>

    <Card class="flex flex-col p-5">
      <CardHeader
        title="Rekomendasi Armada"
        subtitle={`${MODA[moda].label} • kebutuhan tambahan per simpul`}
      />
      {#if selectedHub}
        <p class="mb-3 rounded-xl bg-accent/[0.08] px-3 py-2 text-[12.5px] text-ink-2">
          Simpul terpilih: <b class="text-ink">{selectedHub}</b>
        </p>
      {:else}
        <p class="mb-3 rounded-xl bg-fill px-3 py-2 text-[12.5px] text-ink-3">
          Klik bar grafik atau baris tabel untuk memfokuskan satu simpul.
        </p>
      {/if}
      <ul class="flex-1 space-y-3 overflow-y-auto pr-0.5">
        {#each topRecs as r, i}
          <li class="rounded-xl border border-line p-3.5">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-[13.5px] font-bold text-ink">
                  <span class="num mr-1.5 text-ink-3">#{i + 1}</span>
                  {r.name}
                </p>
                <p class="mt-0.5 text-[11.5px] text-ink-3">
                  {r.prov} • {r.saranaType} ({r.saranaUnit})
                </p>
              </div>
              <Badge color={recColor(r.statusText)}>{r.statusText}</Badge>
            </div>
            <div class="mt-3 grid grid-cols-3 gap-2 text-center">
              <div class="rounded-lg bg-rose-500/[0.08] py-2">
                <p class="num text-[16px] font-extrabold text-rose-400">+{fmtInt(Number(r.addArm))}</p>
                <p class="text-[10px] font-semibold text-ink-3">unit tambahan</p>
              </div>
              <div class="rounded-lg bg-fill py-2">
                <p class="num text-[16px] font-extrabold text-ink">{fmtCompact(r.pnpPuncak)}</p>
                <p class="text-[10px] font-semibold text-ink-3">pnp puncak</p>
              </div>
              <div class="rounded-lg bg-fill py-2">
                <p class="num text-[16px] font-extrabold text-ink">{fmtInt(Number(r.totalArm))}</p>
                <p class="text-[10px] font-semibold text-ink-3">total armada</p>
              </div>
            </div>
            <p class="mt-2.5 text-[11.5px] leading-relaxed text-ink-3">
              {String(r.fieldAction ?? '')}
            </p>
          </li>
        {/each}
      </ul>
    </Card>
  </div>

  <!-- Table -->
  <Card class="p-5">
    <CardHeader
      title={`Peringkat 1–30 • ${MODA[moda].label}`}
      subtitle={`${rows.length} simpul • urut ${sortBy === 'pnp' ? 'penumpang' : 'armada'} ${ARAH_LABEL[arah].toLowerCase()} • P/A = penumpang per trip armada`}
    />
    {#if rows.length > 0}
      <div class="max-h-[540px] overflow-auto rounded-xl border border-line">
        <table class="w-full min-w-[780px] text-left text-[13px]">
          <thead class="sticky top-0 z-10">
            <tr class="bg-panel-2">
              {#each ['#', 'Simpul', 'Provinsi', `Penumpang (${ARAH_LABEL[arah]})`, `Armada (${ARAH_LABEL[arah]})`, 'P/A', 'Status'] as h}
                <th class="whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-3">
                  {h}
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each pageRows as r, i}
              {@const rank = safePage * PAGE + i + 1}
              {@const pnp = metricOf(r, 'pnp', arah)}
              {@const arm = metricOf(r, 'arm', arah)}
              {@const lf = arm > 0 ? pnp / arm : 0}
              {@const surge = surgeOf(r)}
              {@const st = densityStatus(surge)}
              {@const sel = selectedHub === r.nama_prasarana}
              <tr
                onclick={() => handleSelect(r.nama_prasarana)}
                class={`cursor-pointer border-t border-line transition-colors ${
                  sel ? 'bg-accent/[0.08]' : 'hover:bg-fill'
                } ${i % 2 === 1 && !sel ? 'bg-fill' : ''}`}
              >
                <td class="num px-4 py-3 font-extrabold text-ink-3">
                  <span
                    class="inline-grid size-7 place-items-center rounded-lg text-[12px]"
                    style={rank <= 3 ? `background: ${MODA[moda].colorSoft}; color: ${MODA[moda].color}` : undefined}
                  >
                    {rank}
                  </span>
                </td>
                <td class="px-4 py-3 font-bold text-ink">{r.nama_prasarana}</td>
                <td class="px-4 py-3 text-ink-3">{r.provinsi}</td>
                <td class="num px-4 py-3 font-semibold text-ink-2">{fmtInt(pnp)}</td>
                <td class="num px-4 py-3 text-ink-3">{fmtInt(arm)}</td>
                <td class="num px-4 py-3 font-semibold text-ink-2">
                  {lf.toLocaleString('id-ID', { maximumFractionDigits: 1 })}
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <Badge color={st.color}>{st.label}</Badge>
                    <span class="num text-[11px] text-ink-3">{fmtPct(surge)}</span>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p class="text-[12px] text-ink-3">
          Menampilkan
          <b class="num text-ink-2">{safePage * PAGE + 1}–{Math.min(safePage * PAGE + PAGE, rows.length)}</b>
          dari <b class="num text-ink-2">{rows.length}</b> simpul
        </p>
        <div class="flex items-center gap-2">
          <button
            onclick={() => (page = Math.max(0, page - 1))}
            disabled={safePage === 0}
            class="grid size-8 cursor-pointer place-items-center rounded-lg border border-line text-ink-3 transition-colors hover:bg-fill disabled:opacity-40"
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft size={15} />
          </button>
          <span class="num text-[12.5px] font-bold text-ink-2">{safePage + 1} / {totalPages}</span>
          <button
            onclick={() => (page = Math.min(totalPages - 1, page + 1))}
            disabled={safePage >= totalPages - 1}
            class="grid size-8 cursor-pointer place-items-center rounded-lg border border-line text-ink-3 transition-colors hover:bg-fill disabled:opacity-40"
            aria-label="Halaman berikutnya"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    {:else}
      <div class="grid place-items-center rounded-xl border border-dashed border-line py-14 text-center">
        <div>
          <p class="text-[14px] font-bold text-ink">Tidak ada simpul cocok</p>
          <p class="mt-1 text-[12.5px] text-ink-3">Ubah kata kunci pencarian atau filter.</p>
        </div>
      </div>
    {/if}
  </Card>

  <Card class="flex items-start gap-3 p-5">
    <span
      class="grid size-10 shrink-0 place-items-center rounded-xl"
      style={`background: ${MODA[moda].colorSoft}; color: ${MODA[moda].color}`}
    >
      <Ship size={18} />
    </span>
    <div>
      <p class="text-[13.5px] font-bold text-ink">Cara membaca status kepadatan</p>
      <p class="mt-1 text-[12.5px] leading-relaxed text-ink-3">
        Lonjakan dihitung dari rasio penumpang puncak vs hari biasa pada data rekomendasi simpul
        (pnpPuncak ÷ pnpBiasa). Jika simpul tidak tercakup, dipakai perbandingan terhadap median 30
        simpul moda ini. Ambang: ≥80% sangat kritis, ≥50% padat tinggi, ≥25% sibuk terkendali, di
        bawahnya stabil.
      </p>
    </div>
  </Card>
</div>
