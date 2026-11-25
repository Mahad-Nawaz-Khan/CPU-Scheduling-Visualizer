'use client';

import { ChevronDown, Download, Trophy } from 'lucide-react';
import {
  ALGORITHM_META,
  BEHAVIOR_TAG_CLASS,
  DEFAULT_QUANTUM,
  MAX_QUANTUM,
  MIN_QUANTUM,
  buildProcessColorMap,
  getProcessColor,
} from '@/lib/constants';
import { clampInteger } from '@/lib/presets';
import type { AlgorithmId, ProcessInput, SimulationResult, TimelineSegment } from '@/lib/types';

interface CompareViewProps {
  results: SimulationResult[];
  processes: ProcessInput[];
  timeQuantum: number;
  onChangeQuantum: (quantum: number) => void;
  onOpenStrategy: (id: AlgorithmId) => void;
  onExport: () => void;
}

export function CompareView({
  results,
  processes,
  timeQuantum,
  onChangeQuantum,
  onOpenStrategy,
  onExport,
}: CompareViewProps) {
  const colorMap = buildProcessColorMap(processes);
  const ranked = [...results].sort(
    (a, b) => a.summary.averageWaitingTime - b.summary.averageWaitingTime,
  );
  const best = ranked[0]?.summary.averageWaitingTime ?? 0;
  const worst = ranked.at(-1)?.summary.averageWaitingTime ?? 0;
  const barScale = Math.max(worst, 0.01);
  const maxMakespan = Math.max(1, ...results.map((result) => result.summary.makespan));
  const winners = ranked
    .filter((result) => result.summary.averageWaitingTime === best)
    .map((result) => ALGORITHM_META[result.algorithmId].name);

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <p className="text-sm font-medium text-accent">Side-by-side comparison</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Which strategy works best here?</h1>
        <p className="mt-3 text-base leading-relaxed text-secondary">
          All six strategies run on exactly the same processes you set up in the Simulator. They are
          ranked by <strong className="text-strong">average waiting time</strong>, which is how long
          processes spent stuck in line. Lower is better.
        </p>
      </header>

      <div className="card flex items-center gap-4 p-5" style={{ backgroundColor: 'var(--accent-soft)', borderColor: 'transparent' }}>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          <Trophy className="h-5 w-5 text-amber" aria-hidden="true" />
        </span>
        <p className="text-sm leading-relaxed sm:text-base">
          <strong>{winners.join(' and ')}</strong> {winners.length > 1 ? 'tie for' : 'gives'} the
          lowest average waiting time: <strong>{best.toFixed(2)} time units</strong>.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label htmlFor="compare-quantum" className="text-sm text-secondary">
            Round Robin time slice
          </label>
          <input
            id="compare-quantum"
            name="compare-quantum"
            type="number"
            min={MIN_QUANTUM}
            max={MAX_QUANTUM}
            value={timeQuantum}
            onChange={(event) =>
              onChangeQuantum(
                clampInteger(
                  Number.parseInt(event.target.value, 10),
                  MIN_QUANTUM,
                  MAX_QUANTUM,
                  DEFAULT_QUANTUM,
                ),
              )
            }
            className="input w-20 tabular-nums"
          />
        </div>
        <button type="button" className="btn" onClick={onExport}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Download comparison (CSV)
        </button>
      </div>

      <div className="card overflow-hidden">
        <div
          className="hidden gap-4 px-5 py-3 text-xs font-medium text-muted md:grid md:grid-cols-[minmax(0,240px)_minmax(0,1fr)_150px]"
          style={{ backgroundColor: 'var(--surface-muted)' }}
        >
          <span>Strategy</span>
          <span>Timeline (time 0 to {maxMakespan})</span>
          <span className="text-right">Avg. waiting time</span>
        </div>
        <ol className="divide-y">
          {ranked.map((result, index) => {
            const meta = ALGORITHM_META[result.algorithmId];
            const average = result.summary.averageWaitingTime;
            const isBest = average === best;
            const quantumSuffix = result.algorithmId === 'rr' ? ` (slice ${timeQuantum})` : '';

            return (
              <li
                key={result.algorithmId}
                className="grid items-center gap-4 px-5 py-4 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)_150px]"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 text-sm font-semibold tabular-nums text-muted">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onOpenStrategy(result.algorithmId)}
                      className="text-left text-sm font-medium hover:underline"
                      title="Open this strategy in the Simulator"
                    >
                      {meta.name}
                      {quantumSuffix}
                    </button>
                    <div className="mt-1">
                      <span className={BEHAVIOR_TAG_CLASS[meta.behaviorLabel]}>
                        {meta.behaviorLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <MiniTimeline timeline={result.timeline} maxMakespan={maxMakespan} colorMap={colorMap} />

                <div>
                  <div className="flex items-baseline justify-between gap-2 md:justify-end">
                    <span className="text-xs text-muted md:hidden">Avg. waiting time</span>
                    <span className={`text-lg font-semibold tabular-nums ${isBest ? 'text-green' : ''}`}>
                      {average.toFixed(2)}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full"
                    style={{ backgroundColor: 'var(--surface-muted)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max((average / barScale) * 100, 2)}%`,
                        backgroundColor: isBest ? 'var(--green-text)' : 'var(--accent)',
                      }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <details className="card group overflow-hidden">
        <summary className="flex items-center justify-between gap-3 px-5 py-4">
          <span>
            <span className="block text-sm font-medium">See every metric</span>
            <span className="block text-xs text-muted">
              Turnaround, response time, CPU usage, and interruptions for each strategy
            </span>
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="overflow-x-auto border-t">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Strategy</th>
                <th scope="col">Avg. waiting</th>
                <th scope="col">Avg. turnaround</th>
                <th scope="col">Avg. response</th>
                <th scope="col">CPU busy</th>
                <th scope="col">Interruptions</th>
                <th scope="col">Finished at</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((result) => (
                <tr key={`row-${result.algorithmId}`}>
                  <td className="font-medium">{ALGORITHM_META[result.algorithmId].name}</td>
                  <td>{result.summary.averageWaitingTime.toFixed(2)}</td>
                  <td>{result.summary.averageTurnaroundTime.toFixed(2)}</td>
                  <td>{result.summary.averageResponseTime.toFixed(2)}</td>
                  <td>{Math.round(result.summary.cpuUtilization)}%</td>
                  <td>{result.summary.preemptionCount}</td>
                  <td>{result.summary.makespan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

interface MiniTimelineProps {
  timeline: TimelineSegment[];
  maxMakespan: number;
  colorMap: Map<string, number>;
}

function MiniTimeline({ timeline, maxMakespan, colorMap }: MiniTimelineProps) {
  return (
    <div
      className="flex h-7 w-full overflow-hidden rounded-md"
      style={{ backgroundColor: 'var(--surface-muted)' }}
    >
      {timeline.map((segment) => {
        const isIdle = segment.processId === null;
        const label = segment.processId ?? 'Idle';
        return (
          <div
            key={`${segment.startTime}-${label}`}
            title={`${label}: from time ${segment.startTime} to ${segment.endTime}`}
            className={`flex items-center justify-center overflow-hidden border-r text-[11px] font-semibold ${
              isIdle ? 'idle-hatch text-muted' : 'text-white'
            }`}
            style={{
              width: `${(segment.duration / maxMakespan) * 100}%`,
              backgroundColor: isIdle ? undefined : getProcessColor(colorMap.get(label) ?? 0).hex,
              borderColor: 'var(--surface)',
            }}
          >
            <span className="truncate px-0.5">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
