import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Search, X, Crosshair, MapPin } from 'lucide-react';
import { Card, SectionHeader, Segmented } from '../components/ui';
import { useDark } from '../components/theme';
import { data, MODA_KEYS } from '../data';
import { MODA } from '../lib/moda';
import { fmtCompact, fmtInt } from '../lib/format';
import type { ModaKey, SpatialNode } from '../data/types';

const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
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
    `<span style="color:#64748b">${l}</span><b style="font-family:'JetBrains Mono',monospace;color:#0f172a">${v}</b></div>`;
  return (
    `<div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;min-width:210px">` +
    `<div style="font-weight:800;font-size:13.5px;color:#0f172a;line-height:1.3">${p.nama}</div>` +
    `<div style="font-size:11.5px;color:#64748b;margin:2px 0 8px">${p.tipe} &bull; ${p.prov}</div>` +
    `<span style="display:inline-block;background:${moda.color}1a;color:${moda.color};` +
    `font-size:11px;font-weight:700;border-radius:999px;padding:3px 10px;margin-bottom:8px">${moda.label}</span>` +
    row('Penumpang', fmtInt(p.pnp)) +
    row('Armada', `${fmtInt(p.arm)} trip`) +
    row('Rasio P/A', pa > 0 ? pa.toLocaleString('id-ID', { maximumFractionDigits: 1 }) : '–') +
    `</div>`
  );
}

