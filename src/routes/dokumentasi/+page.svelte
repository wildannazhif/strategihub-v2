<script lang="ts">
  import { onMount } from 'svelte';
  import BookOpen from 'lucide-svelte/icons/book-open';
  import Landmark from 'lucide-svelte/icons/landmark';
  import Ship from 'lucide-svelte/icons/ship';
  import Plane from 'lucide-svelte/icons/plane';
  import TrainFront from 'lucide-svelte/icons/train-front';
  import Bus from 'lucide-svelte/icons/bus';
  import ExternalLink from 'lucide-svelte/icons/external-link';

  const CHIPS = [
    '1. Integritas Data',
    '2. Metrik Dasar',
    '3. Load Factor',
    '4. Modal Share',
    '5. Arus Lebaran',
    '6. Tren Provinsi',
    '7. Rekomendasi Armada',
    '8. Model Nataru',
    '9. Tabel Simpul',
  ];

  onMount(async () => {
    const [{ default: renderMathInElement }] = await Promise.all([
      import('katex/contrib/auto-render'),
      import('katex/dist/katex.min.css'),
    ]);
    const el = document.getElementById('dok-artikel');
    if (el) {
      renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
        ],
        throwOnError: false,
      });
    }
  });
</script>

<svelte:head>
  <title>Tentang Data & Rumus — StrategiHub</title>

  <style>
    html { scroll-behavior: smooth; }
  </style>
</svelte:head>

