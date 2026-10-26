'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'nash-theme';
const THEME_COLOR: Record<Theme, string> = { light: '#fefdf9', dark: '#010101' };

/**
 * Runs in <head> before first paint, so a returning visitor who chose dark never sees a flash of the light page.
 * Light is the default; the OS colour scheme is deliberately not consulted.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

function currentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function paint(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Server and first client render both say "light"; the effect then adopts whatever the head script applied.
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    setThemeState(currentTheme());
    paint(currentTheme());
    // Keep several open tabs in step.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const next: Theme = event.newValue === 'dark' ? 'dark' : 'light';
      setThemeState(next);
      paint(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    paint(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked (private mode); the choice then lasts for this visit only.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
