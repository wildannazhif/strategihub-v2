<script lang="ts">
  import type { Snippet } from 'svelte';
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import LayoutDashboard from 'lucide-svelte/icons/layout-dashboard';
  import Activity from 'lucide-svelte/icons/activity';
  import CalendarRange from 'lucide-svelte/icons/calendar-range';
  import PieChart from 'lucide-svelte/icons/pie-chart';
  import Gauge from 'lucide-svelte/icons/gauge';
  import MapPin from 'lucide-svelte/icons/map-pin';
  import Table2 from 'lucide-svelte/icons/table-2';
  import MapIcon from 'lucide-svelte/icons/map';
  import CalendarClock from 'lucide-svelte/icons/calendar-clock';
  import Menu from 'lucide-svelte/icons/menu';
  import X from 'lucide-svelte/icons/x';
  import TrainFront from 'lucide-svelte/icons/train-front';
  import CalendarDays from 'lucide-svelte/icons/calendar-days';

  interface Props {
    children: Snippet;
  }
  let { children }: Props = $props();

  const NAV = [
    { href: '/', label: 'Ringkasan', desc: 'Ikhtisar mobilitas nasional', Icon: LayoutDashboard },
    { href: '/kronologi', label: 'Kronologi Harian', desc: 'Tren 272 hari', Icon: Activity },
    { href: '/lebaran', label: 'Puncak Lebaran', desc: 'Mudik & balik 2026', Icon: CalendarRange },
    { href: '/pangsa', label: 'Pangsa Pasar', desc: 'Distribusi antar-moda', Icon: PieChart },
    { href: '/load-factor', label: 'Load Factor', desc: 'Rasio beban armada', Icon: Gauge },
    { href: '/simpul', label: 'Simpul Top 30', desc: 'Hub tersibuk nasional', Icon: MapPin },
    { href: '/indikator', label: 'Matriks Indikator', desc: '13 indikator operasional', Icon: Table2 },
    { href: '/peta', label: 'Peta Spasial', desc: 'Sebaran 1.208 simpul', Icon: MapIcon },
    { href: '/proyeksi', label: 'Proyeksi Nataru', desc: 'Forecast 100 hari', Icon: CalendarClock },
  ];

  let open = $state(false);
  const rawPath = $derived($page.url.pathname);
  const path = $derived(rawPath === base + '/' || rawPath === base ? '/' : rawPath.slice(base.length) || '/');
  const active = $derived(NAV.find((n) => n.href === path) ?? NAV[0]);
</script>

<div class="bg-scene flex min-h-screen">
  <!-- Desktop sidebar -->
  <aside class="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-white/[0.06] bg-abyss/80 backdrop-blur-xl lg:flex">
    <a href={`${base}/`} class="flex items-center gap-3 px-5 pb-6 pt-6">
      <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-void shadow-[0_0_24px_rgb(56_189_248/0.35)]">
        <TrainFront size={20} strokeWidth={2.5} />
      </div>
      <div class="min-w-0">
        <p class="truncate text-[15px] font-extrabold tracking-tight text-ink">StrategiHub</p>
        <p class="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">Kemenhub 2026</p>
      </div>
    </a>

    <nav class="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
      {#each NAV as n}
        {@const isActive = n.href === path}
        {@const Icon = n.Icon}
        <a
          href={`${base}${n.href}`}
          class={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${isActive ? 'bg-white/[0.07] text-ink' : 'text-ink-3 hover:bg-white/[0.04] hover:text-ink'}`}
        >
          {#if isActive}
            <span class="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent shadow-[0_0_12px_rgb(56_189_248/0.8)]"></span>
          {/if}
          <span class={isActive ? 'text-accent' : 'text-ink-3 group-hover:text-ink-2'}>
            <Icon size={18} />
          </span>
          <span class="min-w-0">
            <span class="block truncate text-[13px] font-bold leading-tight">{n.label}</span>
            <span class="block truncate text-[10.5px] text-ink-3">{n.desc}</span>
          </span>
        </a>
      {/each}
    </nav>

    <div class="border-t border-white/[0.06] p-4">
      <div class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <p class="num text-[11px] font-bold text-ink-2">209.964 <span class="font-medium text-ink-3">baris</span></p>
        <p class="mt-0.5 text-[10.5px] leading-relaxed text-ink-3">Data terverifikasi PUSDATIN<br />1 Jan – 29 Sep 2026</p>
      </div>
    </div>
  </aside>

  <!-- Mobile drawer -->
  {#if open}
    <div class="fixed inset-0 z-50 lg:hidden">
      <button class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick={() => (open = false)} aria-label="Tutup navigasi"></button>
      <aside class="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-white/[0.06] bg-abyss">
        <div class="flex items-center justify-between pr-4">
          <a href={`${base}/`} class="flex items-center gap-3 px-5 pb-6 pt-6" onclick={() => (open = false)}>
            <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-void">
              <TrainFront size={20} strokeWidth={2.5} />
            </div>
            <div><p class="text-[15px] font-extrabold text-ink">StrategiHub</p></div>
          </a>
          <button class="rounded-lg p-2 text-ink-3 hover:bg-white/[0.06]" onclick={() => (open = false)} aria-label="Tutup">
            <X size={20} />
          </button>
        </div>
        <nav class="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {#each NAV as n}
            {@const isActive = n.href === path}
            {@const Icon = n.Icon}
            <a
              href={`${base}${n.href}`}
              onclick={() => (open = false)}
              class={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 ${isActive ? 'bg-white/[0.07] text-ink' : 'text-ink-3'}`}
            >
              <span class={isActive ? 'text-accent' : ''}><Icon size={18} /></span>
              <span class="text-[13px] font-bold">{n.label}</span>
            </a>
          {/each}
        </nav>
      </aside>
    </div>
  {/if}

  <!-- Main -->
  <div class="flex min-w-0 flex-1 flex-col">
    <header class="sticky top-0 z-30 border-b border-white/[0.06] bg-void/80 backdrop-blur-xl">
      <div class="flex items-center gap-3 px-4 py-3 sm:px-6">
        <button class="rounded-lg p-2 text-ink-3 hover:bg-white/[0.06] lg:hidden" onclick={() => (open = true)} aria-label="Buka navigasi">
          <Menu size={20} />
        </button>
        <div class="min-w-0 flex-1">
          <p class="truncate text-[15px] font-extrabold tracking-tight text-ink">{active.label}</p>
          <p class="truncate text-[11px] text-ink-3">{active.desc}</p>
        </div>
        <span class="num hidden items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-bold text-ink-2 sm:inline-flex">
          <CalendarDays size={13} class="text-accent" />
          1 Jan – 29 Sep 2026
        </span>
        <span class="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300">
          <span class="size-1.5 animate-pulse-glow rounded-full bg-emerald-400"></span>
          Live
        </span>
      </div>
    </header>

    <main class="mx-auto w-full max-w-[1360px] flex-1 px-4 py-5 sm:px-6">
      <div class="animate-fade-up">
        {@render children()}
      </div>
    </main>

    <footer class="px-6 py-4">
      <p class="mx-auto max-w-[1360px] text-[11px] text-ink-3">
        StrategiHub Analytics 2026 • Pusat Data dan Informasi, Kementerian Perhubungan RI
      </p>
    </footer>
  </div>
</div>
