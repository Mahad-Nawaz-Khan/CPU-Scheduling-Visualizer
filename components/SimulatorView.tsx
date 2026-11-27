'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { SimulatorState } from '@/hooks/useSimulator';
import { SHOWS_PRIORITY } from '@/lib/constants';
import { formatUnits, pluralize } from '@/lib/format';
import { CuriosityChallengeBar } from './CuriosityChallengeBar';
import { Disclosure } from './Disclosure';
import { GanttChart } from './GanttChart';
import { IntroBanner } from './IntroBanner';
import { LivePipelineFlow } from './LivePipelineFlow';
import { Narration } from './Narration';
import { NowExplainer } from './NowExplainer';
import { PlaybackBar } from './PlaybackBar';
import { ProcessChip } from './ProcessChip';
import { ProcessEditor } from './ProcessEditor';
import { ResultsSummary } from './ResultsSummary';
import { StrategyPicker } from './StrategyPicker';

interface SimulatorViewProps {
  simulator: SimulatorState;
  onOpenLearn: () => void;
}

function isEditableEventTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON';
}

export function SimulatorView({ simulator, onOpenLearn }: Readonly<SimulatorViewProps>) {
  const [editingWorkload, setEditingWorkload] = useState(false);
  const totalBurst = simulator.result.summary.totalBurstTime;
  const countLabel = pluralize(simulator.processes.length, 'process', 'processes');

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || isEditableEventTarget(event.target)) {
        return;
      }
      if (event.key === ' ') {
        event.preventDefault();
        simulator.togglePlay();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        simulator.stepBack();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        simulator.stepForward();
      }
    }

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [simulator]);

  return (
    <div className="w-full">
      <div className="grid border-b xl:grid-cols-12">
        <div className="border-b px-5 py-8 sm:px-8 sm:py-10 lg:px-12 2xl:px-16 xl:col-span-5 xl:border-b-0 xl:border-r">
          <IntroBanner onOpenLearn={onOpenLearn} />
        </div>
        <div className="px-5 py-8 sm:px-8 sm:py-10 lg:px-12 2xl:px-16 xl:col-span-7">
          <StrategyPicker
            algorithmId={simulator.algorithmId}
            timeQuantum={simulator.timeQuantum}
            onSelect={simulator.selectAlgorithm}
            onChangeQuantum={simulator.changeQuantum}
          />
        </div>
      </div>

      <CuriosityChallengeBar onRunExperiment={simulator.runExperiment} />

      <section aria-label="Execution studio" className="blueprint-shell border-b">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4 sm:px-8 lg:px-12 2xl:px-16">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="coord-tag mr-2">
              <span style={{ color: 'var(--accent)' }}>[ 02 ]</span>
              <span>Execution Timeline</span>
            </span>
            {simulator.processes.map((process) => (
              <ProcessChip key={process.id} id={process.id} colorIndex={process.colorIndex} />
            ))}
            <span className="font-mono-num ml-1 text-xs text-muted">
              {countLabel} · {formatUnits(totalBurst)}
            </span>
          </div>

          <button
            type="button"
            className="btn"
            aria-expanded={editingWorkload}
            onClick={() => setEditingWorkload((open) => !open)}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {editingWorkload ? 'Done editing' : 'Customize workload'}
          </button>
        </div>

        {editingWorkload && (
          <div
            className="border-b px-5 py-6 sm:px-8 lg:px-12 2xl:px-16"
            style={{ backgroundColor: 'var(--bg-subtle)' }}
          >
            <ProcessEditor
              processes={simulator.processes}
              presetId={simulator.presetId}
              showPriority={SHOWS_PRIORITY[simulator.algorithmId]}
              onLoadPreset={simulator.loadPreset}
              onRandomize={simulator.randomize}
              onAdd={simulator.addProcess}
              onUpdate={simulator.updateProcess}
              onRemove={simulator.removeProcess}
            />
          </div>
        )}

        <div className="dot-matrix border-b px-5 py-8 sm:px-8 sm:py-10 lg:px-12 2xl:px-16">
          <GanttChart
            timeline={simulator.result.timeline}
            processes={simulator.processes}
            makespan={simulator.makespan}
            currentTime={simulator.currentTime}
            onSeek={simulator.seek}
          />
        </div>

        <LivePipelineFlow
          algorithmId={simulator.algorithmId}
          ticks={simulator.result.ticks}
          processes={simulator.processes}
          currentTime={simulator.currentTime}
        />

        <div className="grid items-center gap-6 border-t px-5 py-6 sm:px-8 lg:grid-cols-12 lg:px-12 2xl:px-16">
          <div className="lg:col-span-6">
            <Narration
              algorithmId={simulator.algorithmId}
              ticks={simulator.result.ticks}
              processes={simulator.processes}
              currentTime={simulator.currentTime}
              makespan={simulator.makespan}
            />
          </div>
          <div className="lg:col-span-6">
            <PlaybackBar
              currentTime={simulator.currentTime}
              makespan={simulator.makespan}
              isPlaying={simulator.isPlaying}
              speed={simulator.speed}
              onTogglePlay={simulator.togglePlay}
              onStepBack={simulator.stepBack}
              onStepForward={simulator.stepForward}
              onSeek={simulator.seek}
              onChangeSpeed={simulator.setSpeed}
            />
          </div>
        </div>

        <Disclosure
          variant="panel"
          code="INSPECT"
          title="Chronological kernel decision log"
          hint="Full tick-by-tick event history and detailed ready-queue breakdown"
        >
          <NowExplainer
            ticks={simulator.result.ticks}
            processes={simulator.processes}
            currentTime={simulator.currentTime}
            makespan={simulator.makespan}
          />
        </Disclosure>
      </section>

      <ResultsSummary
        result={simulator.result}
        comparison={simulator.comparison}
        onSelectOptimal={simulator.selectAlgorithm}
        onExport={simulator.exportResults}
      />
    </div>
  );
}
