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
    globalThis.scrollTo({ top: 0, behavior: 'smooth' });
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
        algorithmId={simulator.algorithmId}
        currentTime={simulator.currentTime}
        makespan={simulator.makespan}
        cpuUtilization={simulator.result.summary.cpuUtilization}
        isPlaying={simulator.isPlaying}
        onChangeView={changeView}
        onToggleTheme={toggleTheme}
      />

      <main className="w-full flex-1">
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
        <div className="flex w-full flex-wrap items-center justify-between gap-2 px-5 py-6 text-xs text-muted sm:px-8 lg:px-12 2xl:px-16">
          <span className="font-mono-num uppercase tracking-wider">
            CPU.SCHED // Operating Systems Kernel Studio
          </span>
          <span className="font-mono-num">CLIENT-SIDE DETERMINISTIC SIMULATION</span>
        </div>
      </footer>
    </div>
  );
}
