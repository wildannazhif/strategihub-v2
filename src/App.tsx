import { useCallback, useEffect, useState, lazy, Suspense } from 'react';
import AppShell, { NAV, type ViewKey } from './components/AppShell';
import { ThemeProvider } from './components/theme';
import Overview from './modules/Overview';

const Timeline = lazy(() => import('./modules/Timeline'));
const Lebaran = lazy(() => import('./modules/Lebaran'));
const ModalShare = lazy(() => import('./modules/ModalShare'));
const LoadFactor = lazy(() => import('./modules/LoadFactor'));
const Hubs = lazy(() => import('./modules/Hubs'));
const Metrics = lazy(() => import('./modules/Metrics'));
const SpatialMap = lazy(() => import('./modules/SpatialMap'));
const Forecast = lazy(() => import('./modules/Forecast'));

function ViewFallback() {
  return (
    <div className="grid place-items-center py-24">
      <div className="flex items-center gap-3 text-slate-400">
        <span className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-kemenhub-600" />
        <span className="text-sm font-semibold">Memuat modul…</span>
      </div>
    </div>
  );
}

function viewFromHash(): ViewKey {
  const h = window.location.hash.replace('#/', '').replace('#', '');
  return NAV.some((n) => n.key === h) ? (h as ViewKey) : 'overview';
}

function Shell() {
  const [view, setView] = useState<ViewKey>(() => viewFromHash());

  useEffect(() => {
    const onHash = () => setView(viewFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const nav = useCallback((v: ViewKey) => {
    window.location.hash = `#/${v}`;
    setView(v);
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <AppShell view={view} onNav={nav}>
      <Suspense fallback={<ViewFallback />}>
        {view === 'overview' && <Overview />}
        {view === 'timeline' && <Timeline />}
        {view === 'lebaran' && <Lebaran />}
        {view === 'share' && <ModalShare />}
        {view === 'loadfactor' && <LoadFactor />}
        {view === 'hubs' && <Hubs />}
        {view === 'metrics' && <Metrics />}
        {view === 'map' && <SpatialMap />}
        {view === 'forecast' && <Forecast />}
      </Suspense>
    </AppShell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Shell />
    </ThemeProvider>
  );
}
