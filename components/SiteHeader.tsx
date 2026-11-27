'use client';

import { Moon, Sun, type LucideIcon } from 'lucide-react';
import { ALGORITHM_META } from '@/lib/constants';
import type { AlgorithmId, AppView, ThemeMode } from '@/lib/types';

interface SiteHeaderProps {
  view: AppView;
  theme: ThemeMode;
  algorithmId: AlgorithmId;
  currentTime: number;
  makespan: number;
  cpuUtilization: number;
  isPlaying: boolean;
  onChangeView: (view: AppView) => void;
  onToggleTheme: () => void;
}

const NAV_ITEMS: Array<{ id: AppView; code: string; label: string }> = [
  { id: 'simulate', code: '01', label: 'Simulate' },
  { id: 'compare', code: '02', label: 'Benchmark' },
  { id: 'learn', code: '03', label: 'Manual' },
];

const THEME_TOGGLE_LABEL: Record<ThemeMode, string> = {
  light: 'Switch to dark mode',
  dark: 'Switch to light mode',
};

const THEME_TOGGLE_ICON: Record<ThemeMode, LucideIcon> = {
  light: Moon,
  dark: Sun,
};

function getKernelStatusLabel(isPlaying: boolean, currentTime: number, makespan: number): string {
  if (isPlaying) {
    return 'RUNNING';
  }
  if (currentTime >= makespan) {
    return 'COMPLETE';
  }
  return 'PAUSED';
}

export function SiteHeader({
  view,
  theme,
  algorithmId,
  currentTime,
  makespan,
  cpuUtilization,
  isPlaying,
  onChangeView,
  onToggleTheme,
}: Readonly<SiteHeaderProps>) {
  const ThemeIcon = THEME_TOGGLE_ICON[theme];
  const meta = ALGORITHM_META[algorithmId];
  const ledColor = isPlaying ? 'var(--accent)' : 'var(--green-text)';
  const stateLabel = getKernelStatusLabel(isPlaying, currentTime, makespan);

  return (
    <header className="site-header sticky top-0 z-30 border-b">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-5 sm:px-8 lg:px-12 2xl:px-16">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => onChangeView('simulate')}
            className="flex items-center gap-2.5 text-left"
          >
            <span
              className="font-mono-num inline-flex h-7 items-center rounded px-2 text-xs font-semibold tracking-wider"
              style={{ backgroundColor: 'var(--ink-cta)', color: 'var(--on-ink)' }}
            >
              CPU.SCHED
            </span>
            <span className="font-display hidden text-xl sm:inline">Kernel Studio</span>
          </button>

          <output
            aria-label="Kernel telemetry"
            className="font-mono-num hidden items-center gap-4 border-l pl-6 text-xs text-muted xl:flex"
          >
            <span className="inline-flex items-center gap-2 text-strong">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: ledColor }}
                aria-hidden="true"
              />
              {stateLabel}
            </span>
            <span>POLICY: {meta.shortName}</span>
            <span>
              CLOCK: {String(currentTime).padStart(2, '0')}/{String(makespan).padStart(2, '0')}
            </span>
            <span>UTIL: {Math.round(cpuUtilization)}%</span>
          </output>
        </div>

        <div className="flex items-center gap-2.5">
          <nav aria-label="Main" className="nav-shell">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="nav-link"
                aria-current={view === item.id ? 'page' : undefined}
                onClick={() => onChangeView(item.id)}
              >
                <span className="font-mono-num hidden text-[0.7rem] text-muted sm:inline">
                  {item.code}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <button
            type="button"
            className="btn btn-icon btn-ghost"
            onClick={onToggleTheme}
            aria-label={THEME_TOGGLE_LABEL[theme]}
            title={THEME_TOGGLE_LABEL[theme]}
          >
            <ThemeIcon className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