<div class="space-y-4">
  <!-- Header Banner -->
  <div class="rounded-xl border border-white/[0.07] bg-[#0a101d] p-5 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div class="mb-2 flex items-center gap-2">
          <span class="rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-300">
            Dokumentasi Resmi Metodologi
          </span>
          <span class="text-xs text-ink-3">• Pusdatin Kemenhub 2026</span>
        </div>
        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-ink">
          Informasi Sistem, Metodologi Analisis & Kamus Rumus
        </h2>
        <p class="mt-1 max-w-3xl text-xs sm:text-sm leading-relaxed text-ink-2">
          Kamus lengkap formulasi matematis, definisi notasi variabel, standar rekayasa transportasi (TCQSM & TRB), serta protokol integritas data operasional StrategiHub Multimoda 2026.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <BookOpen size={18} class="text-sky-400" />
        <span class="rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs text-sky-300">
          100% Notasi Matematis Terverifikasi
        </span>
      </div>
    </div>
  </div>

  <!-- Sticky Quick Jump Nav -->
  <nav class="sticky top-16 z-20 rounded-xl border border-white/[0.07] bg-[#04060c]/90 backdrop-blur-xl px-4 py-2.5">
    <div class="flex flex-wrap items-center gap-2 text-xs">
      <span class="mr-1 text-[11px] font-bold uppercase tracking-wider text-sky-300">Lompat Cepat:</span>
      {#each CHIPS as chip, i (chip)}
        <a
          href={`#rumus-sec-${i + 1}`}
          class="rounded-md bg-white/[0.06] px-2.5 py-1 text-ink-2 transition-colors hover:bg-white/[0.12] hover:text-ink"
        >
          {chip}
        </a>
      {/each}
    </div>
  </nav>

  <div id="dok-artikel" class="space-y-4">
    <!-- Section 1: Sumber Data & Integritas Dataset -->
    <section id="rumus-sec-1" class="scroll-mt-32 space-y-4 rounded-xl border border-white/[0.07] bg-[#0a101d] p-5 sm:p-6">
      <div class="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div class="flex items-center gap-2.5">
          <span class="h-3 w-3 rounded-full bg-indigo-500"></span>
          <h3 class="text-sm font-bold uppercase tracking-tight text-ink">
            1. Sumber Data & Integritas Dataset Operasional
          </h3>
        </div>
        <span class="rounded bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
          SIASATI PUSDATIN
        </span>
      </div>

      <p class="text-[13px] leading-relaxed text-ink-2">
        Seluruh data operasional di dalam dashboard bersumber dari transaksi log harian <strong>StrategiHub PUSDATIN Kementerian Perhubungan 2026</strong> (<code class="rounded border border-white/[0.08] bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-indigo-300">strategihub_multimoda_2026.csv</code>, 18,3 MB).
      </p>

      <div class="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3.5">
          <div class="text-[10px] font-bold uppercase tracking-wider text-ink-3">Total Baris Tervalidasi</div>
          <div class="num mt-1 text-lg font-black text-ink">209.964 Baris</div>
          <div class="mt-0.5 text-[11px] text-ink-3">Dibersihkan dari 211.361 log mentah</div>
        </div>
        <div class="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3.5">
          <div class="text-[10px] font-bold uppercase tracking-wider text-ink-3">Rentang Pengamatan</div>
          <div class="num mt-1 text-lg font-black text-ink">272 Hari</div>
          <div class="mt-0.5 text-[11px] text-ink-3">1 Jan s.d. 29 Sep 2026</div>
        </div>
        <div class="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3.5">
          <div class="text-[10px] font-bold uppercase tracking-wider text-ink-3">Cakupan Prasarana</div>
          <div class="num mt-1 text-lg font-black text-ink">1.208 Simpul</div>
          <div class="mt-0.5 text-[11px] text-ink-3">1.014 koordinat valid, 194 perintis</div>
        </div>
        <div class="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3.5">
          <div class="text-[10px] font-bold uppercase tracking-wider text-ink-3">Cakupan Moda</div>
          <div class="num mt-1 text-lg font-black text-ink">5 Moda Transportasi</div>
          <div class="mt-0.5 text-[11px] text-ink-3">Udara, KA, Bus, ASDP, Laut</div>
        </div>
      </div>
    </section>

    <!-- Section 2: Rumus Metrik Dasar -->
    <section id="rumus-sec-2" class="scroll-mt-32 space-y-4 rounded-xl border border-white/[0.07] bg-[#0a101d] p-5 sm:p-6">
      <div class="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div class="flex items-center gap-2.5">
          <span class="h-3 w-3 rounded-full bg-sky-400"></span>
          <h3 class="text-sm font-bold uppercase tracking-tight text-ink">
            2. Rumus Metrik Dasar (Total Penumpang & Armada Beroperasi)
          </h3>
        </div>
        <span class="rounded bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold text-sky-300">
          Agregasi Dua Arah
        </span>
      </div>

      <p class="text-[13px] text-ink-2">
        Setiap transaksi simpul prasarana mencatat pergerakan dua arah secara simultan, yaitu kedatangan (<em>arrival</em>) dan keberangkatan (<em>departure</em>).
      </p>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
          <div class="text-[11px] font-bold text-ink-2">A. Total Penumpang Simpul / Harian:</div>
          <div class="rounded border border-white/[0.06] bg-white/[0.03] py-2 text-center text-sm font-semibold text-sky-300">
            $$P_&#123;\text&#123;total&#125;&#125; = P_&#123;\text&#123;datang&#125;&#125; + P_&#123;\text&#123;berangkat&#125;&#125;$$
          </div>
        </div>
        <div class="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
          <div class="text-[11px] font-bold text-ink-2">B. Total Pergerakan Armada:</div>
          <div class="rounded border border-white/[0.06] bg-white/[0.03] py-2 text-center text-sm font-semibold text-sky-300">
            $$A_&#123;\text&#123;total&#125;&#125; = A_&#123;\text&#123;datang&#125;&#125; + A_&#123;\text&#123;berangkat&#125;&#125;$$
          </div>
        </div>
      </div>

      <div class="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
        <div class="text-[11px] font-bold text-ink-2">C. Rata-rata Penumpang Harian Nasional:</div>
        <div class="rounded border border-white/[0.06] bg-white/[0.03] py-2 text-center text-sm font-semibold text-sky-300">
          $$P_&#123;\text&#123;avg&#125;&#125; = \frac&#123;\sum_&#123;t=1&#125;^&#123;N&#125; P_&#123;\text&#123;total&#125;, t&#125;&#125;&#123;N&#125; = \frac&#123;371.890.120&#125;&#123;272&#125; = 1.367.243\text&#123; pnp/hari&#125;$$
        </div>
      </div>

      <div class="overflow-x-auto rounded-lg border border-white/[0.06]">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="bg-white/[0.04]">
              <th class="w-28 p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Simbol</th>
              <th class="w-44 p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Nama Notasi</th>
              <th class="w-32 p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Satuan</th>
              <th class="p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Penjelasan Makna Operasional Lapangan</th>
            </tr>
          </thead>
          <tbody class="text-[11px]">
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-sky-300">$$P_&#123;\text&#123;total&#125;&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Total Penumpang</td>
              <td class="p-2.5 text-ink-3">orang</td>
              <td class="p-2.5 text-ink-2">Jumlah seluruh pergerakan manusia di simpul prasarana (kedatangan + keberangkatan).</td>
            </tr>
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-sky-300">$$P_&#123;\text&#123;datang&#125;&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Penumpang Datang</td>
              <td class="p-2.5 text-ink-3">orang</td>
              <td class="p-2.5 text-ink-2">Jumlah penumpang yang tiba atau turun dari sarana transportasi di simpul tujuan.</td>
            </tr>
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-sky-300">$$P_&#123;\text&#123;berangkat&#125;&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Penumpang Berangkat</td>
              <td class="p-2.5 text-ink-3">orang</td>
              <td class="p-2.5 text-ink-2">Jumlah penumpang yang naik atau bertolak meninggalkan simpul awal (alasan antrean).</td>
            </tr>
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-sky-300">$$A_&#123;\text&#123;total&#125;&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Total Armada</td>
              <td class="p-2.5 text-ink-3">trip / flight / KA</td>
              <td class="p-2.5 text-ink-2">Total frekuensi pergerakan sarana transportasi yang beroperasi melayani mobilitas.</td>
            </tr>
            <tr>
              <td class="p-2.5 font-bold text-sky-300">$$N$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Periode Hari</td>
              <td class="p-2.5 text-ink-3">hari</td>
              <td class="p-2.5 text-ink-2">Jumlah hari kalender operasional pengamatan tahun 2026 (272 hari kontinu).</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Section 3: Rumus Load Factor Proxy -->
    <section id="rumus-sec-3" class="scroll-mt-32 space-y-4 rounded-xl border border-white/[0.07] bg-[#0a101d] p-5 sm:p-6">
      <div class="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div class="flex items-center gap-2.5">
          <span class="h-3 w-3 rounded-full bg-indigo-500"></span>
          <h3 class="text-sm font-bold uppercase tracking-tight text-ink">
            3. Rumus Rasio Okupansi Armada (Load Factor Proxy P/A)
          </h3>
        </div>
        <span class="rounded bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
          Kepadatan per Armada
        </span>
      </div>

      <p class="text-[13px] text-ink-2">
        <em>Load Factor Proxy</em> mengukur intensitas okupansi fisik rata-rata per satu satuan pergerakan armada sarana transportasi.
      </p>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
          <div class="text-[11px] font-bold text-ink-2">A. Rasio Beban Okupansi Armada (LF):</div>
          <div class="rounded border border-white/[0.06] bg-white/[0.03] py-2 text-center text-sm font-semibold text-indigo-300">
            $$LF = \frac&#123;P_&#123;\text&#123;total&#125;&#125;&#125;&#123;A_&#123;\text&#123;total&#125;&#125;&#125;$$
          </div>
        </div>
        <div class="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
          <div class="text-[11px] font-bold text-ink-2">B. Pertumbuhan Beban Okupansi (ΔLF):</div>
          <div class="rounded border border-white/[0.06] bg-white/[0.03] py-2 text-center text-sm font-semibold text-rose-300">
            $$\Delta LF = \left( \frac&#123;LF_&#123;\text&#123;puncak&#125;&#125; - LF_&#123;\text&#123;baseline&#125;&#125;&#125;&#123;LF_&#123;\text&#123;baseline&#125;&#125;&#125; \right) \times 100\%$$
          </div>
        </div>
      </div>

      <div class="overflow-x-auto rounded-lg border border-white/[0.06]">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="bg-white/[0.04]">
              <th class="w-28 p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Simbol</th>
              <th class="w-44 p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Nama Notasi</th>
              <th class="w-32 p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Satuan</th>
              <th class="p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Penjelasan Makna Operasional Lapangan</th>
            </tr>
          </thead>
          <tbody class="text-[11px]">
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-indigo-300">$$LF$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Load Factor Proxy</td>
              <td class="p-2.5 text-ink-3">pnp / armada</td>
              <td class="p-2.5 text-ink-2">Rata-rata penumpang yang dimuat per satu perjalanan armada (flight, trip bus, trip KA, kapal).</td>
            </tr>
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-indigo-300">$$LF_&#123;\text&#123;puncak&#125;&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">LF Periode Puncak</td>
              <td class="p-2.5 text-ink-3">pnp / armada</td>
              <td class="p-2.5 text-ink-2">Kepadatan muatan pada hari puncak ekstrem (H-3 Mudik atau H+3 Balik).</td>
            </tr>
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-indigo-300">$$LF_&#123;\text&#123;baseline&#125;&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">LF Kondisi Normal</td>
              <td class="p-2.5 text-ink-3">pnp / armada</td>
              <td class="p-2.5 text-ink-2">Kepadatan muatan pada hari kerja normal reguler tanpa pengaruh libur panjang.</td>
            </tr>
            <tr>
              <td class="p-2.5 font-bold text-rose-300">$$\Delta LF$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Persentase Lonjakan LF</td>
              <td class="p-2.5 text-ink-3">%</td>
              <td class="p-2.5 text-ink-2">Tingkat kelipatan desak per armada di lapangan dibanding hari biasa.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Section 4: Rumus Pangsa Pasar Antar-Moda -->
    <section id="rumus-sec-4" class="scroll-mt-32 space-y-4 rounded-xl border border-white/[0.07] bg-[#0a101d] p-5 sm:p-6">
      <div class="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div class="flex items-center gap-2.5">
          <span class="h-3 w-3 rounded-full bg-emerald-400"></span>
          <h3 class="text-sm font-bold uppercase tracking-tight text-ink">
            4. Rumus Pangsa Pasar Antar-Moda (Modal Share %)
          </h3>
        </div>
        <span class="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
          Proporsi Multimoda
        </span>
      </div>

      <div class="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
        <div class="text-[11px] font-bold text-ink-2">Pangsa Pasar Moda Transportasi m:</div>
        <div class="rounded border border-white/[0.06] bg-white/[0.03] py-2 text-center text-sm font-semibold text-emerald-300">
          $$\text&#123;MS&#125;_&#123;m&#125; = \left( \frac&#123;P_&#123;m&#125;&#125;&#123;\sum_&#123;k \in M&#125; P_&#123;k&#125;&#125; \right) \times 100\%$$
        </div>
        <div class="text-center text-[11px] text-ink-3">
          Di mana: $$\sum_&#123;k \in M&#125; P_&#123;k&#125; = P_&#123;\text&#123;Udara&#125;&#125; + P_&#123;\text&#123;KA&#125;&#125; + P_&#123;\text&#123;Bus&#125;&#125; + P_&#123;\text&#123;ASDP&#125;&#125; + P_&#123;\text&#123;Laut&#125;&#125;$$
        </div>
      </div>

      <div class="overflow-x-auto rounded-lg border border-white/[0.06]">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="bg-white/[0.04]">
              <th class="w-28 p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Simbol</th>
              <th class="w-44 p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Nama Notasi</th>
              <th class="w-32 p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Satuan</th>
              <th class="p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Penjelasan Makna Operasional Lapangan</th>
            </tr>
          </thead>
          <tbody class="text-[11px]">
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-emerald-300">$$\text&#123;MS&#125;_&#123;m&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Modal Share Moda m</td>
              <td class="p-2.5 text-ink-3">%</td>
              <td class="p-2.5 text-ink-2">Porsi kontribusi moda $m$ terhadap mobilitas nasional (contoh: Udara 32,0%, ASDP 23,4%).</td>
            </tr>
            <tr>
              <td class="p-2.5 font-bold text-emerald-300">$$P_&#123;m&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Volume Penumpang Moda m</td>
              <td class="p-2.5 text-ink-3">orang</td>
              <td class="p-2.5 text-ink-2">Total penumpang yang memilih dan terangkut pada moda transportasi spesifik $m$.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Section 5: Rumus Periode Lebaran & Surge -->
    <section id="rumus-sec-5" class="scroll-mt-32 space-y-4 rounded-xl border border-white/[0.07] bg-[#0a101d] p-5 sm:p-6">
      <div class="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div class="flex items-center gap-2.5">
          <span class="h-3 w-3 rounded-full bg-rose-400"></span>
          <h3 class="text-sm font-bold uppercase tracking-tight text-ink">
            5. Rumus Analisis Puncak Lebaran & Lonjakan (Surge %)
          </h3>
        </div>
        <span class="rounded bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300">
          Baseline Median Robust
        </span>
      </div>

      <p class="text-[13px] text-ink-2">
        Posko Nasional Angkutan Lebaran 2026 berlangsung 17 Hari (13 s.d. 29 Maret 2026) dengan Hari H tunggal pada 21 Maret 2026.
      </p>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
          <div class="text-[11px] font-bold text-ink-2">A. Baseline Median Normal:</div>
          <div class="rounded border border-white/[0.06] bg-white/[0.03] py-2 text-center text-sm font-semibold text-indigo-300">
            $$P_&#123;\text&#123;median&#125;&#125; = \text&#123;Median&#125;(P_1, P_2, \dots, P_&#123;272&#125;) = 1.321.644\text&#123; pnp/h&#125;$$
          </div>
        </div>
        <div class="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
          <div class="text-[11px] font-bold text-ink-2">B. Persentase Lonjakan (Surge %):</div>
          <div class="rounded border border-white/[0.06] bg-white/[0.03] py-2 text-center text-sm font-semibold text-rose-300">
            $$\text&#123;Surge&#125; = \left( \frac&#123;P_&#123;\text&#123;puncak&#125;&#125; - P_&#123;\text&#123;median&#125;&#125;&#125;&#123;P_&#123;\text&#123;median&#125;&#125;&#125; \right) \times 100\%$$
          </div>
        </div>
      </div>

      <div class="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
        <div class="text-[11px] font-bold text-ink-2">C. Penomoran Hari Relatif Posko Lebaran:</div>
        <div class="rounded border border-white/[0.06] bg-white/[0.03] py-2 text-center text-sm font-semibold text-ink">
          $$\Delta \text&#123;Hari&#125; = \text&#123;Tanggal Kalender&#125; - 21\text&#123; Maret &#125; 2026$$
        </div>
        <div class="text-center text-[11px] text-ink-3">
          Jika $\Delta &lt; 0 \rightarrow \mathbf&#123;H-|\Delta|&#125;$ (Mudik) • Jika $\Delta = 0 \rightarrow \mathbf&#123;Hari\ H&#125;$ • Jika $\Delta > 0 \rightarrow \mathbf&#123;H+|\Delta|&#125;$ (Balik)
        </div>
      </div>

      <div class="overflow-x-auto rounded-lg border border-white/[0.06]">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="bg-white/[0.04]">
              <th class="w-28 p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Simbol</th>
              <th class="w-44 p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Nama Notasi</th>
              <th class="w-32 p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Satuan</th>
              <th class="p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Penjelasan Makna Operasional Lapangan</th>
            </tr>
          </thead>
          <tbody class="text-[11px]">
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-indigo-300">$$P_&#123;\text&#123;median&#125;&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Baseline Median</td>
              <td class="p-2.5 text-ink-3">orang / hari</td>
              <td class="p-2.5 text-ink-2">Nilai tengah mobilitas 272 hari, bebas dari distorsi lonjakan ekstrem (Google Mobility standard).</td>
            </tr>
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-rose-300">$$P_&#123;\text&#123;puncak&#125;&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Volume Hari Puncak</td>
              <td class="p-2.5 text-ink-3">orang / hari</td>
              <td class="p-2.5 text-ink-2">Realisasi tertinggi penumpang (contoh: 24 Maret 2026 = 2.415.296 orang).</td>
            </tr>
            <tr>
              <td class="p-2.5 font-bold text-rose-300">$$\text&#123;Surge&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Persentase Lonjakan</td>
              <td class="p-2.5 text-ink-3">%</td>
              <td class="p-2.5 text-ink-2">Persentase kelipatan pergerakan di atas kapasitas hari biasa (contoh: +103,2% di arus balik).</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Section 6: Rumus Analisis Tren & Lonjakan Bulanan per Provinsi -->
    <section id="rumus-sec-6" class="scroll-mt-32 space-y-4 rounded-xl border border-white/[0.07] bg-[#0a101d] p-5 sm:p-6">
      <div class="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div class="flex items-center gap-2.5">
          <span class="h-3 w-3 rounded-full bg-blue-500"></span>
          <h3 class="text-sm font-bold uppercase tracking-tight text-ink">
            6. Rumus Analisis Tren & Lonjakan Bulanan per Provinsi (38 Provinsi)
          </h3>
        </div>
        <span class="rounded bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-300">
          Tab 1 • Wilayah & MoM
        </span>
      </div>

      <p class="text-[13px] leading-relaxed text-ink-2">
        Menghitung dinamika pertumbuhan bulanan, mengidentifikasi bulan puncak mobilitas regional, serta menentukan moda transportasi dominan di masing-masing 38 provinsi di Indonesia (aktif di panel kanan Tab 1).
      </p>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
          <div class="text-[11px] font-bold text-ink-2">A. Laju Pertumbuhan Bulanan (Month-over-Month / MoM %):</div>
          <div class="rounded border border-white/[0.06] bg-white/[0.03] py-2 text-center text-sm font-semibold text-blue-300">
            $$\text&#123;MoM&#125;_&#123;\text&#123;prov&#125;, t&#125; = \left( \frac&#123;P_&#123;\text&#123;prov&#125;, t&#125; - P_&#123;\text&#123;prov&#125;, t-1&#125;&#125;&#123;P_&#123;\text&#123;prov&#125;, t-1&#125;&#125; \right) \times 100\%$$
          </div>
        </div>
        <div class="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
          <div class="text-[11px] font-bold text-ink-2">B. Pangsa Moda Dominan Provinsi (%):</div>
          <div class="rounded border border-white/[0.06] bg-white/[0.03] py-2 text-center text-sm font-semibold text-blue-300">
            $$\text&#123;Share&#125;_&#123;m, \text&#123;prov&#125;&#125; = \left( \frac&#123;P_&#123;m, \text&#123;prov&#125;&#125;&#125;&#123;P_&#123;\text&#123;total&#125;, \text&#123;prov&#125;&#125;&#125; \right) \times 100\%$$
          </div>
        </div>
      </div>

      <div class="overflow-x-auto rounded-lg border border-white/[0.06]">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="bg-white/[0.04]">
              <th class="w-32 p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Simbol</th>
              <th class="w-44 p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Nama Notasi</th>
              <th class="w-32 p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Satuan</th>
              <th class="p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Penjelasan Makna Operasional Lapangan</th>
            </tr>
          </thead>
          <tbody class="text-[11px]">
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-blue-300">$$\text&#123;MoM&#125;_&#123;\text&#123;prov&#125;, t&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Pertumbuhan MoM</td>
              <td class="p-2.5 text-ink-3">%</td>
              <td class="p-2.5 text-ink-2">Laju akselerasi keberangkatan penumpang provinsi pada bulan $t$ dibanding bulan sebelumnya $(t-1)$.</td>
            </tr>
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-blue-300">$$P_&#123;\text&#123;prov&#125;, t&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Volume Penumpang Provinsi</td>
              <td class="p-2.5 text-ink-3">orang / bulan</td>
              <td class="p-2.5 text-ink-2">Total keberangkatan seluruh simpul prasarana dalam batas teritorial provinsi pada bulan $t$.</td>
            </tr>
            <tr>
              <td class="p-2.5 font-bold text-blue-300">$$\text&#123;Share&#125;_&#123;m, \text&#123;prov&#125;&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Pangsa Moda Dominan</td>
              <td class="p-2.5 text-ink-3">%</td>
              <td class="p-2.5 text-ink-2">Porsi moda utama di provinsi tersebut (contoh: Jatim dominan KA/Bus, Bali dominan Udara, Kepri dominan Laut).</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Section 7: Standar Penambahan Armada (Persentil Load Factor) -->
    <section id="rumus-sec-7" class="scroll-mt-32 space-y-4 rounded-xl border border-white/[0.07] bg-[#0a101d] p-5 sm:p-6">
      <div class="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div class="flex items-center gap-2.5">
          <span class="h-3 w-3 rounded-full bg-rose-400"></span>
          <h3 class="text-sm font-bold uppercase tracking-tight text-ink">
            7. Standar Penentuan Penambahan Armada Simpul (Persentil Lonjakan Load Factor TCQSM TRB)
          </h3>
        </div>
        <span class="rounded bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300">
          Standar TCQSM & TRB
        </span>
      </div>

      <p class="text-[13px] leading-relaxed text-ink-2">
        Sesuai standar internasional <em>Transit Capacity and Quality of Service Manual (TCQSM, TCRP Report 165)</em> dan <em>Ceder (2015)</em>, kebutuhan armada tambahan dihitung dari rasio lonjakan kepadatan per armada (Load Factor Puncak terhadap Load Factor Biasa) dengan ambang persentil empiris $P_&#123;50&#125;, P_&#123;75&#125;, P_&#123;90&#125;$ dari 1.010 simpul nasional.
      </p>

      <div class="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
        <div class="text-[11px] font-bold text-ink-2">A. Rasio Lonjakan Beban Armada Simpul:</div>
        <div class="rounded border border-white/[0.06] bg-white/[0.03] py-2 text-center text-sm font-semibold text-indigo-300">
          $$\text&#123;Rasio Lonjakan LF&#125; = \frac&#123;LF_&#123;\text&#123;puncak&#125;&#125;&#125;&#123;LF_&#123;\text&#123;biasa&#125;&#125;&#125; = \frac&#123;P_&#123;\text&#123;puncak&#125;&#125; / A_&#123;\text&#123;puncak&#125;&#125;&#125;&#123;P_&#123;\text&#123;biasa&#125;&#125; / A_&#123;\text&#123;biasa&#125;&#125;&#125;$$
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
          <div class="text-[11px] font-bold text-ink-2">B. Tambahan Unit Armada Perbantuan:</div>
          <div class="rounded border border-white/[0.06] bg-white/[0.03] py-2 text-center text-sm font-semibold text-indigo-300">
            $$A_&#123;\text&#123;tambah&#125;&#125; = \left\lceil A_&#123;\text&#123;puncak&#125;&#125; \times \left( \frac&#123;\%\text&#123; Tambah&#125;&#125;&#123;100&#125; \right) \right\rceil$$
          </div>
        </div>
        <div class="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
          <div class="text-[11px] font-bold text-ink-2">C. Total Armada Beroperasi Puncak:</div>
          <div class="rounded border border-white/[0.06] bg-white/[0.03] py-2 text-center text-sm font-semibold text-emerald-300">
            $$A_&#123;\text&#123;total&#125;&#125; = A_&#123;\text&#123;puncak&#125;&#125; + A_&#123;\text&#123;tambah&#125;&#125;$$
          </div>
        </div>
      </div>

      <div class="overflow-x-auto rounded-lg border border-white/[0.06]">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="bg-white/[0.04]">
              <th class="p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Klasifikasi Status</th>
              <th class="p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Kriteria Persentil Empiris</th>
              <th class="p-2.5 text-center text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Rekomendasi Tambah</th>
              <th class="p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Jumlah Simpul</th>
              <th class="p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Contoh Simpul Riil Lapangan</th>
            </tr>
          </thead>
          <tbody class="text-[11px]">
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-rose-400"><span class="mr-1.5 inline-block h-2 w-2 rounded-full bg-rose-500"></span>Sangat Kritis</td>
              <td class="p-2.5 text-ink-2">$$\text&#123;Rasio&#125; \ge P_&#123;90&#125; = 3&#123;,&#125;43\times$$ (Top 10%)</td>
              <td class="p-2.5 text-center font-bold text-indigo-300">+20%</td>
              <td class="p-2.5 font-bold text-ink">87 Simpul</td>
              <td class="p-2.5 text-ink-2">Bakauheni (4,3x), Gilimanuk (4,2x), Merak (3,8x), Giwangan (3,6x)</td>
            </tr>
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-orange-400"><span class="mr-1.5 inline-block h-2 w-2 rounded-full bg-orange-500"></span>Tinggi / Kritis</td>
              <td class="p-2.5 text-ink-2">$$P_&#123;75&#125; \le \text&#123;Rasio&#125; &lt; P_&#123;90&#125;$$ ($$2&#123;,&#125;33\times - 3&#123;,&#125;42\times$$)</td>
              <td class="p-2.5 text-center font-bold text-indigo-300">+15%</td>
              <td class="p-2.5 font-bold text-ink">122 Simpul</td>
              <td class="p-2.5 text-ink-2">Pasar Senen (2,8x), Ketapang (2,6x), Poto Tano (2,5x)</td>
            </tr>
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-amber-300"><span class="mr-1.5 inline-block h-2 w-2 rounded-full bg-amber-400"></span>Padat</td>
              <td class="p-2.5 text-ink-2">$$P_&#123;50&#125; \le \text&#123;Rasio&#125; &lt; P_&#123;75&#125;$$ ($$1&#123;,&#125;54\times - 2&#123;,&#125;32\times$$)</td>
              <td class="p-2.5 text-center font-bold text-indigo-300">+10%</td>
              <td class="p-2.5 font-bold text-ink">211 Simpul</td>
              <td class="p-2.5 text-ink-2">Juanda (1,9x), Gambir (1,8x), DPS Bali (1,6x), Soetta (1,5x)</td>
            </tr>
            <tr>
              <td class="p-2.5 font-bold text-emerald-400"><span class="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500"></span>Terkendali</td>
              <td class="p-2.5 text-ink-2">$$\text&#123;Rasio&#125; &lt; P_&#123;50&#125; = 1&#123;,&#125;54\times$$ (atau $$P &lt; 100$$)</td>
              <td class="p-2.5 text-center font-bold text-indigo-300">+5%</td>
              <td class="p-2.5 font-bold text-ink">590 Simpul</td>
              <td class="p-2.5 text-ink-2">Simpul perintis lokal & rute reguler dengan armada memadai</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="space-y-3 pt-2">
        <!-- Box A: Regulasi Resmi Kemenhub RI -->
        <div class="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4 text-xs">
          <div class="flex items-center gap-2 font-bold text-ink">
            <span class="h-2 w-2 rounded-full bg-blue-500"></span>
            <Landmark size={14} class="text-blue-400" />
            <span>Landasan Regulasi Resmi Kemenhub RI untuk Aksi Lapangan:</span>
          </div>
          <div class="space-y-1.5 text-[11px] leading-relaxed text-ink-2">
            <div>• <strong>Pola TBB & Buffer Zone Pelabuhan ASDP:</strong> Didasarkan pada <em>Surat Keputusan Bersama (SKB) Tiga Menteri</em> (Kementerian Perhubungan, Korlantas Polri, dan Kementerian PUPR) tentang Pengaturan Lalu Lintas Jalan serta Penyeberangan Masa Angkutan Lebaran & Nataru, yang menetapkan skema Tiba Bongkar Berangkat (TBB) tanpa muat di Bakauheni/Merak, pengalihan pelabuhan Ciwandan/BBJ, dan delaying system di rest area Tol Tangerang–Merak KM 43/68.</div>
            <div>• <strong>Extra Flight & Slot Runway Bandara:</strong> Berpedoman pada <em>Surat Edaran Direktur Jenderal Perhubungan Udara</em> tentang Pengendalian Pengoperasian Pesawat Udara pada Periode Hari Raya, yang mengatur dispensasi slot terbang tambahan (extra flight / red-eye flight malam) serta jam operasi bandara 24 jam penuh.</div>
            <div>• <strong>Kereta Luar Biasa (KLB) & Stamformasi KA:</strong> Berdasarkan <em>Instruksi Direktur Jenderal Perkeretaapian</em> tentang Penyelenggaraan Posko Angkutan Kereta Api Terpadu, yang mengatur pengoperasian rangkaian KLB Tambahan dan maksimasi formasi rangkaian 10–12 gerbong per perjalanan.</div>
            <div>• <strong>Armada Bus Bantuan & Ramp Check:</strong> Mengacu pada <em>Surat Edaran Direktur Jenderal Perhubungan Darat</em> mengenai Kesiapan Angkutan Jalan, yang mewajibkan inspeksi keselamatan jalan (Ramp Check) dan penyiagaan armada bus pariwisata cadangan sebagai angkutan perbantuan di terminal tipe A.</div>
          </div>
        </div>

        <!-- Box B: Rujukan Jurnal Ilmiah -->
        <div class="space-y-2.5 rounded-lg border border-indigo-500/25 bg-indigo-500/[0.06] p-4 text-xs">
          <div class="flex items-center justify-between font-bold text-indigo-200">
            <span class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-indigo-400"></span>
              <BookOpen size={14} class="text-indigo-300" />
              <span>Rujukan Jurnal Ilmiah Peer-Reviewed & Manual Standar Rekayasa Transportasi:</span>
            </span>
            <span class="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-200">Klik tautan untuk membaca</span>
          </div>

          <div class="grid grid-cols-1 gap-2.5 text-[11px] md:grid-cols-2">
            <div class="space-y-1 rounded border border-white/[0.06] bg-[#0a101d] p-2.5">
              <div class="flex items-center justify-between font-bold text-ink">
                <span class="flex items-center gap-1.5"><Ship size={13} class="text-sky-400" /> Penyeberangan ASDP (TBB & Buffer)</span>
                <a href="https://garuda.kemdiktisaintek.go.id/journal/view/41858" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1 text-[10px] font-semibold text-indigo-300 hover:underline">Buka Jurnal <ExternalLink size={11} /></a>
              </div>
              <div class="text-ink-2">
                <strong>Jurnal Penelitian Transportasi Darat</strong> (Badan Litbang Perhubungan, SINTA 2 / Garuda Kemdiktisaintek).
              </div>
              <div class="text-[10px] text-ink-3">
                Evaluasi pola operasi dan kapasitas angkutan penyeberangan lintas Merak–Bakauheni pada periode puncak. Kajian internasional pendukung: <a href="https://doi.org/10.1057/s41278-020-00155-2" target="_blank" rel="noopener noreferrer" class="text-indigo-300 hover:underline">Maritime Economics & Logistics (Springer, 2020)</a> mengenai mitigasi antrean pelabuhan ferry Ro-Ro.
              </div>
            </div>

            <div class="space-y-1 rounded border border-white/[0.06] bg-[#0a101d] p-2.5">
              <div class="flex items-center justify-between font-bold text-ink">
                <span class="flex items-center gap-1.5"><Plane size={13} class="text-sky-400" /> Penerbangan Udara (Slot & Extra Flight)</span>
                <a href="https://doi.org/10.1016/j.jairtraman.2025.102751" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1 text-[10px] font-semibold text-indigo-300 hover:underline">Buka Jurnal <ExternalLink size={11} /></a>
              </div>
              <div class="text-ink-2">
                <strong>Journal of Air Transport Management</strong> (Elsevier / ScienceDirect, 2025).
              </div>
              <div class="text-[10px] text-ink-3">
                <em>A novel slot optimization model for congested airports integrating IATA guidelines</em> (Zeng et al., 2025). Mengkaji manajemen slot bandara padat dan izin extra flight. Rujukan standar: <a href="https://www.iata.org/en/policy/slots/wasg/" target="_blank" rel="noopener noreferrer" class="text-indigo-300 hover:underline">IATA Worldwide Airport Slot Guidelines (WASG)</a>.
              </div>
            </div>

            <div class="space-y-1 rounded border border-white/[0.06] bg-[#0a101d] p-2.5">
              <div class="flex items-center justify-between font-bold text-ink">
                <span class="flex items-center gap-1.5"><TrainFront size={13} class="text-amber-300" /> Kereta Api (KLB & Stamformasi)</span>
                <a href="https://doi.org/10.1016/j.cie.2025.111166" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1 text-[10px] font-semibold text-indigo-300 hover:underline">Buka Jurnal <ExternalLink size={11} /></a>
              </div>
              <div class="text-ink-2">
                <strong>Computers & Industrial Engineering</strong> (Elsevier / ScienceDirect, 2025).
              </div>
              <div class="text-[10px] text-ink-3">
                <em>Integrated optimization of line planning and additional trains scheduling during demand surges</em> (2025). Kajian pendukung: <a href="https://doi.org/10.1016/j.jrtpm.2024.100450" target="_blank" rel="noopener noreferrer" class="text-indigo-300 hover:underline">Journal of Rail Transport Planning & Management (Elsevier)</a> tentang optimasi stamformasi gerbong.
              </div>
            </div>

            <div class="space-y-1 rounded border border-white/[0.06] bg-[#0a101d] p-2.5">
              <div class="flex items-center justify-between font-bold text-ink">
                <span class="flex items-center gap-1.5"><Bus size={13} class="text-emerald-300" /> Bus & Optimasi Armada Transit</span>
                <a href="https://www.nationalacademies.org/publications/24766" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1 text-[10px] font-semibold text-indigo-300 hover:underline">Buka Manual TRB <ExternalLink size={11} /></a>
              </div>
              <div class="text-ink-2">
                <strong>TRB TCQSM (TCRP Report 165)</strong> & <strong>Ceder (CRC Press, 2015)</strong>.
              </div>
              <div class="text-[10px] text-ink-3">
                <em>Transit Capacity and Quality of Service Manual</em> Part 2 & Part 7 (Terminal Circulation & Reserve Bus Deployment). Landasan optimasi armada puncak: <a href="https://doi.org/10.1016/j.transa.2017.09.006" target="_blank" rel="noopener noreferrer" class="text-indigo-300 hover:underline">Transportation Research Part A (Jara-Díaz et al., 2017)</a>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 8: Model Prediksi Time Series Holt-Winters Nataru -->
    <section id="rumus-sec-8" class="scroll-mt-32 space-y-4 rounded-xl border border-white/[0.07] bg-[#0a101d] p-5 sm:p-6">
      <div class="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div class="flex items-center gap-2.5">
          <span class="h-3 w-3 rounded-full bg-purple-400"></span>
          <h3 class="text-sm font-bold uppercase tracking-tight text-ink">
            8. Rumus 1 Model Holt-Winters Terpadu (Damped Trend & Calendar Shocks)
          </h3>
        </div>
        <span class="rounded bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold text-purple-300">
          Horizon 100 Hari Nataru
        </span>
      </div>

      <div class="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
        <div class="text-[11px] font-bold text-ink-2">Formulasi Model Prediksi Time Series:</div>
        <div class="rounded border border-white/[0.06] bg-white/[0.03] py-2.5 text-center text-sm font-semibold text-indigo-300">
          $$\hat&#123;y&#125;_&#123;t+h&#125; = \left( \ell_t + \sum_&#123;i=1&#125;^&#123;h&#125; \phi^i b_t \right) \times s_&#123;t+h-m(k+1)&#125; \times \prod W_&#123;\text&#123;shock&#125;&#125;$$
        </div>
        <div class="rounded border border-white/[0.06] bg-white/[0.03] py-1.5 text-center text-xs text-ink-2">
          $$\text&#123;CI&#125;_&#123;95\%&#125; = \hat&#123;y&#125;_&#123;t+h&#125; \pm 1&#123;,&#125;96 \times \text&#123;RMSE&#125;$$
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
        <div class="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] p-3.5">
          <div class="text-[10px] font-bold uppercase text-emerald-300">MAPE (Akurasi Tinggi)</div>
          <div class="num mt-1 text-xl font-black text-emerald-400">4,10%</div>
          <div class="mt-0.5 text-[10px] text-ink-3">$$\frac&#123;100\%&#125;&#123;n&#125; \sum \left|\frac&#123;y-\hat&#123;y&#125;&#125;&#123;y&#125;\right|$$</div>
        </div>
        <div class="rounded-lg border border-sky-500/25 bg-sky-500/[0.06] p-3.5">
          <div class="text-[10px] font-bold uppercase text-sky-300">WAPE Tertimbang</div>
          <div class="num mt-1 text-xl font-black text-sky-400">4,02%</div>
          <div class="mt-0.5 text-[10px] text-ink-3">$$\frac&#123;\sum |y-\hat&#123;y&#125;|&#125;&#123;\sum y&#125; \times 100\%$$</div>
        </div>
        <div class="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3.5">
          <div class="text-[10px] font-bold uppercase text-ink-3">RMSE</div>
          <div class="num mt-1 text-xl font-black text-ink">62.051</div>
          <div class="mt-0.5 text-[10px] text-ink-3">$$\sqrt&#123;\frac&#123;1&#125;&#123;n&#125; \sum (y-\hat&#123;y&#125;)^2&#125;$$</div>
        </div>
        <div class="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3.5">
          <div class="text-[10px] font-bold uppercase text-ink-3">MAE</div>
          <div class="num mt-1 text-xl font-black text-ink">49.146</div>
          <div class="mt-0.5 text-[10px] text-ink-3">$$\frac&#123;1&#125;&#123;n&#125; \sum |y-\hat&#123;y&#125;|$$</div>
        </div>
      </div>

      <div class="overflow-x-auto rounded-lg border border-white/[0.06]">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="bg-white/[0.04]">
              <th class="w-28 p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Simbol</th>
              <th class="w-44 p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Nama Notasi</th>
              <th class="w-32 p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Satuan</th>
              <th class="p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Penjelasan Makna Operasional Lapangan</th>
            </tr>
          </thead>
          <tbody class="text-[11px]">
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-indigo-300">$$\hat&#123;y&#125;_&#123;t+h&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Proyeksi Penumpang</td>
              <td class="p-2.5 text-ink-3">orang / hari</td>
              <td class="p-2.5 text-ink-2">Nilai perkiraan volume mobilitas multimoda pada horizon $h$ hari ke depan (30 Sep '26 s.d. 7 Jan '27).</td>
            </tr>
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-indigo-300">$$\ell_t$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Tingkat Level Dasar</td>
              <td class="p-2.5 text-ink-3">orang</td>
              <td class="p-2.5 text-ink-2">Estimasi tingkat pergerakan dasar pada waktu cutoff terkini setelah memperhitungkan data latih 635 hari.</td>
            </tr>
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-indigo-300">$$b_t$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Komponen Tren</td>
              <td class="p-2.5 text-ink-3">orang / hari</td>
              <td class="p-2.5 text-ink-2">Kemiringan laju pertumbuhan riil (+5,13% YoY dari tahun 2025 ke 2026).</td>
            </tr>
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-indigo-300">$$\phi$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Peredam Tren (Damping)</td>
              <td class="p-2.5 text-ink-3">konstanta (0,98)</td>
              <td class="p-2.5 text-ink-2">Parameter peredam agar model tidak over-ekstrapolasi tanpa batas pada proyeksi horizon 100 hari.</td>
            </tr>
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-indigo-300">$$s_&#123;t&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Faktor Musiman Mingguan</td>
              <td class="p-2.5 text-ink-3">multiplikatif</td>
              <td class="p-2.5 text-ink-2">Pola ritme 7 hari yang secara konsisten menangkap puncak akhir pekan (Jumat-Minggu vs Selasa).</td>
            </tr>
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-purple-300">$$W_&#123;\text&#123;shock&#125;&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Shock Kalender Libur</td>
              <td class="p-2.5 text-ink-3">elastisitas</td>
              <td class="p-2.5 text-ink-2">Faktor pengali lonjakan cuti bersama Nataru yang dikalibrasi dari realisasi shock Nataru 2025.</td>
            </tr>
            <tr>
              <td class="p-2.5 font-bold text-ink-2">$$\text&#123;CI&#125;_&#123;95\%&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Interval Keyakinan 95%</td>
              <td class="p-2.5 text-ink-3">rentang penumpang</td>
              <td class="p-2.5 text-ink-2">Batas atas dan batas bawah probabilitas 95% untuk penyusunan skenario terburuk (<em>worst-case scenario</em>).</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Section 9: Formula Perhitungan Kolom Tabel Rekomendasi Armada -->
    <section id="rumus-sec-9" class="scroll-mt-32 space-y-4 rounded-xl border border-white/[0.07] bg-[#0a101d] p-5 sm:p-6">
      <div class="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div class="flex items-center gap-2.5">
          <span class="h-3 w-3 rounded-full bg-emerald-400"></span>
          <h3 class="text-sm font-bold uppercase tracking-tight text-ink">
            9. Formula Perhitungan Kolom Tabel Rekomendasi Armada (1.010 Simpul Nasional)
          </h3>
        </div>
        <span class="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
          Tab 8 • Registry Simpul
        </span>
      </div>

      <p class="text-[13px] leading-relaxed text-ink-2">
        Menjabarkan formulasi matematis eksak dari setiap kolom angka yang ditampilkan pada <strong>Tabel Rekomendasi Kebutuhan Penambahan Armada 1.010 Simpul Nasional</strong> dan kartu ringkasan eksekutif (Tab 8).
      </p>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
          <div class="text-[11px] font-bold text-ink-2">A. Beban Okupansi Normal & Puncak (Kolom Normal & Puncak):</div>
          <div class="rounded border border-white/[0.06] bg-white/[0.03] py-2 text-center text-xs font-semibold text-indigo-300">
            $$LF_&#123;\text&#123;biasa&#125;&#125; = \frac&#123;P_&#123;\text&#123;biasa&#125;&#125;&#125;&#123;A_&#123;\text&#123;biasa&#125;&#125;&#125;, \quad LF_&#123;\text&#123;puncak&#125;&#125; = \frac&#123;P_&#123;\text&#123;puncak&#125;&#125;&#125;&#123;A_&#123;\text&#123;puncak&#125;&#125;&#125;$$
          </div>
        </div>
        <div class="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
          <div class="text-[11px] font-bold text-ink-2">B. Lonjakan Beban Okupansi (Kolom "Lonjakan Beban"):</div>
          <div class="rounded border border-white/[0.06] bg-white/[0.03] py-2 text-center text-xs font-semibold text-indigo-300">
            $$\text&#123;Load Ratio&#125; = \frac&#123;LF_&#123;\text&#123;puncak&#125;&#125;&#125;&#123;LF_&#123;\text&#123;biasa&#125;&#125;&#125;$$
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
          <div class="text-[11px] font-bold text-ink-2">C. Tambahan Unit Armada Fisik (Kolom "Tambahan Unit"):</div>
          <div class="rounded border border-white/[0.06] bg-white/[0.03] py-2 text-center text-xs font-semibold text-emerald-300">
            $$A_&#123;\text&#123;tambah&#125;&#125; = \left\lceil A_&#123;\text&#123;puncak&#125;&#125; \times \left( \frac&#123;\%\text&#123; Tambah&#125;&#125;&#123;100&#125; \right) \right\rceil$$
          </div>
        </div>
        <div class="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
          <div class="text-[11px] font-bold text-ink-2">D. Total Armada Beroperasi Harian (Kolom "Total Operasi"):</div>
          <div class="rounded border border-white/[0.06] bg-white/[0.03] py-2 text-center text-xs font-semibold text-emerald-300">
            $$A_&#123;\text&#123;total&#125;&#125; = A_&#123;\text&#123;puncak&#125;&#125; + A_&#123;\text&#123;tambah&#125;&#125;$$
          </div>
        </div>
      </div>

      <div class="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
        <div class="text-[11px] font-bold text-ink-2">E. Persentase Tambahan Armada Rata-rata Terpilih (Kartu Rangkuman Atas):</div>
        <div class="rounded border border-white/[0.06] bg-white/[0.03] py-2 text-center text-xs font-semibold text-ink">
          $$\%\text&#123; Tambah Rata-rata Terpilih&#125; = \left( \frac&#123;\sum A_&#123;\text&#123;tambah&#125;&#125;&#125;&#123;\sum A_&#123;\text&#123;puncak&#125;&#125;&#125; \right) \times 100\%$$
        </div>
      </div>

      <div class="overflow-x-auto rounded-lg border border-white/[0.06]">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="bg-white/[0.04]">
              <th class="w-32 p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Simbol</th>
              <th class="w-44 p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Nama Kolom / Variabel</th>
              <th class="w-32 p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Satuan</th>
              <th class="p-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Penjelasan Makna Operasional Lapangan</th>
            </tr>
          </thead>
          <tbody class="text-[11px]">
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-indigo-300">$$A_&#123;\text&#123;tambah&#125;&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Tambahan Unit</td>
              <td class="p-2.5 text-ink-3">unit sarana / hari</td>
              <td class="p-2.5 text-ink-2">Jumlah fisik perjalanan armada perbantuan harian yang wajib disediakan (flight, trip KA, trip bus, trip kapal).</td>
            </tr>
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-emerald-300">$$A_&#123;\text&#123;total&#125;&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Total Operasi</td>
              <td class="p-2.5 text-ink-3">operasi / hari</td>
              <td class="p-2.5 text-ink-2">Kapasitas total perjalanan armada harian gabungan (armada reguler puncak + armada tambahan perbantuan).</td>
            </tr>
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-indigo-300">$$LF_&#123;\text&#123;biasa&#125;&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">LF Normal (Keberangkatan)</td>
              <td class="p-2.5 text-ink-3">pnp / armada</td>
              <td class="p-2.5 text-ink-2">Rasio rata-rata penumpang per satu armada keberangkatan pada bulan acuan normal (Februari 2026).</td>
            </tr>
            <tr class="border-b border-white/[0.05]">
              <td class="p-2.5 font-bold text-indigo-300">$$LF_&#123;\text&#123;puncak&#125;&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">LF Puncak (Keberangkatan)</td>
              <td class="p-2.5 text-ink-3">pnp / armada</td>
              <td class="p-2.5 text-ink-2">Rasio maksimum penumpang per satu armada keberangkatan pada hari puncak arus mudik/balik Lebaran.</td>
            </tr>
            <tr>
              <td class="p-2.5 font-bold text-ink">$$\%\text&#123; Tambah&#125;$$</td>
              <td class="p-2.5 font-semibold text-ink-2">Perlu Tambah (%)</td>
              <td class="p-2.5 text-ink-3">%</td>
              <td class="p-2.5 text-ink-2">Tingkat persentase penambahan armada berdasarkan kuantil persentil (20%, 15%, 10%, atau 5%).</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</div>
