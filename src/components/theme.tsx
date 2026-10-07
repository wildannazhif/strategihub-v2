import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

interface ThemeCtx {
  dark: boolean;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ dark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('sh-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('sh-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const toggle = useCallback(() => setDark((d) => !d), []);

  return <Ctx.Provider value={{ dark, toggle }}>{children}</Ctx.Provider>;
}

export function useDark(): boolean {
  return useContext(Ctx).dark;
}

export function useTheme(): ThemeCtx {
  return useContext(Ctx);
}
