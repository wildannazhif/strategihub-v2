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
  import { themeStore, chartTheme } from '$lib/theme.svelte';
  import type { ModaKey, SpatialNode } from '$lib/data/types';

  const ct = $derived(chartTheme(themeStore.current === 'dark'));

  const HOME: [number, number] = [118, -2.5];
  const HOME_ZOOM = 4.2;

  type MetricKey = 'pnp' | 'arm';
  type DirectionKey = 'tot' | 'dat' | 'brg';
  type ScaleKey = 'all' | 'top10' | 'top20' | 'top30' | 'top50' | 'pareto80' | 'pareto90';

  type NodeRow = SpatialNode & { a_dat: number; a_brg: number };

  const METRIC_FIELD: Record<MetricKey, Record<DirectionKey, keyof NodeRow>> = {
    pnp: { tot: 'pnp', dat: 'p_dat', brg: 'p_brg' },
    arm: { tot: 'arm', dat: 'a_dat', brg: 'a_brg' },
  };

  const METRIC_UNIT: Record<MetricKey, string> = { pnp: 'penumpang', arm: 'trip armada' };
  const DIRECTION_LABEL: Record<DirectionKey, string> = {
    tot: 'Total',
    dat: 'Datang',
    brg: 'Berangkat',
  };

  interface NodeProps {
    id: string;
    nama: string;
    tipe: string;
    prov: string;
    moda: ModaKey;
    pnp: number;
    arm: number;
    p_dat: number;
    p_brg: number;
    a_dat: number;
    a_brg: number;
    radius: number;
    stroke: string;
    strokeWidth: number;
    rank: number;
    sharePct: number;
  }

  interface ProvProps {
    name: string;
    vol: number;
    sharePct: number;
    count: number;
    domModa: string;
    fillColor: string;
    fillOpacity: number;
    border: string;
  }

  function popupHtml(p: NodeProps): string {
    const t = chartTheme(themeStore.current === 'dark');
    const moda = MODA[p.moda];
    const pa = p.arm > 0 ? p.pnp / p.arm : 0;
    const activeField = METRIC_FIELD[metric][direction];
    const bold = (field: keyof NodeRow) =>
      field === activeField ? 'font-weight:800' : 'font-weight:400';
    const row = (l: string, v: string, field: keyof NodeRow) =>
      `<div style="display:flex;justify-content:space-between;gap:12px;padding:3px 0;font-size:12px">` +
      `<span style="color:${t.popupSoft};${bold(field)}">${l}</span><b style="font-family:Arial,Helvetica,sans-serif;color:${t.popupFg};${bold(field)}">${v}</b></div>`;
    return (
      `<div style="font-family:Arial,Helvetica,sans-serif;min-width:220px;padding:14px 16px">` +
      `<div style="font-weight:800;font-size:13.5px;color:${t.popupFg};line-height:1.3">${p.nama}</div>` +
      `<div style="font-size:11.5px;color:${t.popupSoft};margin:2px 0 8px">${p.tipe} &bull; ${p.prov}</div>` +
      `<span style="display:inline-block;background:${moda.color}26;color:${moda.color};` +
      `font-size:11px;font-weight:700;border-radius:999px;padding:3px 10px;margin-bottom:8px">${moda.label}</span>` +
      (p.rank > 0 && p.rank <= 50
        ? `<div style="font-size:11px;font-weight:700;color:${t.popupSoft};margin-bottom:4px">Peringkat #${p.rank}</div>`
        : '') +
      row('Total Penumpang', fmtInt(p.pnp), 'pnp') +
      row('Penumpang Datang', fmtInt(p.p_dat), 'p_dat') +
      row('Penumpang Berangkat', fmtInt(p.p_brg), 'p_brg') +
      row('Total Armada', `${fmtInt(p.arm)} trip`, 'arm') +
      row('Armada Datang', `${fmtInt(p.a_dat)} trip`, 'a_dat') +
      row('Armada Berangkat', `${fmtInt(p.a_brg)} trip`, 'a_brg') +
      row('Rasio P/A', pa > 0 ? pa.toLocaleString('id-ID', { maximumFractionDigits: 1 }) : '–', 'id') +
      row('Pangsa terhadap Total', `${p.sharePct.toFixed(2)}%`, 'id') +
      `</div>`
    );
  }

  function provPopupHtml(p: ProvProps): string {
    const t = chartTheme(themeStore.current === 'dark');
    const row = (l: string, v: string) =>
      `<div style="display:flex;justify-content:space-between;gap:12px;padding:3px 0;font-size:12px">` +
      `<span style="color:${t.popupSoft}">${l}</span><b style="font-family:Arial,Helvetica,sans-serif;color:${t.popupFg}">${v}</b></div>`;
    return (
      `<div style="font-family:Arial,Helvetica,sans-serif;min-width:210px;padding:14px 16px">` +
      `<div style="font-weight:800;font-size:13.5px;color:${t.popupFg};line-height:1.3">${p.name}</div>` +
      `<div style="font-size:11.5px;color:${t.popupSoft};margin:2px 0 8px">Intensitas ${METRIC_UNIT[metric]} (${DIRECTION_LABEL[direction]})</div>` +
      row('Volume', `${fmtInt(p.vol)} ${METRIC_UNIT[metric]}`) +
      row('Pangsa Nasional', `${p.sharePct.toFixed(1)}%`) +
      row('Simpul', `${fmtInt(p.count)} titik`) +
      row('Moda Utama', p.domModa) +
      `</div>`
    );
  }

  // Ejaan provinsi diseragamkan: Siasati ("D.I Aceh", "D.I Yogyakarta") vs GeoJSON ("Aceh", "Daerah Istimewa Yogyakarta")
  function normalizeProvinceName(p: string): string {
    const s = p.trim();
    if (['D.I Aceh', 'DI Aceh', 'D.I. Aceh', 'Aceh'].includes(s)) return 'Aceh';
    if (
      ['D.I Yogyakarta', 'DI Yogyakarta', 'D.I. Yogyakarta', 'DIY', 'Daerah Istimewa Yogyakarta'].includes(s)
    )
      return 'Daerah Istimewa Yogyakarta';
    if (s.toUpperCase() === 'SULAWESI SELATAN') return 'Sulawesi Selatan';
    return s;
  }

  const nodes = data.spatial_nodes as unknown as NodeRow[];
  const geoInput = (
    data as unknown as {
      province_geojson?: {
        type: 'FeatureCollection';
        features: Array<{
          type: 'Feature';
          geometry: unknown;
          properties: { PROVINSI: string; [k: string]: unknown };
        }>;
      };
    }
  ).province_geojson;

  const mapped = $derived(nodes.filter((n) => n.has_coords));
  const unmappedCount = $derived(nodes.length - mapped.length);
  const countByModa = $derived.by(() => {
    const c: Record<ModaKey, number> = { UDARA: 0, KA: 0, BUS: 0, ASDP: 0, LAUT: 0 };
    for (const n of mapped) c[n.m] += 1;
    return c;
  });

  let activeModas = $state<ModaKey[]>([...MODA_KEYS]);
  let metric = $state<MetricKey>('pnp');
  let direction = $state<DirectionKey>('tot');
  let scale = $state<ScaleKey>('all');
  let showHeatmap = $state(true);
  let showNodes = $state(true);
  let query = $state('');
  let showSug = $state(false);

  const valOf = (n: NodeRow, m: MetricKey, d: DirectionKey): number =>
    Number(n[METRIC_FIELD[m][d]] ?? 0);

  // Pool: simpul berkoordinat yang lolos filter moda (skala TIDAK memengaruhi pool).
  const pool = $derived(mapped.filter((n) => activeModas.includes(n.m)));
  const totalPoolVol = $derived(pool.reduce((s, n) => s + valOf(n, metric, direction), 0));
  const sortedPool = $derived([...pool].sort((a, b) => valOf(b, metric, direction) - valOf(a, metric, direction)));
  const rankOf = $derived(new Map(sortedPool.map((n, i) => [n.id, i + 1])));

  // Simpul yang ditampilkan setelah filter skala (Pareto memakai kumulatif pool).
  const visibleNodes = $derived.by(() => {
    if (scale === 'all') return sortedPool;
    if (scale.startsWith('top')) {
      const n = Number(scale.slice(3));
      return sortedPool.slice(0, n);
    }
    const target = (scale === 'pareto80' ? 0.8 : 0.9) * totalPoolVol;
    const out: NodeRow[] = [];
    let cum = 0;
    for (const node of sortedPool) {
      out.push(node);
      cum += valOf(node, metric, direction);
      if (cum >= target) break;
    }
    return out;
  });
  const visibleVol = $derived(visibleNodes.reduce((s, n) => s + valOf(n, metric, direction), 0));
  const scaleBadge = $derived(
    scale === 'all'
      ? `${fmtInt(visibleNodes.length)} Terpetakan`
      : `${fmtInt(visibleNodes.length)} Simpul (${totalPoolVol > 0 ? ((visibleVol / totalPoolVol) * 100).toFixed(1) : '0.0'}% Pangsa)`,
  );

  // maxVal dari SELURUH simpul berkoordinat (bukan pool) — penyebut radius.
  const maxVal = $derived(
    Math.max(1, ...mapped.map((n) => valOf(n, metric, direction))),
  );
  const radiusOf = (v: number): number =>
    v <= 0 ? 2.5 : 3.2 + Math.pow(v / maxVal, 0.45) * 4.3;

  const nodesGeo = $derived.by(() => {
    return {
      type: 'FeatureCollection' as const,
      features: visibleNodes.map((n) => {
        const rank = rankOf.get(n.id) ?? 0;
        return {
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
            p_dat: n.p_dat,
            p_brg: n.p_brg,
            a_dat: n.a_dat,
            a_brg: n.a_brg,
            color: MODA[n.m].color,
            radius: radiusOf(valOf(n, metric, direction)),
            stroke: rank >= 1 && rank <= 10 ? '#f59e0b' : '#ffffff',
            strokeWidth: rank >= 1 && rank <= 10 ? 1.5 : 0.8,
            rank,
            sharePct: totalPoolVol > 0 ? (valOf(n, metric, direction) / totalPoolVol) * 100 : 0,
          } satisfies NodeProps & { color: string },
        };
      }),
    };
  });

  // --- Choropleth provinsi ---
  const HEAT_STOPS = [
    { max: 0.05, color: '#38bdf8' },
    { max: 0.15, color: '#06b6d4' },
    { max: 0.35, color: '#10b981' },
    { max: 0.65, color: '#f59e0b' },
    { max: Infinity, color: '#ef4444' },
  ] as const;
  const HEAT_OPACITY_DARK = [0.4, 0.48, 0.58, 0.68, 0.78];
  const HEAT_OPACITY_LIGHT = [0.35, 0.42, 0.52, 0.62, 0.72];

  const provStats = $derived.by(() => {
    const agg = new Map<string, { vol: number; count: number; modas: Partial<Record<ModaKey, number>> }>();
    for (const n of pool) {
      const key = normalizeProvinceName(n.p);
      const cur = agg.get(key) ?? { vol: 0, count: 0, modas: {} };
      const v = valOf(n, metric, direction);
      cur.vol += v;
      cur.count += 1;
      cur.modas[n.m] = (cur.modas[n.m] ?? 0) + v;
      agg.set(key, cur);
    }
    return agg;
  });
  const nationalVol = $derived([...provStats.values()].reduce((s, x) => s + x.vol, 0));
  const maxProvVol = $derived(Math.max(0, ...[...provStats.values()].map((x) => x.vol)));

  const chorGeo = $derived.by(() => {
    const dark = themeStore.current === 'dark';
    const features = (geoInput?.features ?? []).map((f) => {
      const name = normalizeProvinceName(String(f.properties?.PROVINSI ?? ''));
      const st = provStats.get(name);
      const vol = st?.vol ?? 0;
      const r = maxProvVol > 0 ? vol / maxProvVol : 0;
      const idx = HEAT_STOPS.findIndex((s) => r < s.max);
      const bucket = idx === -1 ? HEAT_STOPS.length - 1 : idx;
      const domModa = st
        ? (Object.entries(st.modas).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] as ModaKey | undefined)
        : undefined;
      const props: ProvProps = {
        name: String(f.properties?.PROVINSI ?? name),
        vol,
        sharePct: nationalVol > 0 ? (vol / nationalVol) * 100 : 0,
        count: st?.count ?? 0,
        domModa: domModa ? MODA[domModa].label : '–',
        fillColor: vol <= 0 ? (dark ? '#334155' : '#cbd5e1') : HEAT_STOPS[bucket].color,
        fillOpacity: vol <= 0 ? 0.15 : (dark ? HEAT_OPACITY_DARK[bucket] : HEAT_OPACITY_LIGHT[bucket]),
        border: dark ? '#475569' : '#ffffff',
      };
      return { type: 'Feature' as const, geometry: f.geometry as never, properties: props };
    });
    return { type: 'FeatureCollection' as const, features };
  });

  let container: HTMLDivElement | null = $state(null);
  let map: maplibregl.Map | null = null;
  let popup: maplibregl.Popup | null = null;
  let ml: typeof import('maplibre-gl') | null = null;
  let hoverProvId: number | string | null = null;
  let hoverNodeId: number | string | null = null;

  function setHoverProv(id: number | string | null) {
    if (!map) return;
    if (hoverProvId !== null) {
      try {
        map.setFeatureState({ source: 'provinces', id: hoverProvId }, { hover: false });
      } catch {
        /* abaikan */
      }
    }
    hoverProvId = id;
    if (id !== null) {
      try {
        map.setFeatureState({ source: 'provinces', id }, { hover: true });
      } catch {
        /* abaikan */
      }
    }
  }

  function setHoverNode(id: number | string | null) {
    if (!map) return;
    if (hoverNodeId !== null) {
      try {
        map.setFeatureState({ source: 'nodes', id: hoverNodeId }, { hover: false });
      } catch {
        /* abaikan */
      }
    }
    hoverNodeId = id;
    if (id !== null) {
      try {
        map.setFeatureState({ source: 'nodes', id }, { hover: true });
      } catch {
        /* abaikan */
      }
    }
  }

  function refreshSources() {
    if (!map) return;
    const nodesSrc = map.getSource('nodes') as maplibregl.GeoJSONSource | undefined;
    if (nodesSrc) nodesSrc.setData(nodesGeo as never);
    const provSrc = map.getSource('provinces') as maplibregl.GeoJSONSource | undefined;
    if (provSrc) provSrc.setData(chorGeo as never);
    if (map.getLayer('provinces-fill'))
      map.setLayoutProperty('provinces-fill', 'visibility', showHeatmap ? 'visible' : 'none');
    if (map.getLayer('provinces-line'))
      map.setLayoutProperty('provinces-line', 'visibility', showHeatmap ? 'visible' : 'none');
    if (map.getLayer('nodes'))
      map.setLayoutProperty('nodes', 'visibility', showNodes ? 'visible' : 'none');
  }

  function openPopup(lng: number, lat: number, p: NodeProps) {
    if (!map || !ml) return;
    popup?.remove();
    popup = new ml.Popup({ closeButton: true, maxWidth: '300px' })
      .setLngLat([lng, lat])
      .setHTML(popupHtml(p))
      .addTo(map);
  }

  function openProvPopup(lng: number, lat: number, p: ProvProps) {
    if (!map || !ml) return;
    popup?.remove();
    popup = new ml.Popup({ closeButton: true, maxWidth: '300px' })
      .setLngLat([lng, lat])
      .setHTML(provPopupHtml(p))
      .addTo(map);
  }

  function toggleModa(m: ModaKey) {
    activeModas = activeModas.includes(m) ? activeModas.filter((x) => x !== m) : [...activeModas, m];
  }

  function resetView() {
    map?.flyTo({ center: HOME, zoom: HOME_ZOOM, duration: 1200 });
  }

  const suggestions = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return mapped.filter((n) => n.nama.toLowerCase().includes(q)).slice(0, 8);
  });

  function pickNode(n: NodeRow) {
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
      p_dat: n.p_dat,
      p_brg: n.p_brg,
      a_dat: n.a_dat,
      a_brg: n.a_brg,
      radius: radiusOf(valOf(n, metric, direction)),
      stroke: '#ffffff',
      strokeWidth: 0.8,
      rank: rankOf.get(n.id) ?? 0,
      sharePct: totalPoolVol > 0 ? (valOf(n, metric, direction) / totalPoolVol) * 100 : 0,
    });
  }

  onMount(async () => {
    if (!browser || !container || map) return;
    ml = await import('maplibre-gl');
    const m = new ml.Map({
      container,
      style: ct.mapStyle,
      center: HOME,
      zoom: HOME_ZOOM,
      attributionControl: { compact: true },
    });
    m.addControl(new ml.NavigationControl({ visualizePitch: false }), 'top-right');

    const ensureLayers = () => {
      if (m.getSource('nodes') && m.getSource('provinces') && m.getLayer('nodes')) {
        refreshSources();
        return;
      }
      if (!m.getSource('provinces')) {
        m.addSource('provinces', { type: 'geojson', data: chorGeo as never, generateId: true });
      }
      if (!m.getLayer('provinces-fill')) {
        m.addLayer({
          id: 'provinces-fill',
          type: 'fill',
          source: 'provinces',
          paint: {
            'fill-color': ['get', 'fillColor'],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              ['min', ['+', ['get', 'fillOpacity'], 0.18], 0.9],
              ['get', 'fillOpacity'],
            ],
          },
        });
      }
      if (!m.getLayer('provinces-line')) {
        m.addLayer({
          id: 'provinces-line',
          type: 'line',
          source: 'provinces',
          paint: {
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#1d4ed8',
              ['get', 'border'],
            ],
            'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2.5, 1.2],
          },
        });
      }
      if (!m.getSource('nodes')) {
        m.addSource('nodes', { type: 'geojson', data: nodesGeo as never, generateId: true });
      }
      if (!m.getLayer('nodes')) {
        m.addLayer({
          id: 'nodes',
          type: 'circle',
          source: 'nodes',
          paint: {
            'circle-color': ['get', 'color'],
            'circle-radius': [
              '+',
              ['get', 'radius'],
              ['case', ['boolean', ['feature-state', 'hover'], false], 2, 0],
            ],
            'circle-opacity': 0.92,
            'circle-stroke-width': ['get', 'strokeWidth'],
            'circle-stroke-color': ['get', 'stroke'],
          },
        });
      }
      refreshSources();
    };

    m.on('load', ensureLayers);
    m.on('style.load', ensureLayers);
    m.on('click', 'nodes', (e) => {
      const feat = e.features?.[0];
      if (!feat || !feat.properties) return;
      openPopup(e.lngLat.lng, e.lngLat.lat, feat.properties as unknown as NodeProps);
    });
    m.on('click', 'provinces-fill', (e) => {
      const feat = e.features?.[0];
      if (!feat || !feat.properties) return;
      openProvPopup(e.lngLat.lng, e.lngLat.lat, feat.properties as unknown as ProvProps);
    });
    m.on('mousemove', 'provinces-fill', (e) => {
      const feat = e.features?.[0];
      m.getCanvas().style.cursor = 'pointer';
      if (feat && feat.id !== undefined) setHoverProv(feat.id);
    });
    m.on('mouseleave', 'provinces-fill', () => {
      m.getCanvas().style.cursor = '';
      setHoverProv(null);
    });
    m.on('mousemove', 'nodes', (e) => {
      const feat = e.features?.[0];
      m.getCanvas().style.cursor = 'pointer';
      if (feat && feat.id !== undefined) setHoverNode(feat.id);
    });
    m.on('mouseleave', 'nodes', () => {
      m.getCanvas().style.cursor = '';
      setHoverNode(null);
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

  // Ganti basemap saat tema berubah (ensureLayers terikat ke 'style.load' → layer dibangun ulang)
  $effect(() => {
    const style = ct.mapStyle;
    if (map && map.isStyleLoaded()) map.setStyle(style);
  });

  // Segarkan data + visibilitas layer saat filter / metrik / tema berubah
  $effect(() => {
    void nodesGeo;
    void chorGeo;
    void showHeatmap;
    void showNodes;
    if (map && map.isStyleLoaded()) refreshSources();
  });

  const metricOpts = [
    { value: 'pnp' as MetricKey, label: 'Penumpang' },
    { value: 'arm' as MetricKey, label: 'Armada' },
  ];
  const directionOpts = [
    { value: 'tot' as DirectionKey, label: 'Total' },
    { value: 'dat' as DirectionKey, label: 'Datang' },
    { value: 'brg' as DirectionKey, label: 'Berangkat' },
  ];
  const scaleOpts = [
    { value: 'all' as ScaleKey, label: 'Semua Simpul' },
    { value: 'top10' as ScaleKey, label: 'Top 10' },
    { value: 'top20' as ScaleKey, label: 'Top 20' },
    { value: 'top30' as ScaleKey, label: 'Top 30' },
    { value: 'top50' as ScaleKey, label: 'Top 50' },
    { value: 'pareto80' as ScaleKey, label: 'Pareto 80%' },
    { value: 'pareto90' as ScaleKey, label: 'Pareto 90%' },
  ];

  function toggleLayer(which: 'heatmap' | 'nodes') {
    if (which === 'heatmap') showHeatmap = !showHeatmap;
    else showNodes = !showNodes;
  }
</script>

<div class="space-y-4">
  <CardHeader
    title="Peta Spasial Simpul"
    subtitle={`Heatmap intensitas mobilitas batas wilayah 38 provinsi terpadu dengan sebaran ${fmtInt(mapped.length)} titik simpul transportasi nasional (Udara, KA, Bus, ASDP, dan Laut). Klik provinsi atau lingkaran untuk detail.`}
  >
    {#snippet icon()}<MapIcon size={16} />{/snippet}
    {#snippet action()}
      <button
        onclick={resetView}
        class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-fill px-3.5 py-2 text-[12.5px] font-semibold text-ink-2 transition hover:bg-fill hover:text-ink"
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
                : 'border-line text-ink-3 opacity-60 hover:opacity-100'
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
        <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">Metrik</p>
        <Segmented
          options={metricOpts}
          value={metric}
          onChange={(v) => (metric = v)}
        />
      </div>
      <div>
        <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">Arah</p>
        <Segmented
          options={directionOpts}
          value={direction}
          onChange={(v) => (direction = v)}
        />
      </div>
      <div>
        <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">Skala titik</p>
        <select
          bind:value={scale}
          class="rounded-xl border border-line bg-fill px-3 py-2 text-[12.5px] font-semibold text-ink outline-none"
          aria-label="Filter skala titik simpul"
        >
          {#each scaleOpts as o}
            <option value={o.value}>{o.label}</option>
          {/each}
        </select>
      </div>
      <div>
        <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">Layer</p>
        <div class="flex gap-2">
          <button
            onclick={() => toggleLayer('heatmap')}
            class={`cursor-pointer rounded-xl border px-3 py-2 text-[12.5px] font-semibold transition ${showHeatmap ? 'border-line bg-panel text-ink shadow-sm' : 'border-line text-ink-3 opacity-60 hover:opacity-100'}`}
            aria-pressed={showHeatmap}
          >
            Heatmap Wilayah
          </button>
          <button
            onclick={() => toggleLayer('nodes')}
            class={`cursor-pointer rounded-xl border px-3 py-2 text-[12.5px] font-semibold transition ${showNodes ? 'border-line bg-panel text-ink shadow-sm' : 'border-line text-ink-3 opacity-60 hover:opacity-100'}`}
            aria-pressed={showNodes}
          >
            Titik Simpul
          </button>
        </div>
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
            class="w-full rounded-xl border border-line bg-fill py-2 pl-9 pr-9 text-[13px] text-ink outline-none placeholder:text-ink-3 focus:border-line"
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
            class="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-line bg-panel-2 shadow-xl"
          >
            {#each suggestions as n}
              <button
                onclick={() => pickNode(n)}
                class="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left transition hover:bg-fill"
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

  <div class="relative overflow-hidden rounded-2xl border border-line">
    <div bind:this={container} class="h-[520px] w-full"></div>

    <div class="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
      <div
        class="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel-2/90 px-3 py-1.5 text-[11.5px] font-bold text-ink-2 shadow-sm backdrop-blur"
      >
        <MapPin size={13} class="text-ink-3" />
        <span class="num">{scaleBadge}</span>
      </div>
      <div
        class="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel-2/90 px-3 py-1.5 text-[11.5px] font-bold text-ink-2 shadow-sm backdrop-blur"
      >
        <span class="num">{fmtInt(mapped.length)} terpetakan</span>
        <span class="text-ink-3">•</span>
        <span class="num font-semibold text-ink-3">{fmtInt(unmappedCount)} tanpa koordinat</span>
      </div>
    </div>

    <div class="absolute bottom-9 left-3 z-10">
      <div class="rounded-xl border border-line bg-panel-2/90 p-3 shadow-sm backdrop-blur">
        <p class="mb-2 text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-3">Heatmap wilayah</p>
        <div
          class="h-2 w-44 rounded-full"
          style="background:linear-gradient(90deg,#38bdf8,#06b6d4,#10b981,#f59e0b,#ef4444)"
        ></div>
        <div class="mt-1 flex w-44 justify-between text-[10px] font-semibold text-ink-3">
          <span>Rendah</span>
          <span>Puncak</span>
        </div>
        <div class="mt-0.5 flex w-44 justify-between text-[10px] text-ink-3">
          <span>&lt;5%</span>
          <span>15%</span>
          <span>35%</span>
          <span>65%+</span>
        </div>
        <p class="mb-2 mt-3 text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-3">Legenda moda</p>
        <div class="space-y-1.5">
          {#each MODA_KEYS as m}
            <div class="flex items-center gap-2 text-[12px]">
              <span class="size-2.5 rounded-full" style={`background:${MODA[m].color}`}></span>
              <span class="font-semibold text-ink-2">{MODA[m].short}</span>
              <span class="num ml-auto pl-4 text-[11px] text-ink-3">{fmtInt(countByModa[m])}</span>
            </div>
          {/each}
        </div>
        <p class="mt-2 border-t border-line pt-2 text-[10.5px] text-ink-3">
          Ukuran lingkaran ∝ {metric === 'pnp' ? 'penumpang' : 'armada'} ({DIRECTION_LABEL[direction].toLowerCase()})
        </p>
      </div>
    </div>
  </div>
</div>
