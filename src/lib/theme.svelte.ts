import { browser } from '$app/environment';

/** 'dark' | 'light' — persisted, defaults to dark */
function initial(): 'dark' | 'light' {
  if (!browser) return 'dark';
  const saved = localStorage.getItem('sh-theme');
  return saved === 'light' ? 'light' : 'dark';
}

class ThemeStore {
  current = $state<'dark' | 'light'>(initial());

  constructor() {
    if (browser) this.apply(this.current);
  }

  apply(t: 'dark' | 'light') {
    this.current = t;
    document.documentElement.classList.toggle('dark', t === 'dark');
    document.documentElement.style.colorScheme = t;
    try {
      localStorage.setItem('sh-theme', t);
    } catch {
      /* ignore */
    }
  }

  toggle() {
    this.apply(this.current === 'dark' ? 'light' : 'dark');
  }
}

export const themeStore = new ThemeStore();
/** reactive theme value: themeStore.current */
export const isDark = () => themeStore.current === 'dark';

/**
 * Theme-aware colors for ApexCharts / MapLibre / inline styles.
 * Use inside $derived so charts react to theme changes.
 */
export function chartTheme(dark: boolean) {
  return {
    fg: dark ? '#e8eef7' : '#000000',
    soft: dark ? '#a7b3c7' : '#141414',
    faint: dark ? '#5d6b84' : '#2e2e2e',
    grid: dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)',
    axisLine: dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.12)',
    tooltipMode: dark ? ('dark' as const) : ('light' as const),
    donutStroke: dark ? '#0a101d' : '#ffffff',
    popupBg: dark ? '#0d1424' : '#ffffff',
    popupFg: dark ? '#e8eef7' : '#0f172a',
    popupSoft: dark ? '#8b98ad' : '#64748b',
    mapStyle: dark
      ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  };
}
