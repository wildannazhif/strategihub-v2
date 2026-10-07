import { useEffect, useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Ship } from 'lucide-react';
import type { ApexOptions } from 'apexcharts';
import Chart, { MONO } from '../components/Chart';
import { Card, SectionHeader, Badge, Segmented, EmptyState } from '../components/ui';
import { useDark } from '../components/theme';
import { data, MODA_KEYS } from '../data';
import { MODA, densityStatus } from '../lib/moda';
import { fmtInt, fmtCompact, fmtPct } from '../lib/format';
import type { ModaKey, HubRow, SimpulRecommendation } from '../data/types';

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
  if (statusText.includes('Kritis')) return '#dc2626';
  if (statusText.includes('Tinggi')) return '#ea580c';
  if (statusText.includes('Waspada') || statusText.includes('Sedang')) return '#ca8a04';
  return '#16a34a';
}

/* ---------- Horizontal bar chart (top 10), click -> select hub ---------- */
function HubBarChart({
  names, values, color, unit, onSelect,
}: {
  names: string[]; values: number[]; color: string; unit: string;
  onSelect: (name: string) => void;
}) {
  const dark = useDark();
  const series = useMemo<ApexOptions['series']>(
    () => [{ name: unit === 'pnp' ? 'Penumpang' : 'Armada', data: values }],
    [values, unit],
  );
  const options = useMemo<ApexOptions>(
    () => ({
      chart: {
        events: {
          dataPointSelection: (_e: unknown, _c?: unknown, config?: { dataPointIndex: number }) => {
            const i = config?.dataPointIndex;
            if (typeof i === 'number' && names[i]) onSelect(names[i]);
          },
        },
      },
      colors: [color],
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          barHeight: '60%',
          dataLabels: { position: 'top' },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (v: number) => fmtCompact(v),
        offsetX: 10,
        style: { fontFamily: MONO, fontSize: '11px', colors: [dark ? '#cbd5e1' : '#475569'] },
      },
      xaxis: { categories: names },
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
        y: { formatter: (v: number) => `${fmtInt(v)} ${unit}` },
      },
    }),
    [names, color, unit, onSelect, dark],
  );

  return <Chart type="bar" series={series} options={options} height={320} />;
}

