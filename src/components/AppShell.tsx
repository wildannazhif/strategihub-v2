import { useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Activity, CalendarRange, PieChart, Gauge, MapPin,
  Table2, Map as MapIcon, CalendarClock, Moon, Sun, Menu, X, TrainFront,
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
    <div className="flex items-center gap-3 px-5 pt-6 pb-5">
      <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-kemenhub-600 to-kemenhub-900 text-white shadow-lg">
        <TrainFront size={22} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">
          StrategiHub 2026
        </p>
        <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
          PUSDATIN • Kemenhub RI
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
  const active = NAV.find((n) => n.key === view);

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
              'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
              isActive
                ? 'bg-kemenhub-600 text-white shadow-md shadow-kemenhub-600/25'
                : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800/70',
            )}
          >
            <span className={clsx('shrink-0', !isActive && 'text-slate-400 group-hover:text-kemenhub-600 dark:group-hover:text-kemenhub-300')}>
              {n.icon}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-bold leading-tight">{n.label}</span>
              <span className={clsx('block truncate text-[11px]', isActive ? 'text-white/75' : 'text-slate-400')}>
                {n.desc}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[268px] shrink-0 flex-col border-r border-slate-200/80 bg-white/80 backdrop-blur-xl lg:flex dark:border-slate-800 dark:bg-slate-900/70">
        <Brand />
        {navList}
        <div className="border-t border-slate-200/80 p-4 dark:border-slate-800">
          <button
            onClick={toggle}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <span className="flex items-center gap-2">
              {dark ? <Moon size={16} /> : <Sun size={16} />}
              {dark ? 'Mode Gelap' : 'Mode Terang'}
            </span>
            <span className={clsx('relative h-5 w-9 rounded-full transition', dark ? 'bg-kemenhub-600' : 'bg-slate-300')}>
              <span className={clsx('absolute top-0.5 size-4 rounded-full bg-white shadow transition-all', dark ? 'left-[18px]' : 'left-0.5')} />
            </span>
          </button>
          <p className="mt-3 px-1 text-[10.5px] leading-relaxed text-slate-400">
            Data: StrategiHub PUSDATIN Kemenhub • 1 Jan – 29 Sep 2026 • 209.964 baris terverifikasi
          </p>
        </div>
      </aside>

      {/* Mobile drawer */}
      <div className={clsx('fixed inset-0 z-50 lg:hidden', open ? 'block' : 'hidden')}>
        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col bg-white shadow-2xl dark:bg-slate-900 animate-fade-in">
          <div className="flex items-center justify-between pr-4">
            <Brand />
            <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={20} />
            </button>
          </div>
          {navList}
        </aside>
      </div>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/75">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
              aria-label="Buka navigasi"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-extrabold text-slate-900 dark:text-white">
                {active?.label}
              </p>
              <p className="truncate text-[11.5px] text-slate-500 dark:text-slate-400">{active?.desc}</p>
            </div>
            <button
              onClick={toggle}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-100 lg:hidden dark:border-slate-700 dark:hover:bg-slate-800"
              aria-label="Ganti tema"
            >
              {dark ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <span className="num hidden rounded-full bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-600 sm:block dark:text-emerald-400">
              1 Jan – 29 Sep 2026
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6">
          <div key={view} className="animate-fade-up">
            {children}
          </div>
        </main>
        <footer className="border-t border-slate-200/70 px-6 py-4 dark:border-slate-800">
          <p className="mx-auto max-w-[1280px] text-[11px] text-slate-400">
            StrategiHub Analytics 2026 • Pusat Data dan Informasi, Kementerian Perhubungan RI • Rebuild modern — data identik dengan dashboard asli
          </p>
        </footer>
      </div>
    </div>
  );
}
