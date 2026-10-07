# StrategiHub 2026 — Modern Rebuild

Rebuild modern dari [strategihub-kemenhub-2026](https://github.com/wildannazhif/strategihub-kemenhub-2026):
dasbor terpadu pemantauan mobilitas angkutan penumpang nasional lintas 5 moda
(Udara, KA, Bus AKAP, ASDP, Laut) berbasis data operasional StrategiHub PUSDATIN Kemenhub 2026.

Data **identik** dengan dashboard asli (diekstrak dari `index.html` asli ke `src/data/dashboard.json`).

## Teknologi

| Asli | Rebuild |
|---|---|
| Single-file HTML + Tailwind Play CDN | Vite + React 19 + TypeScript + Tailwind CSS v4 |
| Chart.js | Apache ECharts 5 (interaktif, animasi, dataZoom) |
| Leaflet 1.9 | MapLibre GL (GPU-accelerated, vector tiles) |
| KaTeX badges | Komponen formula rapi |
| 1 file 1,8 MB | Code-splitting per modul (lazy load) |

Fitur: dark/light mode, sidebar navigasi + hash routing (`#/timeline`, …),
grafik interaktif dengan zoom, peta 1.014 simpul dengan filter moda, proyeksi
Nataru 3 skenario + confidence interval.

## Menjalankan lokal

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build & deploy ke GitHub Pages

```bash
npm run build     # output di dist/, base path relatif ('./')
```

`dist/` siap di-push ke branch `gh-pages` (atau folder `docs/`) — path relatif
sehingga bekerja di `username.github.io/repo/` maupun domain kustom.

```bash
# contoh deploy via gh-pages branch
npx gh-pages -d dist
```

## Struktur

```
src/
  data/           dashboard.json (data asli) + types.ts
  lib/            format.ts (id-ID), moda.ts (palet & status)
  components/     AppShell, Chart (ECharts), ui, theme
  modules/        Overview, Timeline, Lebaran, ModalShare,
                  LoadFactor, Hubs, Metrics, SpatialMap, Forecast
```

## Modul

1. **Ringkasan** — hero KPI, area chart 272 hari, donat pangsa moda
2. **Kronologi Harian** — metrik/arah/moda bisa dipilih, pola mingguan, sorotan 38 provinsi
3. **Puncak Lebaran** — linimasa H-8…H+8, fase mudik/balik, lonjakan per moda
4. **Pangsa Pasar** — donat per bulan, tren 100% stacked, Jan vs Sep
5. **Load Factor** — gauge per moda, ambang kepadatan, sorotan ASDP
6. **Simpul Top 30** — tabel interaktif + rekomendasi kebutuhan armada
7. **Matriks 13 Indikator** — kartu + tabel formula
8. **Peta Spasial** — MapLibre, filter moda, search + flyTo
9. **Proyeksi Nataru** — forecast Holt-Winters 100 hari, 3 skenario, pita CI 95%
