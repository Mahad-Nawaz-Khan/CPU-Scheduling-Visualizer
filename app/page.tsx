'use client';

import { useState } from 'react';
import { CompareView } from '@/components/CompareView';
import { LearnView } from '@/components/LearnView';
import { SimulatorView } from '@/components/SimulatorView';
import { SiteHeader } from '@/components/SiteHeader';
import { useSimulator } from '@/hooks/useSimulator';
import { useTheme } from '@/hooks/useTheme';
import type { AlgorithmId, AppView } from '@/lib/types';

export default function HomePage() {
  const simulator = useSimulator();
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<AppView>('simulate');

  function changeView(next: AppView) {
    setView(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openStrategy(id: AlgorithmId) {
    simulator.selectAlgorithm(id);
    changeView('simulate');
  }

  function tryScenario(presetId: string, id: AlgorithmId) {
    simulator.loadPreset(presetId);
    simulator.selectAlgorithm(id);
    changeView('simulate');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        view={view}
        theme={theme}
        onChangeView={changeView}
        onToggleTheme={toggleTheme}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        {view === 'simulate' && (
          <SimulatorView simulator={simulator} onOpenLearn={() => changeView('learn')} />
        )}
        {view === 'compare' && (
          <CompareView
            results={simulator.comparison}
            processes={simulator.processes}
            timeQuantum={simulator.timeQuantum}
            onChangeQuantum={simulator.changeQuantum}
            onOpenStrategy={openStrategy}
            onExport={simulator.exportComparison}
          />
        )}
        {view === 'learn' && <LearnView onTryScenario={tryScenario} />}
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-muted sm:px-6">
          <span>CPU Scheduling Visualizer · Operating Systems course project</span>
          <span>All scheduling runs locally in your browser.</span>
        </div>
      </footer>
    </div>
  );
}
