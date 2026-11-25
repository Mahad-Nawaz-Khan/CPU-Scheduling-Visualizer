'use client';

import type { SimulatorState } from '@/hooks/useSimulator';
import { ALGORITHM_META } from '@/lib/constants';
import { GanttChart } from './GanttChart';
import { IntroBanner } from './IntroBanner';
import { NowExplainer } from './NowExplainer';
import { PlaybackBar } from './PlaybackBar';
import { ProcessEditor } from './ProcessEditor';
import { ResultsSummary } from './ResultsSummary';
import { StepSection } from './StepSection';
import { StrategyPicker } from './StrategyPicker';

interface SimulatorViewProps {
  simulator: SimulatorState;
  onOpenLearn: () => void;
}

export function SimulatorView({ simulator, onOpenLearn }: SimulatorViewProps) {
  const meta = ALGORITHM_META[simulator.algorithmId];

  return (
    <div className="space-y-16">
      <IntroBanner onOpenLearn={onOpenLearn} />

      <StepSection
        step={1}
        title="Set up the processes"
        description="A process is a program that wants to use the CPU. Each one shows up at some moment (arrival time) and needs a certain amount of CPU time (burst time). Edit the numbers, or start from an example."
      >
        <ProcessEditor
          processes={simulator.processes}
          presetId={simulator.presetId}
          onLoadPreset={simulator.loadPreset}
          onRandomize={simulator.randomize}
          onAdd={simulator.addProcess}
          onUpdate={simulator.updateProcess}
          onRemove={simulator.removeProcess}
        />
      </StepSection>

      <StepSection
        step={2}
        title="Pick a scheduling strategy"
        description="The strategy is the rule the scheduler follows to choose which waiting process runs next. Some let a process finish once it starts; others can interrupt it."
      >
        <StrategyPicker
          algorithmId={simulator.algorithmId}
          timeQuantum={simulator.timeQuantum}
          onSelect={simulator.selectAlgorithm}
          onChangeQuantum={simulator.changeQuantum}
        />
      </StepSection>

      <StepSection
        step={3}
        title="Watch the CPU at work"
        description={`The timeline shows which process used the CPU at each moment under ${meta.name}. Press Play to replay it step by step, and read the explanation underneath.`}
      >
        <div className="card space-y-5 p-5 sm:p-6">
          <GanttChart
            timeline={simulator.result.timeline}
            processes={simulator.processes}
            makespan={simulator.makespan}
            currentTime={simulator.currentTime}
          />
          <PlaybackBar
            currentTime={simulator.currentTime}
            makespan={simulator.makespan}
            isPlaying={simulator.isPlaying}
            speed={simulator.speed}
            onTogglePlay={simulator.togglePlay}
            onStepBack={simulator.stepBack}
            onStepForward={simulator.stepForward}
            onRestart={simulator.restart}
            onJumpToEnd={simulator.jumpToEnd}
            onSeek={simulator.seek}
            onChangeSpeed={simulator.setSpeed}
          />
        </div>
        <NowExplainer
          ticks={simulator.result.ticks}
          processes={simulator.processes}
          currentTime={simulator.currentTime}
          makespan={simulator.makespan}
        />
      </StepSection>

      <StepSection
        step={4}
        title="Read the results"
        description="How well did this strategy do? These are the final numbers once every process has finished. Try another strategy in step 2, or open the Compare tab to see all six side by side."
      >
        <ResultsSummary result={simulator.result} onExport={simulator.exportResults} />
      </StepSection>
    </div>
  );
}
