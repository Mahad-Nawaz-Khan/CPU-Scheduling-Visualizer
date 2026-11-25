'use client';

import {
  BarChart3,
  Cpu,
  GraduationCap,
  Moon,
  PlayCircle,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import type { AppView, ThemeMode } from '@/lib/types';

interface SiteHeaderProps {
  view: AppView;
  theme: ThemeMode;
  onChangeView: (view: AppView) => void;
  onToggleTheme: () => void;
}

const NAV_ITEMS: Array<{ id: AppView; label: string; icon: LucideIcon }> = [
  { id: 'simulate', label: 'Simulator', icon: PlayCircle },
  { id: 'compare', label: 'Compare', icon: BarChart3 },
  { id: 'learn', label: 'Learn', icon: GraduationCap },
];

const THEME_TOGGLE_LABEL: Record<ThemeMode, string> = {
  light: 'Switch to dark mode',
  dark: 'Switch to light mode',
};

const THEME_TOGGLE_ICON: Record<ThemeMode, LucideIcon> = {
  light: Moon,
  dark: Sun,
};

export function SiteHeader({ view, theme, onChangeView, onToggleTheme }: SiteHeaderProps) {
  const ThemeIcon = THEME_TOGGLE_ICON[theme];

  return (
    <header className="site-header sticky top-0 z-30 border-b">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => onChangeView('simulate')}
          className="flex items-center gap-3 text-left"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            <Cpu className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="hidden sm:block">
            <span className="block text-sm font-semibold leading-tight">
              CPU Scheduling Visualizer
            </span>
            <span className="block text-xs text-muted">See how an OS shares the processor</span>
          </span>
        </button>

        <nav aria-label="Main" className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className="nav-link"
                aria-current={view === item.id ? 'page' : undefined}
                onClick={() => onChangeView(item.id)}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sr-only sm:hidden">{item.label}</span>
              </button>
            );
          })}
          <span className="mx-1 h-6 w-px" style={{ backgroundColor: 'var(--border)' }} aria-hidden="true" />
          <button
            type="button"
            className="btn btn-icon btn-ghost"
            onClick={onToggleTheme}
            aria-label={THEME_TOGGLE_LABEL[theme]}
            title={THEME_TOGGLE_LABEL[theme]}
          >
            <ThemeIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </header>
  );
}
