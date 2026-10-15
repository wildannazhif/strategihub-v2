<script lang="ts">
  import Card from '$lib/components/Card.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import Segmented from '$lib/components/Segmented.svelte';
  import KpiCard from '$lib/components/KpiCard.svelte';
  import { data } from '$lib/data';
  import { fmtInt } from '$lib/format';
  import { themeStore, chartTheme } from '$lib/theme.svelte';
  import type { ODUdaraRoute } from '$lib/data/types';
  import RouteIcon from 'lucide-svelte/icons/route';
  import Plane from 'lucide-svelte/icons/plane';
  import Package from 'lucide-svelte/icons/package';
  import Users from 'lucide-svelte/icons/users';
  import ZoomIn from 'lucide-svelte/icons/zoom-in';
  import ZoomOut from 'lucide-svelte/icons/zoom-out';
  import Crosshair from 'lucide-svelte/icons/crosshair';
  import X from 'lucide-svelte/icons/x';
  import Info from 'lucide-svelte/icons/info';
  import Network from 'lucide-svelte/icons/network';
  import MapIcon from 'lucide-svelte/icons/map';
  import RotateCcw from 'lucide-svelte/icons/rotate-ccw';

  const ct = $derived(chartTheme(themeStore.current === 'dark'));
  const dark = $derived(themeStore.current === 'dark');

  const odMap = data.od_udara_map;
  const odSankey = data.od_udara_sankey;
  const airportsByCode = new Map(odMap.airports.map((a) => [a.code, a]));

  const MEGAHUBS = ['CGK', 'SUB', 'DPS', 'UPG', 'KNO', 'BPN', 'BTH', 'YIA', 'BDJ', 'LOP'];
  const isMega = (code: string) => MEGAHUBS.includes(code);

  /** Poligon daratan Indonesia (619 sub-path, diekstrak dari peta v1, dipadatkan:
   *  perintah `L` implisit + semua sub-path digabung dalam satu `d`). Koordinat
   *  dalam ruang viewBox yang sama dengan bandara/rute (0 0 1000 540). */
  const LANDMASS = data.od_udara_land;

  const fmtTon = (kg: number) => `${(kg / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Ton`;
  const fmtDensity = (pax: number, flt: number) =>
    flt > 0 ? (pax / flt).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '–';

  type ViewKey = 'map' | 'sankey';
  let view = $state<ViewKey>('map');

  /* ============================== PETA ============================== */

  type SchemeKey = 'INCLUDE' | 'EXCLUDE';
  type MapMetric = 'pax' | 'flt' | 'crg';
  let scheme = $state<SchemeKey>('EXCLUDE');
  let mapMetric = $state<MapMetric>('pax');
  let hubSel = $state('ALL');
  let threshold = $state(0);
  let pinned = $state<string | null>(null);
  let zoom = $state(1);
  let panX = $state(0);
  let panY = $state(0);

  const metricVal = (r: ODUdaraRoute) =>
    mapMetric === 'pax' ? r.pax : mapMetric === 'flt' ? r.flt : r.crg;

  const schemeOnlyRoutes = $derived(odMap.routes.filter((r) => scheme === 'INCLUDE' || !r.zp));
  // Threshold peta selalu memakai `pax`, apa pun metrik aktif (perilaku v1).
  const schemeRoutes = $derived(schemeOnlyRoutes.filter((r) => r.pax >= threshold));
  const visibleRoutes = $derived(
    pinned ? schemeRoutes.filter((r) => r.oc === pinned || r.dc === pinned) : schemeRoutes,
  );
  const sortedRoutes = $derived([...visibleRoutes].sort((a, b) => metricVal(a) - metricVal(b)));
  const connectedSet = $derived(new Set(visibleRoutes.flatMap((r) => [r.oc, r.dc])));

  const mapKpi = $derived.by(() => {
    let pax = 0;
    let flt = 0;
    let crg = 0;
    for (const r of schemeRoutes) {
      pax += r.pax;
      flt += r.flt;
      crg += r.crg;
    }
    let zpFlt = 0;
    let zpCrg = 0;
    for (const r of schemeOnlyRoutes) {
      if (r.zp) {
        zpFlt += r.flt;
        zpCrg += r.crg;
      }
    }
    return { pax, flt, crg, routes: schemeRoutes.length, zpFlt, zpCrg };
  });

  const longestRoute = $derived(
    schemeRoutes.reduce<ODUdaraRoute | null>(
      (best, r) => (!best || r.dist > best.dist ? r : best),
      null,
    ),
  );
  const top5Routes = $derived([...schemeRoutes].sort((a, b) => b.pax - a.pax).slice(0, 5));

  // Statistik jaringan penuh (semua 1.273 rute) untuk insight — dihitung dari data.
  const networkStats = $derived.by(() => {
    let totalPax = 0;
    let cgkPax = 0;
    let zpRoutes = 0;
    let zpWithCargo = 0;
    for (const r of odMap.routes) {
      totalPax += r.pax;
      if (r.oc === 'CGK' || r.dc === 'CGK') cgkPax += r.pax;
      if (r.zp) {
        zpRoutes += 1;
        if (r.crg > 0) zpWithCargo += 1;
      }
    }
    // Bandara yang kehilangan SELURUH rute di EXCLUDE (semua rutenya zp).
    const noArc = odMap.airports
      .filter((a) => !odMap.routes.some((r) => !r.zp && (r.oc === a.code || r.dc === a.code)))
      .map((a) => a.code);
    return {
      totalPax,
      cgkShare: totalPax > 0 ? (cgkPax / totalPax) * 100 : 0,
      zpRoutes,
      zpWithCargo,
      noArc,
    };
  });

  const pinStats = $derived.by(() => {
    if (!pinned) return null;
    const airport = airportsByCode.get(pinned);
    if (!airport) return null;
    const rs = schemeRoutes.filter((r) => r.oc === pinned || r.dc === pinned);
    return {
      airport,
      routes: rs.length,
      pax: rs.reduce((s, r) => s + r.pax, 0),
      flt: rs.reduce((s, r) => s + r.flt, 0),
    };
  });

  const mapColors = $derived({
    bg: dark ? '#090d16' : '#e9eef5',
    land: dark ? '#141e30' : '#c2cfdd',
    landStroke: dark ? '#223249' : '#8fa3b8',
    grid: dark ? '#1e293b' : '#cbd5e1',
    grat: dark ? '#64748b' : '#64748b',
    labelStroke: dark ? '#090d16' : '#e9eef5',
  });

  // Proyeksi equirectangular v1 (untuk graticula akurat, bukan dekoratif v1).
  const lonX = (lon: number) => 21.2764 * lon - 2010.61;
  const latY = (lat: number) => -30.5079 * lat + 189.15;

  function arcStyle(r: ODUdaraRoute) {
    if (r.zp) return { color: '#f59e0b', width: 1.0, opacity: 0.7, dash: '4,3' };
    if (mapMetric === 'pax') {
      if (r.pax >= 50000) return { color: '#f59e0b', width: 3.2, opacity: 0.85, dash: '' };
      if (r.pax >= 20000) return { color: '#38bdf8', width: 2.2, opacity: 0.75, dash: '' };
      if (r.pax >= 5000) return { color: '#60a5fa', width: 1.5, opacity: 0.6, dash: '' };
      return { color: '#64748b', width: 0.8, opacity: 0.35, dash: '' };
    }
    if (mapMetric === 'flt') {
      if (r.flt >= 400) return { color: '#34d399', width: 3.0, opacity: 0.85, dash: '' };
      if (r.flt >= 100) return { color: '#38bdf8', width: 1.8, opacity: 0.7, dash: '' };
      return { color: '#64748b', width: 0.8, opacity: 0.35, dash: '' };
    }
    if (r.crg >= 500000) return { color: '#c084fc', width: 3.0, opacity: 0.85, dash: '' };
    if (r.crg >= 100000) return { color: '#818cf8', width: 1.8, opacity: 0.7, dash: '' };
    return { color: '#64748b', width: 0.8, opacity: 0.35, dash: '' };
  }

  // --- Tooltip + pan/zoom peta ---
  type MapTip =
    | { kind: 'route'; route: ODUdaraRoute }
    | { kind: 'airport'; code: string }
    | null;
  let mapTip = $state<MapTip>(null);
  let mapTipX = $state(0);
  let mapTipY = $state(0);
  let mapWrap = $state<HTMLDivElement>();
  let mapWrapW = $state(1100);
  let dragging = false;
  let dragMoved = 0;
  let lastPX = 0;
  let lastPY = 0;

  function onMapPointerDown(e: PointerEvent) {
    dragging = true;
    dragMoved = 0;
    lastPX = e.clientX;
    lastPY = e.clientY;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }
  function onMapPointerMove(e: PointerEvent) {
    const el = mapWrap;
    if (el) {
      const rect = el.getBoundingClientRect();
      mapWrapW = rect.width;
      mapTipX = Math.max(0, Math.min(e.clientX - rect.left, rect.width - 260));
      mapTipY = Math.max(0, Math.min(e.clientY - rect.top, rect.height - 200));
    }
    if (dragging) {
      const dx = e.clientX - lastPX;
      const dy = e.clientY - lastPY;
      dragMoved += Math.abs(dx) + Math.abs(dy);
      panX += dx;
      panY += dy;
      lastPX = e.clientX;
      lastPY = e.clientY;
    }
  }
  function onMapPointerUp() {
    dragging = false;
  }
  function zoomBy(f: number) {
    zoom = Math.min(8, Math.max(0.8, zoom * f));
  }
  function resetMapView() {
    zoom = 1;
    panX = 0;
    panY = 0;
  }
  $effect(() => {
    const el = mapWrap;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1.15 : 0.87);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  function onHubChange(code: string) {
    hubSel = code;
    pinned = code === 'ALL' ? null : code;
  }
  function onAirportClick(code: string) {
    if (dragMoved >= 6) return; // abaikan klik setelah drag (pan)
    const next = pinned === code ? null : code;
    pinned = next;
    hubSel = next && MEGAHUBS.includes(next) ? next : 'ALL';
  }
  function clearPin() {
    pinned = null;
    hubSel = 'ALL';
  }

  /* ============================== SANKEY ============================== */

  type SankeyView = 'hub' | 'island';
  let sankeyView = $state<SankeyView>('hub');
  let originFilter = $state('ALL');
  let sankeyThreshold = $state(10000);
  let selectedNode = $state<string | null>(null);
  let hoverLinkKey = $state<string | null>(null);
  let hoverNodeName = $state<string | null>(null);
  let sankeyTip = $state<{ kind: 'link' | 'node'; key: string; x: number; y: number } | null>(null);
  let sankeyWrap = $state<HTMLDivElement>();

  const originOptions = $derived(
    ['CGK', 'SUB', 'DPS', 'UPG', 'KNO', 'BPN'].map((code) => ({
      code,
      label: odSankey.hub_flows.find((l) => l.source.startsWith(code))?.source ?? code,
    })),
  );

  const sankeyLinks = $derived(
    sankeyView === 'hub'
      ? odSankey.hub_flows.filter(
          (l) =>
            (originFilter === 'ALL' || l.source.startsWith(originFilter)) &&
            l.value >= sankeyThreshold,
        )
      : odSankey.island_flows,
  );

  const HUB_COLORS: Record<string, string> = {
    CGK: '#2563eb', SUB: '#0d9488', DPS: '#f59e0b', UPG: '#10b981', KNO: '#8b5cf6',
    BPN: '#ec4899', BTH: '#06b6d4', YIA: '#6366f1', BDJ: '#14b8a6', LOP: '#f97316',
    PLM: '#84cc16', PKU: '#a855f7', PDG: '#3b82f6', PNK: '#eab308', SRG: '#64748b', MDC: '#ef4444',
  };
  const ISLAND_COLORS: Record<string, string> = {
    Jawa: '#2563eb', Sumatera: '#10b981', 'Bali & Nusra': '#f59e0b', Kalimantan: '#ec4899',
    Sulawesi: '#8b5cf6', 'Maluku & Papua': '#06b6d4', Lainnya: '#94a3b8',
  };
  function nodeColor(label: string, viewKey: SankeyView): string {
    if (viewKey === 'island') return ISLAND_COLORS[label] ?? '#94a3b8';
    return HUB_COLORS[label.slice(0, 3)] ?? '#2563eb';
  }

  interface SankeyNodeGeom {
    name: string;
    side: 'left' | 'right';
    total: number;
    y: number;
    h: number;
    color: string;
  }
  interface SankeyLinkGeom {
    key: string;
    source: string;
    target: string;
    value: number;
    flights: number;
    sy: number;
    ty: number;
    h: number;
    path: string;
    sourceColor: string;
    targetColor: string;
  }

  const sankeyGeom = $derived.by(() => {
    const W = 1000;
    const H = 640;
    const padY = 40;
    const padX = sankeyView === 'hub' ? 190 : 160;
    const nodeW = 22;
    const gap = 12;
    const links = [...sankeyLinks].sort((a, b) => b.value - a.value);
    const leftTotals = new Map<string, number>();
    const rightTotals = new Map<string, number>();
    for (const l of links) {
      leftTotals.set(l.source, (leftTotals.get(l.source) ?? 0) + l.value);
      rightTotals.set(l.target, (rightTotals.get(l.target) ?? 0) + l.value);
    }
    const total = links.reduce((s, l) => s + l.value, 0);
    const maxN = Math.max(1, leftTotals.size, rightTotals.size);
    const scale = (H - 2 * padY - (maxN - 1) * gap) / Math.max(1, total);
    const buildSide = (totals: Map<string, number>, side: 'left' | 'right') => {
      const entries = [...totals.entries()].sort((a, b) => b[1] - a[1]);
      let y = padY;
      return entries.map(([name, v]) => {
        const node: SankeyNodeGeom = {
          name,
          side,
          total: v,
          y,
          h: Math.max(v * scale, 14),
          color: nodeColor(name, sankeyView),
        };
        y += node.h + gap;
        return node;
      });
    };
    const leftNodes = buildSide(leftTotals, 'left');
    const rightNodes = buildSide(rightTotals, 'right');
    const leftY = new Map(leftNodes.map((n) => [n.name, n.y]));
    const rightY = new Map(rightNodes.map((n) => [n.name, n.y]));
    const leftOff = new Map<string, number>();
    const rightOff = new Map<string, number>();
    const x1 = padX + nodeW;
    const x2 = W - padX - nodeW;
    const dx = x2 - x1;
    const linkGeoms: SankeyLinkGeom[] = links.map((l) => {
      const sy = (leftY.get(l.source) ?? padY) + (leftOff.get(l.source) ?? 0);
      const ty = (rightY.get(l.target) ?? padY) + (rightOff.get(l.target) ?? 0);
      const h = Math.max(l.value * scale, 0);
      leftOff.set(l.source, (leftOff.get(l.source) ?? 0) + h);
      rightOff.set(l.target, (rightOff.get(l.target) ?? 0) + h);
      const c1x = x1 + 0.45 * dx;
      const c2x = x2 - 0.45 * dx;
      return {
        key: `${l.source}|${l.target}`,
        source: l.source,
        target: l.target,
        value: l.value,
        flights: l.flights,
        sy,
        ty,
        h,
        path: `M ${x1} ${sy} C ${c1x} ${sy}, ${c2x} ${ty}, ${x2} ${ty} L ${x2} ${ty + h} C ${c2x} ${ty + h}, ${c1x} ${sy + h}, ${x1} ${sy + h} Z`,
        sourceColor: nodeColor(l.source, sankeyView),
        targetColor: nodeColor(l.target, sankeyView),
      };
    });
    return { W, H, padX, nodeW, leftNodes, rightNodes, linkGeoms, total };
  });

  const sankeyKpi = $derived.by(() => {
    const links = sankeyLinks;
    const pax = links.reduce((s, l) => s + l.value, 0);
    const flt = links.reduce((s, l) => s + l.flights, 0);
    const pair = new Map<string, { a: string; b: string; v: number }>();
    for (const l of links) {
      const [a, b] = [l.source, l.target].sort();
      const key = `${a}||${b}`;
      const e = pair.get(key) ?? { a, b, v: 0 };
      e.v += l.value;
      pair.set(key, e);
    }
    const best = [...pair.values()].sort((x, y) => y.v - x.v)[0];
    return { pax, flt, density: flt > 0 ? pax / flt : 0, best, corridors: links.length };
  });

  // Insight Sankey dari data mentah (tanpa filter) — pasangan terpadat & pangsa CGK.
  const sankeyInsight = $derived.by(() => {
    const pairSum = (links: { source: string; target: string; value: number }[], a: string, b: string) =>
      links.reduce((s, l) => s + ((l.source === a && l.target === b) || (l.source === b && l.target === a) ? l.value : 0), 0);
    const hubTotal = odSankey.hub_flows.reduce((s, l) => s + l.value, 0);
    const hubCgk = odSankey.hub_flows.reduce(
      (s, l) => s + (l.source.startsWith('CGK') || l.target.startsWith('CGK') ? l.value : 0),
      0,
    );
    return {
      hubPairs: [
        { label: 'Jakarta ⇄ Denpasar', v: pairSum(odSankey.hub_flows, 'CGK (Jakarta)', 'DPS (Denpasar)') },
        { label: 'Jakarta ⇄ Surabaya', v: pairSum(odSankey.hub_flows, 'CGK (Jakarta)', 'SUB (Surabaya)') },
        { label: 'Jakarta ⇄ Medan', v: pairSum(odSankey.hub_flows, 'CGK (Jakarta)', 'KNO (Medan)') },
      ],
      hubCgkShare: hubTotal > 0 ? (hubCgk / hubTotal) * 100 : 0,
      islandPairs: [
        { label: 'Jawa ⇄ Sumatera', v: pairSum(odSankey.island_flows, 'Jawa', 'Sumatera') },
        { label: 'Jawa ⇄ Bali & Nusra', v: pairSum(odSankey.island_flows, 'Jawa', 'Bali & Nusra') },
        { label: 'Jawa ⇄ Kalimantan', v: pairSum(odSankey.island_flows, 'Jawa', 'Kalimantan') },
      ],
      intraJawa: odSankey.island_flows.find((l) => l.source === 'Jawa' && l.target === 'Jawa')?.value ?? 0,
    };
  });

  const selectedDetail = $derived.by(() => {
    if (!selectedNode) return null;
    const flows = sankeyLinks.filter((l) => l.source === selectedNode || l.target === selectedNode);
    const out = flows.filter((l) => l.source === selectedNode);
    const inc = flows.filter((l) => l.target === selectedNode);
    return {
      name: selectedNode,
      flows,
      outPax: out.reduce((s, l) => s + l.value, 0),
      inPax: inc.reduce((s, l) => s + l.value, 0),
      outFlt: out.reduce((s, l) => s + l.flights, 0),
      inFlt: inc.reduce((s, l) => s + l.flights, 0),
    };
  });

  function sankeyLinkOpacity(lg: SankeyLinkGeom): number {
    if (hoverLinkKey) return lg.key === hoverLinkKey ? 0.95 : 0.12;
    const n = hoverNodeName ?? selectedNode;
    if (n) return lg.source === n || lg.target === n ? 0.9 : 0.1;
    return 0.52;
  }
  function sankeyNodeOpacity(name: string): number {
    const n = hoverNodeName ?? selectedNode;
    if (!n) return 1;
    const involved =
      name === n ||
      sankeyGeom.linkGeoms.some(
        (lg) =>
          (lg.source === n && lg.target === name) || (lg.target === n && lg.source === name),
      );
    return involved ? 1 : 0.35;
  }
  function onSankeyMouseMove(e: MouseEvent) {
    const el = sankeyWrap;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width - 260));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height - 170));
    if (sankeyTip) sankeyTip = { ...sankeyTip, x, y };
  }
  function resetSankeyHighlight() {
    selectedNode = null;
    hoverNodeName = null;
    hoverLinkKey = null;
    sankeyTip = null;
  }
  function onSankeyViewChange(v: SankeyView) {
    sankeyView = v;
    resetSankeyHighlight();
  }

  const fmtShare = (part: number, total: number) =>
    total > 0 ? `${((part / total) * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%` : '–';
