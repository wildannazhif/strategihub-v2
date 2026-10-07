<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import type * as maplibregl from 'maplibre-gl';
  import Search from 'lucide-svelte/icons/search';
  import X from 'lucide-svelte/icons/x';
  import Crosshair from 'lucide-svelte/icons/crosshair';
  import MapPin from 'lucide-svelte/icons/map-pin';
  import MapIcon from 'lucide-svelte/icons/map';
  import Card from '$lib/components/Card.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import Segmented from '$lib/components/Segmented.svelte';
  import { data, MODA_KEYS } from '$lib/data';
  import { MODA } from '$lib/moda';
  import { fmtCompact, fmtInt } from '$lib/format';
  import type { ModaKey, SpatialNode } from '$lib/data/types';

  const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
  const HOME: [number, number] = [118, -2.5];
  const HOME_ZOOM = 4.2;

  type MetricKey = 'pnp' | 'arm';

  interface NodeProps {
    id: string;
    nama: string;
    tipe: string;
    prov: string;
    moda: ModaKey;
    pnp: number;
    arm: number;
    r_pnp: number;
    r_arm: number;
  }

  function popupHtml(p: NodeProps): string {
    const moda = MODA[p.moda];
    const pa = p.arm > 0 ? p.pnp / p.arm : 0;
    const row = (l: string, v: string) =>
      `<div style="display:flex;justify-content:space-between;gap:12px;padding:3px 0;font-size:12px">` +
      `<span style="color:#8b98ad">${l}</span><b style="font-family:'JetBrains Mono',monospace;color:#e8eef7">${v}</b></div>`;
    return (
      `<div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;min-width:210px;padding:14px 16px">` +
      `<div style="font-weight:800;font-size:13.5px;color:#e8eef7;line-height:1.3">${p.nama}</div>` +
      `<div style="font-size:11.5px;color:#8b98ad;margin:2px 0 8px">${p.tipe} &bull; ${p.prov}</div>` +
      `<span style="display:inline-block;background:${moda.color}26;color:${moda.color};` +
      `font-size:11px;font-weight:700;border-radius:999px;padding:3px 10px;margin-bottom:8px">${moda.label}</span>` +
      row('Penumpang', fmtInt(p.pnp)) +
      row('Armada', `${fmtInt(p.arm)} trip`) +
      row('Rasio P/A', pa > 0 ? pa.toLocaleString('id-ID', { maximumFractionDigits: 1 }) : '–') +
      `</div>`
    );
  }

  const nodes = data.spatial_nodes;

  const mapped = $derived(nodes.filter((n) => n.has_coords));
  const unmappedCount = $derived(nodes.length - mapped.length);
  const countByModa = $derived.by(() => {
    const c: Record<ModaKey, number> = { UDARA: 0, KA: 0, BUS: 0, ASDP: 0, LAUT: 0 };
    for (const n of mapped) c[n.m] += 1;
    return c;
  });

  const geojson = $derived.by(() => {
    const maxPnp = Math.max(...mapped.map((n) => n.pnp), 1);
    const maxArm = Math.max(...mapped.map((n) => n.arm), 1);
    const rad = (v: number, max: number) => 4 + 14 * Math.sqrt(v / max);
    return {
      type: 'FeatureCollection' as const,
      features: mapped.map((n) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [n.lon, n.lat] as [number, number] },
        properties: {
          id: n.id,
          nama: n.nama,
          tipe: n.tipe,
          prov: n.p,
          moda: n.m,
          pnp: n.pnp,
          arm: n.arm,
          color: MODA[n.m].color,
          r_pnp: rad(n.pnp, maxPnp),
          r_arm: rad(n.arm, maxArm),
        } satisfies NodeProps & { color: string },
      })),
    };
  });

  let activeModas = $state<ModaKey[]>([...MODA_KEYS]);
  let metric = $state<MetricKey>('pnp');
  let query = $state('');
  let showSug = $state(false);

  let container: HTMLDivElement | null = $state(null);
  let map: maplibregl.Map | null = null;
  let popup: maplibregl.Popup | null = null;
  let ml: typeof import('maplibre-gl') | null = null;

  function applyView() {
    if (!map || !map.getLayer('nodes')) return;
    map.setFilter(
      'nodes',
      activeModas.length === MODA_KEYS.length
        ? null
        : (['in', ['get', 'moda'], ['literal', [...activeModas]]] as maplibregl.FilterSpecification),
    );
    map.setPaintProperty('nodes', 'circle-radius', [
      'get',
      metric === 'pnp' ? 'r_pnp' : 'r_arm',
    ]);
  }

  function openPopup(lng: number, lat: number, p: NodeProps) {
    if (!map || !ml) return;
    popup?.remove();
    popup = new ml.Popup({ closeButton: true, maxWidth: '300px' })
      .setLngLat([lng, lat])
      .setHTML(popupHtml(p))
      .addTo(map);
  }

  function toggleModa(m: ModaKey) {
    activeModas = activeModas.includes(m) ? activeModas.filter((x) => x !== m) : [...activeModas, m];
    applyView();
  }

  function setMetric(v: MetricKey) {
    metric = v;
    applyView();
  }

  function resetView() {
    map?.flyTo({ center: HOME, zoom: HOME_ZOOM, duration: 1200 });
  }

  const suggestions = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return mapped.filter((n) => n.nama.toLowerCase().includes(q)).slice(0, 8);
  });

  function pickNode(n: SpatialNode) {
    query = n.nama;
    showSug = false;
    if (!map) return;
    map.flyTo({ center: [n.lon, n.lat], zoom: 9, duration: 1400 });
    openPopup(n.lon, n.lat, {
      id: n.id,
      nama: n.nama,
      tipe: n.tipe,
      prov: n.p,
      moda: n.m,
      pnp: n.pnp,
      arm: n.arm,
      r_pnp: 0,
      r_arm: 0,
    });
  }

  onMount(async () => {
    if (!browser || !container || map) return;
    ml = await import('maplibre-gl');
    const m = new ml.Map({
      container,
      style: DARK_STYLE,
      center: HOME,
      zoom: HOME_ZOOM,
      attributionControl: { compact: true },
    });
    m.addControl(new ml.NavigationControl({ visualizePitch: false }), 'top-right');

    const ensureLayers = () => {
      if (m.getSource('nodes')) return;
      m.addSource('nodes', { type: 'geojson', data: geojson });
      m.addLayer({
        id: 'nodes',
        type: 'circle',
        source: 'nodes',
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': ['get', metric === 'pnp' ? 'r_pnp' : 'r_arm'],
          'circle-opacity': 0.75,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff',
        },
      });
      applyView();
    };

    m.on('load', ensureLayers);
    m.on('styledata', ensureLayers);
    m.on('click', 'nodes', (e) => {
      const feat = e.features?.[0];
      if (!feat || !feat.properties) return;
      openPopup(e.lngLat.lng, e.lngLat.lat, feat.properties as unknown as NodeProps);
    });
    m.on('mouseenter', 'nodes', () => {
      m.getCanvas().style.cursor = 'pointer';
    });
    m.on('mouseleave', 'nodes', () => {
      m.getCanvas().style.cursor = '';
    });

    map = m;
    requestAnimationFrame(() => m.resize());
  });

  onDestroy(() => {
    popup?.remove();
    popup = null;
    map?.remove();
    map = null;
  });

  const metricOpts = [
    { value: 'pnp' as MetricKey, label: 'Penumpang' },
    { value: 'arm' as MetricKey, label: 'Armada' },
  ];