/* ================= HubsView ================= */
export default function HubsView() {
  const [moda, setModa] = useState<ModaKey>('UDARA');
  const [periode, setPeriode] = useState<Periode>('peak');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('pnp');
  const [arah, setArah] = useState<Arah>('total');
  const [selectedHub, setSelectedHub] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const base = (periode === 'peak' ? data.top_hubs_peak : data.top_hubs_ytd)[moda];

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const f = q
      ? base.filter(
          (r) =>
            r.nama_prasarana.toLowerCase().includes(q) || r.provinsi.toLowerCase().includes(q),
        )
      : base;
    return [...f].sort((a, b) => metricOf(b, sortBy, arah) - metricOf(a, sortBy, arah));
  }, [base, search, sortBy, arah]);

  useEffect(() => {
    setPage(0);
  }, [moda, periode, search, sortBy, arah]);

  const medianPnp = useMemo(() => {
    const v = base.map((r) => r.pnp).sort((a, b) => a - b);
    return v[Math.floor(v.length / 2)] || 1;
  }, [base]);

  const recByModa = useMemo(
    () => data.simpul_recommendations.filter((r) => r.moda === moda),
    [moda],
  );

  const recIndex = useMemo(() => {
    const m = new Map<string, SimpulRecommendation>();
    for (const r of recByModa) {
      const k = norm(r.name);
      if (!m.has(k)) m.set(k, r);
    }
    return m;
  }, [recByModa]);

  const findRec = (nama: string): SimpulRecommendation | undefined => {
    const exact = recIndex.get(norm(nama));
    if (exact) return exact;
    const n = norm(nama);
    return recByModa.find((r) => n.includes(norm(r.name)) || norm(r.name).includes(n));
  };

  const surgeOf = (r: HubRow): number => {
    const rec = findRec(r.nama_prasarana);
    if (rec && rec.pnpBiasa > 0) return (rec.pnpPuncak / rec.pnpBiasa - 1) * 100;
    return (r.pnp / medianPnp - 1) * 100;
  };

  const handleSelect = (name: string) => {
    setSelectedHub(name);
    const idx = rows.findIndex((r) => r.nama_prasarana === name);
    if (idx >= 0) setPage(Math.floor(idx / PAGE));
  };

  const chartRows = rows.slice(0, 10);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = rows.slice(safePage * PAGE, safePage * PAGE + PAGE);

  const selRec = selectedHub ? findRec(selectedHub) : undefined;
  const topRecs = useMemo(() => {
    const sorted = [...recByModa].sort(
      (a, b) => Number(b.addArm) - Number(a.addArm),
    );
    if (selRec) {
      const rest = sorted.filter((r) => r.id !== selRec.id);
      return [selRec, ...rest].slice(0, 5);
    }
    return sorted.slice(0, 5);
  }, [recByModa, selRec]);

  const unit = sortBy === 'pnp' ? 'pnp' : 'trip';

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="Registri Simpul"
        title="Registri Simpul Top 30"
        desc="30 simpul tersibuk per moda — periode Puncak Lebaran vs akumulasi YTD 2026. Klik bar grafik atau baris tabel untuk melihat rekomendasi armada."
      />

      {/* Controls */}
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap gap-2">
          {MODA_KEYS.map((m) => {
            const active = moda === m;
            return (
              <button
                key={m}
                onClick={() => setModa(m)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[13px] font-bold transition-all ${
                  active
                    ? 'border-transparent text-white shadow-md'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
                style={active ? { background: MODA[m].color } : undefined}
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: active ? '#fff' : MODA[m].color }}
                />
                {MODA[m].short}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented<Periode>
            value={periode}
            onChange={setPeriode}
            options={[
              { value: 'peak', label: 'Puncak Lebaran' },
              { value: 'ytd', label: 'YTD 2026' },
            ]}
          />
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari simpul atau provinsi…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-kemenhub-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <Segmented<SortBy>
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'pnp', label: 'Penumpang' },
              { value: 'arm', label: 'Armada' },
            ]}
          />
          <Segmented<Arah>
            value={arah}
            onChange={setArah}
            options={[
              { value: 'total', label: 'Total' },
              { value: 'dat', label: 'Datang' },
              { value: 'brg', label: 'Berangkat' },
            ]}
          />
        </div>
      </Card>

      {/* Chart + recommendations */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <SectionHeader
            eyebrow={MODA[moda].label}
            title={`Top 10 Simpul — ${periode === 'peak' ? 'Puncak Lebaran' : 'YTD 2026'}`}
            desc={`Urut ${sortBy === 'pnp' ? 'penumpang' : 'armada'} • arah ${ARAH_LABEL[arah].toLowerCase()} — klik bar untuk memilih simpul`}
          />
          {chartRows.length > 0 ? (
            <HubBarChart
              names={chartRows.map((r) => r.nama_prasarana)}
              values={chartRows.map((r) => metricOf(r, sortBy, arah))}
              color={MODA[moda].color}
              unit={unit}
              onSelect={handleSelect}
            />
          ) : (
            <EmptyState title="Tidak ada data" desc="Ubah kata kunci pencarian." />
          )}
        </Card>

        <Card className="flex flex-col p-5">
          <SectionHeader
            eyebrow="Kebutuhan Operasi"
            title="Rekomendasi Armada"
            desc={`${MODA[moda].label} • kebutuhan tambahan per simpul`}
          />
          {selectedHub ? (
            <p className="mb-3 rounded-xl bg-sky-50 px-3 py-2 text-[12.5px] text-sky-800 dark:bg-sky-950/50 dark:text-sky-200">
              Simpul terpilih: <b>{selectedHub}</b>
            </p>
          ) : (
            <p className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-[12.5px] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              Klik bar grafik atau baris tabel untuk memfokuskan satu simpul.
            </p>
          )}
          <ul className="flex-1 space-y-3 overflow-y-auto pr-0.5">
            {topRecs.map((r, i) => (
              <li
                key={r.id}
                className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100">
                      <span className="num mr-1.5 text-slate-400">#{i + 1}</span>
                      {r.name}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-slate-500 dark:text-slate-400">
                      {r.prov} • {r.saranaType} ({r.saranaUnit})
                    </p>
                  </div>
                  <Badge color={recColor(r.statusText)}>{r.statusText}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-rose-50 py-2 dark:bg-rose-950/30">
                    <p className="num text-[16px] font-extrabold text-rose-600 dark:text-rose-400">
                      +{fmtInt(Number(r.addArm))}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      unit tambahan
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 py-2 dark:bg-slate-800/60">
                    <p className="num text-[16px] font-extrabold text-slate-700 dark:text-slate-200">
                      {fmtCompact(r.pnpPuncak)}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      pnp puncak
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 py-2 dark:bg-slate-800/60">
                    <p className="num text-[16px] font-extrabold text-slate-700 dark:text-slate-200">
                      {fmtInt(Number(r.totalArm))}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      total armada
                    </p>
                  </div>
                </div>
                <p className="mt-2.5 text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {String(r.fieldAction ?? '')}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Table */}
      <Card className="p-5">
        <SectionHeader
          eyebrow="Peringkat"
          title={`Peringkat 1–30 • ${MODA[moda].label}`}
          desc={`${rows.length} simpul • urut ${sortBy === 'pnp' ? 'penumpang' : 'armada'} ${ARAH_LABEL[arah].toLowerCase()} • P/A = penumpang per trip armada`}
        />
        {rows.length > 0 ? (
          <>
            <div className="max-h-[540px] overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full min-w-[780px] text-left text-[13px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    {['#', 'Simpul', 'Provinsi', `Penumpang (${ARAH_LABEL[arah]})`, `Armada (${ARAH_LABEL[arah]})`, 'P/A', 'Status'].map(
                      (h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r, i) => {
                    const rank = safePage * PAGE + i + 1;
                    const pnp = metricOf(r, 'pnp', arah);
                    const arm = metricOf(r, 'arm', arah);
                    const lf = arm > 0 ? pnp / arm : 0;
                    const surge = surgeOf(r);
                    const st = densityStatus(surge);
                    const sel = selectedHub === r.nama_prasarana;
                    return (
                      <tr
                        key={r.nama_prasarana}
                        onClick={() => handleSelect(r.nama_prasarana)}
                        className={`cursor-pointer border-t border-slate-100 transition-colors dark:border-slate-800/60 ${
                          sel
                            ? 'bg-sky-50 dark:bg-sky-950/40'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        } ${i % 2 === 1 && !sel ? 'bg-slate-50/60 dark:bg-slate-800/20' : ''}`}
                      >
                        <td className="num px-4 py-3 font-extrabold text-slate-400">
                          <span
                            className="inline-grid size-7 place-items-center rounded-lg text-[12px]"
                            style={
                              rank <= 3
                                ? { background: MODA[moda].colorSoft, color: MODA[moda].color }
                                : undefined
                            }
                          >
                            {rank}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                          {r.nama_prasarana}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{r.provinsi}</td>
                        <td className="num px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                          {fmtInt(pnp)}
                        </td>
                        <td className="num px-4 py-3 text-slate-500 dark:text-slate-400">
                          {fmtInt(arm)}
                        </td>
                        <td className="num px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                          {lf.toLocaleString('id-ID', { maximumFractionDigits: 1 })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Badge color={st.color}>{st.label}</Badge>
                            <span className="num text-[11px] text-slate-400">{fmtPct(surge)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                Menampilkan{' '}
                <b className="num">
                  {safePage * PAGE + 1}–{Math.min(safePage * PAGE + PAGE, rows.length)}
                </b>{' '}
                dari <b className="num">{rows.length}</b> simpul
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="num text-[12.5px] font-bold text-slate-600 dark:text-slate-300">
                  {safePage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage >= totalPages - 1}
                  className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState title="Tidak ada simpul cocok" desc="Ubah kata kunci pencarian atau filter." />
        )}
      </Card>

      <Card className="flex items-start gap-3 p-5">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl"
          style={{ background: MODA[moda].colorSoft, color: MODA[moda].color }}
        >
          <Ship size={18} />
        </span>
        <div>
          <p className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100">
            Cara membaca status kepadatan
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
            Lonjakan dihitung dari rasio penumpang puncak vs hari biasa pada data rekomendasi
            simpul (pnpPuncak ÷ pnpBiasa). Jika simpul tidak tercakup, dipakai perbandingan
            terhadap median 30 simpul moda ini. Ambang: ≥80% sangat kritis, ≥50% padat tinggi,
            ≥25% sibuk terkendali, di bawahnya stabil.
          </p>
        </div>
      </Card>
    </div>
  );
}
