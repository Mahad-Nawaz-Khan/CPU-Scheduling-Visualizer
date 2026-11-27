'use client';

import { useEffect, useState } from 'react';
import type { ThemeMode } from '@/lib/types';

const THEME_STORAGE_KEY = 'cpu-studio-theme-v3';
const NEXT_THEME: Record<ThemeMode, ThemeMode> = { light: 'dark', dark: 'light' };

function applyTheme(theme: ThemeMode): void {
  document.documentElement.dataset.theme = theme;
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>('dark');

  useEffect(() => {
    const saved = globalThis.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

  function toggleTheme() {
    const next = NEXT_THEME[theme];
    setTheme(next);
    applyTheme(next);
    globalThis.localStorage.setItem(THEME_STORAGE_KEY, next);
  }

  return { theme, toggleTheme };
}