export default function SpatialMapView() {
  const dark = useDark();
  const nodes = data.spatial_nodes;

  const mapped = useMemo(() => nodes.filter((n) => n.has_coords), [nodes]);
  const unmappedCount = nodes.length - mapped.length;
  const countByModa = useMemo(() => {
    const c: Record<ModaKey, number> = { UDARA: 0, KA: 0, BUS: 0, ASDP: 0, LAUT: 0 };
    for (const n of mapped) c[n.m] += 1;
    return c;
  }, [mapped]);

  const geojson = useMemo(() => {
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
  }, [mapped]);

  const [activeModas, setActiveModas] = useState<ModaKey[]>([...MODA_KEYS]);
  const [metric, setMetric] = useState<MetricKey>('pnp');
  const [query, setQuery] = useState('');
  const [showSug, setShowSug] = useState(false);

  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const darkRef = useRef(dark);
  darkRef.current = dark;
  const activeRef = useRef(activeModas);
  activeRef.current = activeModas;
  const metricRef = useRef(metric);
  metricRef.current = metric;
  const geoRef = useRef(geojson);
  geoRef.current = geojson;

  const applyView = () => {
    const map = mapRef.current;
    if (!map || !map.getLayer('nodes')) return;
    const f = activeRef.current;
    map.setFilter(
      'nodes',
      f.length === MODA_KEYS.length
        ? null
        : (['in', ['get', 'moda'], ['literal', [...f]]] as maplibregl.FilterSpecification),
    );
    map.setPaintProperty('nodes', 'circle-radius', [
      'get',
      metricRef.current === 'pnp' ? 'r_pnp' : 'r_arm',
    ]);
  };

  const openPopup = (lng: number, lat: number, p: NodeProps) => {
    const map = mapRef.current;
    if (!map) return;
    popupRef.current?.remove();
    popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: '300px' })
      .setLngLat([lng, lat])
      .setHTML(popupHtml(p))
      .addTo(map);
  };

  /* Init map sekali */
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;
    const map = new maplibregl.Map({
      container: el,
      style: darkRef.current ? DARK_STYLE : LIGHT_STYLE,
      center: HOME,
      zoom: HOME_ZOOM,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right');

    const ensureLayers = () => {
      if (map.getSource('nodes')) return;
      map.addSource('nodes', { type: 'geojson', data: geoRef.current });
      map.addLayer({
        id: 'nodes',
        type: 'circle',
        source: 'nodes',
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': ['get', metricRef.current === 'pnp' ? 'r_pnp' : 'r_arm'],
          'circle-opacity': 0.75,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff',
        },
      });
      applyView();
    };

    map.on('load', ensureLayers);
    map.on('styledata', ensureLayers);
    map.on('click', 'nodes', (e) => {
      const feat = e.features?.[0];
      if (!feat || !feat.properties) return;
      openPopup(e.lngLat.lng, e.lngLat.lat, feat.properties as unknown as NodeProps);
    });
    map.on('mouseenter', 'nodes', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'nodes', () => {
      map.getCanvas().style.cursor = '';
    });

    mapRef.current = map;
    requestAnimationFrame(() => map.resize());
    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Ganti basemap saat tema berubah */
  useEffect(() => {
    mapRef.current?.setStyle(dark ? DARK_STYLE : LIGHT_STYLE);
  }, [dark]);

  /* Terapkan filter & metrik */
  useEffect(() => {
    applyView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModas, metric]);

  const toggleModa = (m: ModaKey) =>
    setActiveModas((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const resetView = () =>
    mapRef.current?.flyTo({ center: HOME, zoom: HOME_ZOOM, duration: 1200 });

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return mapped.filter((n) => n.nama.toLowerCase().includes(q)).slice(0, 8);
  }, [query, mapped]);

  const pickNode = (n: SpatialNode) => {
    setQuery(n.nama);
    setShowSug(false);
    const map = mapRef.current;
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
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="Spasial"
        title="Peta Spasial Simpul"
        desc="Sebaran 1.208 simpul transportasi lima moda di seluruh Indonesia. Klik lingkaran untuk detail simpul."
        action={
          <button
            onClick={resetView}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Crosshair size={15} />
            Pusatkan Indonesia
          </button>
        }
      />

      <Card className="space-y-4 p-4 sm:p-5">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Filter moda
          </p>
          <div className="flex flex-wrap gap-2">
            {MODA_KEYS.map((m) => {
              const active = activeModas.includes(m);
              return (
                <button
                  key={m}
                  onClick={() => toggleModa(m)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition ${
                    active
                      ? 'shadow-sm'
                      : 'border-slate-200 text-slate-400 opacity-60 hover:opacity-100 dark:border-slate-700 dark:text-slate-500'
                  }`}
                  style={
                    active
                      ? {
                          background: `${MODA[m].color}1a`,
                          color: MODA[m].color,
                          borderColor: `${MODA[m].color}66`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: MODA[m].color }}
                  />
                  {MODA[m].short}
                  <span className="num text-[11px] opacity-70">{fmtCompact(countByModa[m])}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Ukuran lingkaran
            </p>
            <Segmented<MetricKey>
              options={[
                { value: 'pnp', label: 'Penumpang' },
                { value: 'arm', label: 'Armada' },
              ]}
              value={metric}
              onChange={setMetric}
            />
          </div>
          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Cari simpul
            </p>
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSug(true);
                }}
                onFocus={() => setShowSug(true)}
                placeholder="cth: Soekarno Hatta, Gambir…"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-9 text-[13px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-kemenhub-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Hapus pencarian"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {showSug && suggestions.length > 0 && (
              <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {suggestions.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => pickNode(n)}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: MODA[n.m].color }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                        {n.nama}
                      </span>
                      <span className="block truncate text-[11px] text-slate-400">
                        {n.tipe} &bull; {n.p}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 shadow-[var(--shadow-card)] dark:border-slate-800">
        <div ref={containerRef} className="h-[560px] w-full" />

        <div className="absolute left-3 top-3 z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/92 px-3 py-1.5 text-[11.5px] font-bold text-slate-700 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/92 dark:text-slate-200">
            <MapPin size={13} className="text-kemenhub-600 dark:text-kemenhub-300" />
            <span className="num">{fmtInt(mapped.length)} terpetakan</span>
            <span className="text-slate-300 dark:text-slate-600">&bull;</span>
            <span className="num font-semibold text-slate-400">{fmtInt(unmappedCount)} tanpa koordinat</span>
          </div>
        </div>

        <div className="absolute bottom-9 left-3 z-10">
          <div className="rounded-xl border border-slate-200 bg-white/92 p-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/92">
            <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Legenda moda
            </p>
            <div className="space-y-1.5">
              {MODA_KEYS.map((m) => (
                <div key={m} className="flex items-center gap-2 text-[12px]">
                  <span className="size-2.5 rounded-full" style={{ background: MODA[m].color }} />
                  <span className="font-semibold text-slate-600 dark:text-slate-300">{MODA[m].short}</span>
                  <span className="num ml-auto pl-4 text-[11px] text-slate-400">
                    {fmtInt(countByModa[m])}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 border-t border-slate-100 pt-2 text-[10.5px] text-slate-400 dark:border-slate-800">
              Ukuran lingkaran &prop; {metric === 'pnp' ? 'penumpang' : 'armada'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