</script>

<div class="space-y-4">
  <CardHeader
    title="Peta Spasial Simpul"
    subtitle="Sebaran 1.208 simpul transportasi lima moda di seluruh Indonesia. Klik lingkaran untuk detail simpul."
  >
    {#snippet icon()}<MapIcon size={16} />{/snippet}
    {#snippet action()}
      <button
        onclick={resetView}
        class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3.5 py-2 text-[12.5px] font-semibold text-ink-2 transition hover:bg-white/[0.08] hover:text-ink"
      >
        <Crosshair size={15} />
        Pusatkan Indonesia
      </button>
    {/snippet}
  </CardHeader>

  <Card class="space-y-4 p-4 sm:p-5">
    <div>
      <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">Filter moda</p>
      <div class="flex flex-wrap gap-2">
        {#each MODA_KEYS as m}
          {@const active = activeModas.includes(m)}
          <button
            onclick={() => toggleModa(m)}
            class={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition ${
              active
                ? 'shadow-sm'
                : 'border-white/[0.07] text-ink-3 opacity-60 hover:opacity-100'
            }`}
            style={active
              ? `background:${MODA[m].color}1a;color:${MODA[m].color};border-color:${MODA[m].color}66`
              : undefined}
          >
            <span class="size-2.5 rounded-full" style={`background:${MODA[m].color}`}></span>
            {MODA[m].short}
            <span class="num text-[11px] opacity-70">{fmtCompact(countByModa[m])}</span>
          </button>
        {/each}
      </div>
    </div>

    <div class="flex flex-wrap items-end gap-3">
      <div>
        <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">Ukuran lingkaran</p>
        <Segmented options={metricOpts} value={metric} onChange={setMetric} />
      </div>
      <div class="relative min-w-[240px] flex-1 sm:max-w-xs">
        <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">Cari simpul</p>
        <div class="relative">
          <Search
            size={15}
            class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
          />
          <input
            bind:value={query}
            oninput={() => (showSug = true)}
            onfocus={() => (showSug = true)}
            placeholder="cth: Soekarno Hatta, Gambir…"
            class="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] py-2 pl-9 pr-9 text-[13px] text-ink outline-none placeholder:text-ink-3 focus:border-white/20"
          />
          {#if query}
            <button
              onclick={() => (query = '')}
              class="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-ink-3 hover:text-ink"
              aria-label="Hapus pencarian"
            >
              <X size={14} />
            </button>
          {/if}
        </div>
        {#if showSug && suggestions.length > 0}
          <div
            class="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d1424] shadow-xl"
          >
            {#each suggestions as n}
              <button
                onclick={() => pickNode(n)}
                class="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left transition hover:bg-white/[0.05]"
              >
                <span class="size-2.5 shrink-0 rounded-full" style={`background:${MODA[n.m].color}`}></span>
                <span class="min-w-0">
                  <span class="block truncate text-[13px] font-semibold text-ink">{n.nama}</span>
                  <span class="block truncate text-[11px] text-ink-3">{n.tipe} • {n.p}</span>
                </span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </Card>

  <div class="relative overflow-hidden rounded-2xl border border-white/[0.07]">
    <div bind:this={container} class="h-[520px] w-full"></div>

    <div class="absolute left-3 top-3 z-10">
      <div
        class="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-[#0d1424]/90 px-3 py-1.5 text-[11.5px] font-bold text-ink-2 shadow-sm backdrop-blur"
      >
        <MapPin size={13} class="text-ink-3" />
        <span class="num">{fmtInt(mapped.length)} terpetakan</span>
        <span class="text-ink-3">•</span>
        <span class="num font-semibold text-ink-3">{fmtInt(unmappedCount)} tanpa koordinat</span>
      </div>
    </div>

    <div class="absolute bottom-9 left-3 z-10">
      <div class="rounded-xl border border-white/[0.07] bg-[#0d1424]/90 p-3 shadow-sm backdrop-blur">
        <p class="mb-2 text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-3">Legenda moda</p>
        <div class="space-y-1.5">
          {#each MODA_KEYS as m}
            <div class="flex items-center gap-2 text-[12px]">
              <span class="size-2.5 rounded-full" style={`background:${MODA[m].color}`}></span>
              <span class="font-semibold text-ink-2">{MODA[m].short}</span>
              <span class="num ml-auto pl-4 text-[11px] text-ink-3">{fmtInt(countByModa[m])}</span>
            </div>
          {/each}
        </div>
        <p class="mt-2 border-t border-white/[0.07] pt-2 text-[10.5px] text-ink-3">
          Ukuran lingkaran ∝ {metric === 'pnp' ? 'penumpang' : 'armada'}
        </p>
      </div>
    </div>
  </div>
</div>