</script>

<div class="space-y-4">
  <!-- Header -->
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <div class="flex flex-wrap items-center gap-2">
        <h1 class="text-[22px] font-extrabold tracking-tight text-ink">OD Udara</h1>
        {#if view === 'map'}
          <span
            class="rounded-full border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#f59e0b]"
          >
            2 Skema
          </span>
        {/if}
      </div>
      <p class="mt-1 text-[13px] text-ink-2">
        Origin–Destination penerbangan domestik • September 2026 • 227 bandara berpenumpang dari 232
        bandara dalam data
      </p>
    </div>
    <Segmented
      options={[
        { value: 'map', label: 'Peta Rute' },
        { value: 'sankey', label: 'Diagram Sankey' },
      ]}
      value={view}
      onChange={(v) => (view = v)}
    />
  </div>

  {#if view === 'map'}
    <!-- KPI strip peta (dari data terfilter: skema + threshold) -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiCard
        label="Total Penumpang"
        value={fmtInt(mapKpi.pax)}
        sub={threshold > 0 ? `Filter ≥ ${fmtInt(threshold)} pax aktif` : 'September 2026'}
        accent="#38bdf8"
      >
        {#snippet icon()}<Users size={16} />{/snippet}
      </KpiCard>
      <KpiCard
        label="Total Penerbangan"
        value={fmtInt(mapKpi.flt)}
        sub={threshold > 0
          ? `Filter ≥ ${fmtInt(threshold)} pax aktif`
          : scheme === 'INCLUDE'
            ? `Termasuk ${fmtInt(mapKpi.zpFlt)} penerbangan 0-penumpang`
            : 'Rute komersial (pax > 0)'}
        accent="#34d399"
      >
        {#snippet icon()}<Plane size={16} />{/snippet}
      </KpiCard>
      <KpiCard
        label="Muatan Kargo"
        value={fmtTon(mapKpi.crg)}
        sub={threshold > 0
          ? `Filter ≥ ${fmtInt(threshold)} pax aktif`
          : scheme === 'INCLUDE'
            ? `Termasuk ${fmtTon(mapKpi.zpCrg)} dari rute 0-penumpang`
            : 'Kargo komersial'}
        accent="#f59e0b"
      >
        {#snippet icon()}<Package size={16} />{/snippet}
      </KpiCard>
      <KpiCard
        label="Rute Tampil"
        value={fmtInt(mapKpi.routes)}
        sub={`dari ${fmtInt(odMap.routes.length)} rute dalam data`}
        accent="#818cf8"
      >
        {#snippet icon()}<RouteIcon size={16} />{/snippet}
      </KpiCard>
    </div>

    <!-- Kontrol peta -->
    <Card class="p-4">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div class="flex flex-col gap-1.5">
          <span class="text-[11px] font-bold uppercase tracking-wider text-ink-3">Skema</span>
          <Segmented
            options={[
              { value: 'INCLUDE', label: 'Skema 1: INCLUDE' },
              { value: 'EXCLUDE', label: 'Skema 2: EXCLUDE' },
            ]}
            value={scheme}
            onChange={(v) => (scheme = v)}
            size="sm"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <span class="text-[11px] font-bold uppercase tracking-wider text-ink-3">Metrik busur</span>
          <Segmented
            options={[
              { value: 'pax', label: 'Penumpang' },
              { value: 'flt', label: 'Frekuensi' },
              { value: 'crg', label: 'Kargo' },
            ]}
            value={mapMetric}
            onChange={(v) => (mapMetric = v)}
            size="sm"
          />
        </div>
        <label class="flex flex-col gap-1.5">
          <span class="text-[11px] font-bold uppercase tracking-wider text-ink-3">Filter hub</span>
          <select
            value={hubSel}
            onchange={(e) => onHubChange((e.target as HTMLSelectElement).value)}
            class="cursor-pointer rounded-xl border border-line bg-fill px-3 py-2 text-[13px] font-semibold text-ink outline-none focus:border-[#38bdf8]"
          >
            <option value="ALL">Semua bandara</option>
            {#each MEGAHUBS as code}
              <option value={code}>{code} — {airportsByCode.get(code)?.name ?? code}</option>
            {/each}
          </select>
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-[11px] font-bold uppercase tracking-wider text-ink-3">Min. arus (pax)</span>
          <select
            value={threshold}
            onchange={(e) => (threshold = Number((e.target as HTMLSelectElement).value))}
            class="cursor-pointer rounded-xl border border-line bg-fill px-3 py-2 text-[13px] font-semibold text-ink outline-none focus:border-[#38bdf8]"
          >
            <option value={0}>Tampilkan semua rute</option>
            <option value={5000}>≥ 5.000 pax</option>
            <option value={20000}>Koridor utama (≥ 20.000)</option>
            <option value={50000}>Arteri super sibuk (≥ 50.000)</option>
          </select>
        </label>
        <p class="max-w-xs text-[11.5px] leading-relaxed text-ink-3">
          {scheme === 'INCLUDE'
            ? 'INCLUDE: semua 1.273 rute, termasuk 276 rute 0-penumpang (busur amber putus-putus).'
            : 'EXCLUDE: hanya 997 rute komersial berpenumpang. 5 bandara perintis tidak punya busur di skema ini.'}
        </p>
      </div>
    </Card>

    <!-- Peta -->
    <Card class="overflow-hidden">
      <div class="flex items-center justify-between gap-2 px-4 pt-4 sm:px-5">
        <CardHeader
          title="Peta Rute OD Interaktif"
          subtitle={longestRoute
            ? `Rute terpanjang: ${longestRoute.oc} → ${longestRoute.dc} • ${fmtInt(longestRoute.dist)} km`
            : 'September 2026'}
        >
          {#snippet icon()}<MapIcon size={16} />{/snippet}
        </CardHeader>
        <div class="flex shrink-0 items-center gap-1.5">
          <button
            onclick={() => zoomBy(1.25)}
            class="grid size-8 cursor-pointer place-items-center rounded-lg border border-line bg-fill text-ink hover:text-accent"
            title="Perbesar"
            aria-label="Perbesar"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onclick={() => zoomBy(0.8)}
            class="grid size-8 cursor-pointer place-items-center rounded-lg border border-line bg-fill text-ink hover:text-accent"
            title="Perkecil"
            aria-label="Perkecil"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onclick={resetMapView}
            class="grid size-8 cursor-pointer place-items-center rounded-lg border border-line bg-fill text-ink hover:text-accent"
            title="Reset tampilan"
            aria-label="Reset tampilan"
          >
            <Crosshair size={16} />
          </button>
        </div>
      </div>
      <div class="relative" bind:this={mapWrap}>
        <svg
          viewBox="0 0 1000 540"
          role="img"
          aria-label="Peta rute OD penerbangan domestik September 2026"
          class="h-[520px] w-full cursor-grab touch-none select-none active:cursor-grabbing sm:h-[600px]"
          preserveAspectRatio="xMidYMid meet"
          onpointerdown={onMapPointerDown}
          onpointermove={onMapPointerMove}
          onpointerup={onMapPointerUp}
          onpointerleave={() => {
            onMapPointerUp();
            mapTip = null;
          }}
        >
          <defs>
            <pattern id="od-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke={mapColors.grid} stroke-width="0.5" />
            </pattern>
          </defs>
          <g transform={`translate(${panX},${panY}) scale(${zoom})`}>
            <rect width="1000" height="540" fill={mapColors.bg} />
            <rect width="1000" height="540" fill="url(#od-grid)" />
            <path
              d={LANDMASS}
              fill={mapColors.land}
              stroke={mapColors.landStroke}
              stroke-width="0.7"
            />
            <!-- Gratikula (dihitung dari proyeksi yang sama dengan koordinat bandara) -->
            <line
              x1="0"
              x2="1000"
              y1={latY(0)}
              y2={latY(0)}
              stroke={mapColors.grat}
              stroke-width="0.6"
              stroke-dasharray="5,4"
            />
            {#each [95, 105, 115, 125, 135, 141] as lon}
              <text x={lonX(lon)} y="532" text-anchor="middle" font-size="9" fill={mapColors.grat}>
                {lon}°E
              </text>
            {/each}
            {#each [5, 0, -5, -10] as lat}
              <text x="6" y={latY(lat) + 3} font-size="9" fill={mapColors.grat}>
                {lat === 0 ? '0° Katulistiwa' : `${Math.abs(lat)}°${lat > 0 ? 'N' : 'S'}`}
              </text>
            {/each}
            <!-- Busur rute (diurut menaik metrik: terberat tergambar paling atas) -->
            {#each sortedRoutes as r (`${r.oc}>${r.dc}`)}
              {@const st = arcStyle(r)}
              <path
                d={`M ${r.x1} ${r.y1} Q ${r.cx} ${r.cy} ${r.x2} ${r.y2}`}
                fill="none"
                role="img"
                aria-label={`Rute ${r.oc} ke ${r.dc}`}
                stroke={st.color}
                stroke-width={st.width}
                stroke-opacity={st.opacity}
                stroke-dasharray={st.dash || undefined}
                stroke-linecap="round"
                style="pointer-events: stroke; cursor: pointer;"
                onmouseenter={() => (mapTip = { kind: 'route', route: r })}
                onmouseleave={() => (mapTip = null)}
              />
            {/each}
            <!-- Pin bandara -->
            {#each odMap.airports as a (a.code)}
              {@const mega = isMega(a.code)}
              {@const dimmed = pinned !== null && !connectedSet.has(a.code)}
              {@const hovered = mapTip?.kind === 'airport' && mapTip.code === a.code}
              <g opacity={dimmed ? 0.25 : 1}>
                {#if mega}
                  <circle cx={a.px} cy={a.py} r="6" fill="none" stroke="#f59e0b" stroke-width="1.5" pointer-events="none">
                    <animate attributeName="r" values="6;24" dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.9;0" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                {/if}
                <circle
                  cx={a.px}
                  cy={a.py}
                  r={mega ? (hovered ? 7 : 5.5) : hovered ? 3.5 : 2.5}
                  fill={mega ? '#f59e0b' : '#38bdf8'}
                  stroke="#0f172a"
                  stroke-width="1"
                  role="button"
                  tabindex="0"
                  aria-label={`Bandara ${a.code} ${a.name}`}
                  style="cursor: pointer;"
                  onclick={() => onAirportClick(a.code)}
                  onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onAirportClick(a.code);
                    }
                  }}
                  onmouseenter={() => (mapTip = { kind: 'airport', code: a.code })}
                  onmouseleave={() => (mapTip = null)}
                />
                {#if mega}
                  <text
                    x={a.px + 7}
                    y={a.py + 3}
                    font-size="9.5"
                    font-weight="800"
                    fill={ct.fg}
                    style={`paint-order: stroke; stroke: ${mapColors.labelStroke}; stroke-width: 2.5px; pointer-events: none;`}
                  >
                    {a.code}
                  </text>
                {/if}
              </g>
            {/each}
          </g>
        </svg>

        <!-- Kartu pin bandara -->
        {#if pinStats}
          <div class="absolute left-3 top-3 z-10 w-64 rounded-xl border border-line bg-panel p-3 shadow-xl">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-[13px] font-extrabold text-ink">
                  {pinStats.airport.code} — {pinStats.airport.name.split(' ')[0]}
                </p>
                <p class="text-[11.5px] text-ink-3">{pinStats.airport.name}</p>
              </div>
              <button
                onclick={clearPin}
                class="grid size-6 shrink-0 cursor-pointer place-items-center rounded-md border border-line text-ink-3 hover:text-ink"
                title="Tutup"
                aria-label="Tutup"
              >
                <X size={13} />
              </button>
            </div>
            <div class="mt-2 space-y-1 text-[12px] text-ink-2">
              <p class="flex justify-between"><span>Rute terhubung</span><b class="text-ink">{fmtInt(pinStats.routes)} rute</b></p>
              <p class="flex justify-between"><span>Total penumpang</span><b class="text-ink">{fmtInt(pinStats.pax)} pax</b></p>
              <p class="flex justify-between"><span>Total penerbangan</span><b class="text-ink">{fmtInt(pinStats.flt)} flights</b></p>
            </div>
            {#if pinStats.routes === 0}
              <p class="mt-2 rounded-lg bg-[#f59e0b]/10 px-2 py-1.5 text-[11px] leading-relaxed text-ink-2">
                Tidak ada busur di skema EXCLUDE — seluruh rute bandara ini 0-penumpang.
              </p>
            {/if}
          </div>
        {/if}

        <!-- Legenda -->
        <div class="absolute bottom-3 left-3 z-10 rounded-xl border border-line bg-panel/95 px-3 py-2 text-[11px] text-ink-2 shadow-lg">
          <p class="flex items-center gap-2"><span class="size-2.5 rounded-full bg-[#f59e0b]"></span> Megahub utama (Top 10)</p>
          <p class="mt-1 flex items-center gap-2"><span class="size-2.5 rounded-full bg-[#38bdf8]"></span> Bandara pengumpan / feeder</p>
          <p class="mt-1 flex items-center gap-2">
            <span class="inline-block h-0.5 w-5 bg-[#38bdf8]"></span> Rute komersial berpenumpang
          </p>
          {#if scheme === 'INCLUDE'}
            <p class="mt-1 flex items-center gap-2">
              <span class="inline-block h-0 w-5 border-t-2 border-dashed border-[#f59e0b]"></span> Rute kargo / ferry (0 pax)
            </p>
          {/if}
        </div>

        <!-- Tooltip -->
        {#if mapTip}
          <div
            class="pointer-events-none absolute z-20 w-60 rounded-xl border border-line bg-panel p-3 shadow-xl"
            style={`left: ${mapTipX}px; top: ${mapTipY}px;`}
          >
            {#if mapTip.kind === 'route'}
              {@const r = mapTip.route}
              <p class="text-[13px] font-extrabold text-ink">{r.oc} → {r.dc}</p>
              <span
                class={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10.5px] font-bold ${r.zp ? 'bg-[#f59e0b]/15 text-[#f59e0b]' : 'bg-[#38bdf8]/15 text-[#38bdf8]'}`}
              >
                {r.zp ? 'Kargo / Ferry (0 Pax)' : 'Komersial Reguler'}
              </span>
              <p class="mt-1.5 text-[11.5px] text-ink-3">{r.on} → {r.dn}</p>
              <div class="mt-2 space-y-1 text-[12px] text-ink-2">
                <p class="flex justify-between"><span>Jarak udara</span><b class="text-ink">{fmtInt(r.dist)} km</b></p>
                <p class="flex justify-between"><span>Penumpang</span><b class="text-ink">{fmtInt(r.pax)} pax</b></p>
                <p class="flex justify-between"><span>Frekuensi</span><b class="text-ink">{fmtInt(r.flt)} flights</b></p>
                <p class="flex justify-between"><span>Rasio kepadatan</span><b class="text-ink">{fmtDensity(r.pax, r.flt)} pax/flight</b></p>
                <p class="flex justify-between"><span>Muatan kargo</span><b class="text-ink">{fmtTon(r.crg)}</b></p>
              </div>
            {:else}
              {@const a = airportsByCode.get(mapTip.code)}
              {#if a}
                <p class="text-[13px] font-extrabold text-ink">{a.code} — {a.name}</p>
                <div class="mt-2 space-y-1 text-[12px] text-ink-2">
                  <p class="flex justify-between"><span>Total penumpang</span><b class="text-ink">{fmtInt(a.total_pax)} pax</b></p>
                  <p class="flex justify-between"><span>Total penerbangan</span><b class="text-ink">{fmtInt(a.total_flt)} flights</b></p>
                </div>
                <p class="mt-2 text-[11px] text-ink-3">Klik untuk mengisolasi jaring rute bandara ini.</p>
              {/if}
            {/if}
          </div>
        {/if}
      </div>
    </Card>

    <!-- Koridor terpadat + insight -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card class="p-4">
        <CardHeader
          title="Koridor Terpadat"
          subtitle="5 rute dengan penumpang terbanyak (dari data terfilter)"
        >
          {#snippet icon()}<RouteIcon size={16} />{/snippet}
        </CardHeader>
        <table class="mt-2 w-full text-left text-[12.5px]">
          <thead>
            <tr class="border-b border-line text-[11px] uppercase tracking-wider text-ink-3">
              <th class="py-2 pr-2 font-bold">#</th>
              <th class="py-2 pr-2 font-bold">Rute</th>
              <th class="py-2 pr-2 text-right font-bold">Penumpang</th>
              <th class="py-2 pr-2 text-right font-bold">Flights</th>
              <th class="py-2 text-right font-bold">Jarak</th>
            </tr>
          </thead>
          <tbody>
            {#each top5Routes as r, i}
              <tr class="border-b border-line last:border-0">
                <td class="py-2 pr-2 text-ink-3">{i + 1}</td>
                <td class="py-2 pr-2 font-bold text-ink">{r.oc} → {r.dc}</td>
                <td class="py-2 pr-2 text-right text-ink-2">{fmtInt(r.pax)}</td>
                <td class="py-2 pr-2 text-right text-ink-2">{fmtInt(r.flt)}</td>
                <td class="py-2 text-right text-ink-2">{fmtInt(r.dist)} km</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </Card>
      <Card class="p-4">
        <CardHeader title="Pola Hub-and-Spoke" subtitle="Dihitung dari data rute September 2026">
          {#snippet icon()}<Info size={16} />{/snippet}
        </CardHeader>
        <ul class="mt-2 list-disc space-y-2 pl-5 text-[12.5px] leading-relaxed text-ink-2">
          <li>
            Jaringan multi-hub: CGK super-hub nasional, SUB poros Jatim &amp; Nusra, DPS episentrum
            pariwisata, UPG gerbang timur. CGK terlibat dalam
            {networkStats.cgkShare.toLocaleString('id-ID', { maximumFractionDigits: 1 })}% penumpang jaringan
            penuh.
          </li>
          <li>
            EXCLUDE menyembunyikan {fmtInt(networkStats.zpRoutes)} rute 0-penumpang. Dari jumlah itu,
            hanya {fmtInt(networkStats.zpWithCargo)} membawa kargo — sisanya ferry / reposisi, bukan
            "kargo" murni.
          </li>
          <li>
            {networkStats.noArc.length} bandara perintis ({networkStats.noArc.join(', ')}) hanya dilayani
            rute 0-penumpang sehingga tidak punya busur di skema EXCLUDE.
          </li>
        </ul>
      </Card>
    </div>
  {:else}
    <!-- KPI strip Sankey (dihitung dari link terfilter) -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiCard
        label="Penumpang Terpantau"
        value={fmtInt(sankeyKpi.pax)}
        sub={sankeyView === 'hub' ? 'Koridor hub teratas' : 'Agregasi antar-pulau'}
        accent="#38bdf8"
      >
        {#snippet icon()}<Users size={16} />{/snippet}
      </KpiCard>
      <KpiCard
        label="Frekuensi Penerbangan"
        value={fmtInt(sankeyKpi.flt)}
        sub="penerbangan"
        accent="#34d399"
      >
        {#snippet icon()}<Plane size={16} />{/snippet}
      </KpiCard>
      <KpiCard
        label="Koridor Terpadat"
        value={sankeyKpi.best ? `${sankeyKpi.best.a} ⇄ ${sankeyKpi.best.b}` : '–'}
        sub={sankeyKpi.best ? `${fmtInt(sankeyKpi.best.v)} pax gabungan` : 'Tidak ada data'}
        accent="#f59e0b"
      >
        {#snippet icon()}<RouteIcon size={16} />{/snippet}
      </KpiCard>
      <KpiCard
        label="Rata-rata Kepadatan"
        value={`${sankeyKpi.density.toLocaleString('id-ID', { maximumFractionDigits: 2 })} pax/flight`}
        sub={`${fmtInt(sankeyKpi.corridors)} koridor tampil`}
        accent="#818cf8"
      >
        {#snippet icon()}<Network size={16} />{/snippet}
      </KpiCard>
    </div>

    <!-- Kontrol Sankey -->
    <Card class="p-4">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div class="flex flex-col gap-1.5">
          <span class="text-[11px] font-bold uppercase tracking-wider text-ink-3">Tampilan</span>
          <Segmented
            options={[
              { value: 'hub', label: 'Arus Hub Bandara' },
              { value: 'island', label: 'Arus Antar-Pulau' },
            ]}
            value={sankeyView}
            onChange={onSankeyViewChange}
            size="sm"
          />
        </div>
        {#if sankeyView === 'hub'}
          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-bold uppercase tracking-wider text-ink-3">Filter asal</span>
            <select
              value={originFilter}
              onchange={(e) => {
                originFilter = (e.target as HTMLSelectElement).value;
                resetSankeyHighlight();
              }}
              class="cursor-pointer rounded-xl border border-line bg-fill px-3 py-2 text-[13px] font-semibold text-ink outline-none focus:border-[#38bdf8]"
            >
              <option value="ALL">Semua titik asal</option>
              {#each originOptions as o}
                <option value={o.code}>{o.label}</option>
              {/each}
            </select>
          </label>
          <label class="flex min-w-52 flex-1 flex-col gap-1.5">
            <span class="text-[11px] font-bold uppercase tracking-wider text-ink-3">
              Min. pax: ≥ {fmtInt(sankeyThreshold)}
            </span>
            <input
              type="range"
              min={10000}
              max={60000}
              step={5000}
              value={sankeyThreshold}
              oninput={(e) => {
                sankeyThreshold = Number((e.target as HTMLInputElement).value);
                resetSankeyHighlight();
              }}
              class="w-full accent-[#38bdf8]"
            />
          </label>
        {/if}
        <button
          onclick={resetSankeyHighlight}
          class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-fill px-3 py-2 text-[13px] font-semibold text-ink hover:text-accent"
        >
          <RotateCcw size={14} /> Reset sorotan
        </button>
      </div>
    </Card>

    <!-- Diagram Sankey -->
    <Card class="overflow-hidden p-4">
      <CardHeader
        title={sankeyView === 'hub' ? 'Arus Hub Bandara' : 'Arus Antar-Pulau'}
        subtitle="Klik node untuk menyorot alirannya • arahkan kursor untuk detail"
      >
        {#snippet icon()}<Network size={16} />{/snippet}
      </CardHeader>
      <div
        class="relative mt-2 overflow-x-auto"
        role="img"
        aria-label="Diagram Sankey OD penerbangan domestik September 2026"
        bind:this={sankeyWrap}
        onmousemove={onSankeyMouseMove}
      >
        {#if sankeyGeom.linkGeoms.length === 0}
          <p class="py-16 text-center text-[13px] text-ink-3">
            Tidak ada data yang memenuhi kriteria filter.
          </p>
        {:else}
          <svg
            viewBox={`0 0 ${sankeyGeom.W} ${sankeyGeom.H}`}
            role="img"
            aria-label="Diagram Sankey OD penerbangan domestik September 2026"
            class="min-w-[760px] w-full"
            preserveAspectRatio="xMidYMid meet"
            onmouseleave={() => {
              hoverLinkKey = null;
              hoverNodeName = null;
              sankeyTip = null;
            }}
          >
            <defs>
              {#each sankeyGeom.linkGeoms as lg (lg.key)}
                <linearGradient id={`odg-${lg.key}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color={lg.sourceColor} />
                  <stop offset="100%" stop-color={lg.targetColor} />
                </linearGradient>
              {/each}
            </defs>
            <!-- Header kolom -->
            <text x={sankeyGeom.padX} y="20" font-size="11.5" font-weight="800" fill={ct.soft}>
              {sankeyView === 'hub' ? 'BANDARA ASAL (ORIGIN HUB)' : 'PULAU / WILAYAH ASAL'}
            </text>
            <text
              x={sankeyGeom.W - sankeyGeom.padX}
              y="20"
              font-size="11.5"
              font-weight="800"
              text-anchor="end"
              fill={ct.soft}
            >
              {sankeyView === 'hub' ? 'BANDARA TUJUAN (DESTINATION)' : 'PULAU / WILAYAH TUJUAN'}
            </text>
            <!-- Ribbon -->
            {#each sankeyGeom.linkGeoms as lg (lg.key)}
              <path
                d={lg.path}
                fill={`url(#odg-${lg.key})`}
                opacity={sankeyLinkOpacity(lg)}
                role="img"
                aria-label={`Aliran ${lg.source} ke ${lg.target}`}
                style="cursor: pointer;"
                onmouseenter={() => {
                  hoverLinkKey = lg.key;
                  sankeyTip = { kind: 'link', key: lg.key, x: 0, y: 0 };
                }}
                onmouseleave={() => {
                  hoverLinkKey = null;
                  sankeyTip = null;
                }}
              />
            {/each}
            <!-- Node -->
            {#each [...sankeyGeom.leftNodes, ...sankeyGeom.rightNodes] as node (`${node.side}:${node.name}`)}
              {@const x = node.side === 'left' ? sankeyGeom.padX : sankeyGeom.W - sankeyGeom.padX - sankeyGeom.nodeW}
              <g
                opacity={sankeyNodeOpacity(node.name)}
                style="cursor: pointer;"
                role="button"
                tabindex="0"
                aria-label={`Node ${node.name}`}
                onmouseenter={() => {
                  hoverNodeName = node.name;
                  sankeyTip = { kind: 'node', key: `${node.side}:${node.name}`, x: 0, y: 0 };
                }}
                onmouseleave={() => {
                  hoverNodeName = null;
                  sankeyTip = null;
                }}
                onclick={() => {
                  selectedNode = selectedNode === node.name ? null : node.name;
                }}
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectedNode = selectedNode === node.name ? null : node.name;
                  }
                }}
              >
                <rect
                  x={x}
                  y={node.y}
                  width={sankeyGeom.nodeW}
                  height={node.h}
                  rx="3"
                  fill={node.color}
                />
                {#if node.side === 'left'}
                  <text x={x - 8} y={node.y + node.h / 2 + 4} text-anchor="end" font-size="11.5" font-weight="600" fill={ct.fg}>
                    {node.name}
                  </text>
                  {#if node.h > 20}
                    <text x={x - 8} y={node.y + node.h / 2 + 17} text-anchor="end" font-size="10" fill={ct.soft}>
                      {(node.total / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}k pax
                    </text>
                  {/if}
                {:else}
                  <text x={x + sankeyGeom.nodeW + 8} y={node.y + node.h / 2 + 4} font-size="11.5" font-weight="600" fill={ct.fg}>
                    {node.name}
                  </text>
                  {#if node.h > 20}
                    <text x={x + sankeyGeom.nodeW + 8} y={node.y + node.h / 2 + 17} font-size="10" fill={ct.soft}>
                      {(node.total / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}k pax
                    </text>
                  {/if}
                {/if}
              </g>
            {/each}
          </svg>
        {/if}

        <!-- Tooltip Sankey -->
        {#if sankeyTip}
          {@const tip = sankeyTip}
          {@const lg = sankeyGeom.linkGeoms.find((g) => g.key === tip.key)}
          {@const nodeParts = tip.key.split(':')}
          {@const nodeSide = nodeParts[0]}
          {@const nodeName = nodeParts.slice(1).join(':')}
          {@const nodeGeom = [...sankeyGeom.leftNodes, ...sankeyGeom.rightNodes].find(
            (n) => n.name === nodeName && n.side === nodeSide,
          )}
          <div
            class="pointer-events-none absolute z-20 w-60 rounded-xl border border-line bg-panel p-3 shadow-xl"
            style={`left: ${tip.x}px; top: ${tip.y}px;`}
          >
            {#if tip.kind === 'link' && lg}
              <p class="text-[13px] font-extrabold text-ink">{lg.source} → {lg.target}</p>
              <div class="mt-2 space-y-1 text-[12px] text-ink-2">
                <p class="flex justify-between"><span>Penumpang</span><b class="text-ink">{fmtInt(lg.value)} pax</b></p>
                <p class="flex justify-between"><span>Penerbangan</span><b class="text-ink">{fmtInt(lg.flights)} flights</b></p>
                <p class="flex justify-between"><span>Kepadatan</span><b class="text-ink">{fmtDensity(lg.value, lg.flights)} pax/flight</b></p>
                <p class="flex justify-between"><span>Pangsa arus</span><b class="text-ink">{fmtShare(lg.value, sankeyGeom.total)}</b></p>
              </div>
            {:else if tip.kind === 'node' && nodeGeom}
              <p class="text-[13px] font-extrabold text-ink">{nodeGeom.name}</p>
              <p class="text-[11.5px] text-ink-3">{nodeSide === 'left' ? 'Titik asal' : 'Titik tujuan'}</p>
              <div class="mt-2 space-y-1 text-[12px] text-ink-2">
                <p class="flex justify-between"><span>Total volume</span><b class="text-ink">{fmtInt(nodeGeom.total)} pax</b></p>
                <p class="flex justify-between"><span>Pangsa arus</span><b class="text-ink">{fmtShare(nodeGeom.total, sankeyGeom.total)}</b></p>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </Card>

    <!-- Panel detail node terpilih -->
    {#if selectedDetail}
      <Card class="p-4">
        <CardHeader
          title={`Detail: ${selectedDetail.name}`}
          subtitle={`${fmtInt(selectedDetail.flows.length)} aliran • keluar ${fmtInt(selectedDetail.outPax)} pax (${fmtInt(selectedDetail.outFlt)} flights) • masuk ${fmtInt(selectedDetail.inPax)} pax (${fmtInt(selectedDetail.inFlt)} flights)`}
        >
          {#snippet icon()}<Info size={16} />{/snippet}
        </CardHeader>
        <div class="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-2">
          {#each selectedDetail.flows as f (`${f.source}|${f.target}`)}
            <p class="flex items-center justify-between gap-2 border-b border-line py-1.5 text-[12.5px] text-ink-2">
              <span class="font-semibold text-ink">{f.source} → {f.target}</span>
              <span>{fmtInt(f.value)} pax • {fmtInt(f.flights)} flights</span>
            </p>
          {/each}
        </div>
      </Card>
    {/if}

    <!-- Insight Sankey -->
    <Card class="p-4">
      <CardHeader
        title={sankeyView === 'hub' ? 'Segitiga Emas & Peran CGK' : 'Jembatan Udara Antar-Pulau'}
        subtitle="Dihitung dari data Sankey (tanpa filter)"
      >
        {#snippet icon()}<Info size={16} />{/snippet}
      </CardHeader>
      {#if sankeyView === 'hub'}
        <ul class="mt-2 list-disc space-y-2 pl-5 text-[12.5px] leading-relaxed text-ink-2">
          <li>
            Poros segitiga emas: Jakarta ⇄ Denpasar {fmtInt(sankeyInsight.hubPairs[0].v)} pax, Jakarta ⇄
            Surabaya {fmtInt(sankeyInsight.hubPairs[1].v)} pax, Jakarta ⇄ Medan
            {fmtInt(sankeyInsight.hubPairs[2].v)} pax.
          </li>
          <li>
            Di antara 59 koridor hub teratas, CGK terlibat dalam
            {sankeyInsight.hubCgkShare.toLocaleString('id-ID', { maximumFractionDigits: 1 })}% volume —
            pangsa ini berlaku untuk subset koridor teratas, bukan seluruh jaringan.
          </li>
        </ul>
      {:else}
        <ul class="mt-2 list-disc space-y-2 pl-5 text-[12.5px] leading-relaxed text-ink-2">
          <li>
            Koridor terpadat: Jawa ⇄ Sumatera {fmtInt(sankeyInsight.islandPairs[0].v)} pax, Jawa ⇄ Bali
            &amp; Nusra {fmtInt(sankeyInsight.islandPairs[1].v)} pax, Jawa ⇄ Kalimantan
            {fmtInt(sankeyInsight.islandPairs[2].v)} pax.
          </li>
          <li>Arus intra-Jawa mencapai {fmtInt(sankeyInsight.intraJawa)} pax.</li>
          <li>
            Agregasi ini mencakup 24 pasangan pulau yang tersedia di data — bukan seluruh jaringan
            penerbangan (sebagian pasangan pulau tidak tercakup).
          </li>
        </ul>
      {/if}
    </Card>
  {/if}
</div>
