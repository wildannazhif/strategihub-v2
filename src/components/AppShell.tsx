import { useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Activity, CalendarRange, PieChart, Gauge, MapPin,
  Table2, Map as MapIcon, CalendarClock, Moon, Sun, Menu, X, TrainFront,
  CalendarDays,
} from 'lucide-react';
import { useTheme } from './theme';

export type ViewKey =
  | 'overview' | 'timeline' | 'lebaran' | 'share' | 'loadfactor'
  | 'hubs' | 'metrics' | 'map' | 'forecast';

export const NAV: { key: ViewKey; label: string; desc: string; icon: ReactNode }[] = [
  { key: 'overview', label: 'Ringkasan', desc: 'Ikhtisar mobilitas nasional', icon: <LayoutDashboard size={18} /> },
  { key: 'timeline', label: 'Kronologi Harian', desc: 'Tren 272 hari • Jan–Sep 2026', icon: <Activity size={18} /> },
  { key: 'lebaran', label: 'Puncak Lebaran', desc: 'Mudik & balik 13–29 Mar 2026', icon: <CalendarRange size={18} /> },
  { key: 'share', label: 'Pangsa Pasar', desc: 'Distribusi antar-moda', icon: <PieChart size={18} /> },
  { key: 'loadfactor', label: 'Load Factor', desc: 'Rasio beban armada', icon: <Gauge size={18} /> },
  { key: 'hubs', label: 'Simpul Top 30', desc: 'Hub tersibuk nasional', icon: <MapPin size={18} /> },
  { key: 'metrics', label: 'Matriks Indikator', desc: '13 indikator operasional', icon: <Table2 size={18} /> },
  { key: 'map', label: 'Peta Spasial', desc: 'Sebaran 1.208 simpul', icon: <MapIcon size={18} /> },
  { key: 'forecast', label: 'Proyeksi Nataru', desc: 'Forecast 100 hari ke depan', icon: <CalendarClock size={18} /> },
];

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 pb-5 pt-6">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-kemenhub-900 shadow-md">
        <TrainFront size={22} strokeWidth={2.25} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-extrabold tracking-tight text-white">
          StrategiHub
        </p>
        <p className="truncate text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/55">
          Kemenhub 2026
        </p>
      </div>
    </div>
  );
}

export default function AppShell({
  view,
  onNav,
  children,
}: {
  view: ViewKey;
  onNav: (v: ViewKey) => void;
  children: ReactNode;
}) {
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  const navList = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
      {NAV.map((n) => {
        const isActive = n.key === view;
        return (
          <button
            key={n.key}
            onClick={() => {
              onNav(n.key);
              setOpen(false);
            }}
            className={clsx(
              'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all',
              isActive
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/65 hover:bg-white/8 hover:text-white',
            )}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white" />
            )}
            <span className={clsx('shrink-0', !isActive && 'text-white/50 group-hover:text-white')}>
              {n.icon}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-bold leading-tight">{n.label}</span>
              <span className={clsx('block truncate text-[11px]', isActive ? 'text-white/70' : 'text-white/40')}>
                {n.desc}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );

  const sidebarBody = (withClose: boolean) => (
    <>
      <div className="flex items-center justify-between">
        <Brand />
        {withClose && (
          <button
            onClick={() => setOpen(false)}
            className="mr-4 rounded-lg p-2 text-white/70 hover:bg-white/10"
            aria-label="Tutup navigasi"
          >
            <X size={20} />
          </button>
        )}
      </div>
      {navList}
      <div className="border-t border-white/10 p-4">
        <button
          onClick={toggle}
          className="flex w-full items-center justify-between rounded-lg bg-white/8 px-3 py-2.5 text-[13px] font-semibold text-white/80 transition hover:bg-white/15"
        >
          <span className="flex items-center gap-2">
            {dark ? <Moon size={16} /> : <Sun size={16} />}
            {dark ? 'Mode Gelap' : 'Mode Terang'}
          </span>
          <span className={clsx('relative h-5 w-9 rounded-full transition', dark ? 'bg-emerald-400' : 'bg-white/25')}>
            <span className={clsx('absolute top-0.5 size-4 rounded-full bg-white shadow transition-all', dark ? 'left-[18px]' : 'left-0.5')} />
          </span>
        </button>
        <p className="mt-3 px-1 text-[10.5px] leading-relaxed text-white/40">
          StrategiHub PUSDATIN Kemenhub • 1 Jan – 29 Sep 2026 • 209.964 baris terverifikasi
        </p>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-kemenhub-900 lg:flex">
        {sidebarBody(false)}
      </aside>

      {/* Mobile drawer */}
      <div className={clsx('fixed inset-0 z-50 lg:hidden', open ? 'block' : 'hidden')}>
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-kemenhub-900 shadow-2xl animate-fade-in">
          {sidebarBody(true)}
        </aside>
      </div>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Dark header bar */}
        <header className="sticky top-0 z-30 bg-kemenhub-900">
          <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 text-white/80 hover:bg-white/10 lg:hidden"
              aria-label="Buka navigasi"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[17px] font-extrabold tracking-tight text-white">
                StrategiHub 2026
              </p>
              <p className="truncate text-[11.5px] font-medium text-white/55">
                Pantau • Analisis • Aksi — Mobilitas Nasional
              </p>
            </div>
            <button
              onClick={toggle}
              className="rounded-lg p-2.5 text-white/70 transition hover:bg-white/10 lg:hidden"
              aria-label="Ganti tema"
            >
              {dark ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <span className="num hidden items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-[11.5px] font-bold text-white sm:inline-flex">
              <CalendarDays size={13} className="text-white/70" />
              1 Jan 2026 – 29 Sep 2026
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-5 sm:px-6">
          <div key={view} className="animate-fade-up">
            {children}
          </div>
        </main>
        <footer className="px-6 py-4">
          <p className="mx-auto max-w-[1320px] text-[11px] text-slate-400 dark:text-slate-500">
            StrategiHub Analytics 2026 • Pusat Data dan Informasi, Kementerian Perhubungan RI
          </p>
        </footer>
      </div>
    </div>
  );
}
