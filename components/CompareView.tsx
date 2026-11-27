'use client';

import { ArrowUpRight, Download } from 'lucide-react';
import {
  ALGORITHM_META,
  DEFAULT_QUANTUM,
  MAX_QUANTUM,
  MIN_QUANTUM,
  buildProcessColorMap,
  getProcessColor,
} from '@/lib/constants';
import { clampInteger } from '@/lib/presets';
import type { AlgorithmId, ProcessInput, SimulationResult, TimelineSegment } from '@/lib/types';
import { Disclosure } from './Disclosure';

interface CompareViewProps {
  results: SimulationResult[];
  processes: ProcessInput[];
  timeQuantum: number;
  onChangeQuantum: (quantum: number) => void;
  onOpenStrategy: (id: AlgorithmId) => void;
  onExport: () => void;
}

const ROW_GRID = 'md:grid-cols-[260px_minmax(0,1fr)_120px] md:gap-6';

export function CompareView({
  results,
  processes,
  timeQuantum,
  onChangeQuantum,
  onOpenStrategy,
  onExport,
}: Readonly<CompareViewProps>) {
  const colorMap = buildProcessColorMap(processes);
  const ranked = [...results].sort(
    (a, b) => a.summary.averageWaitingTime - b.summary.averageWaitingTime,
  );
  const best = ranked[0]?.summary.averageWaitingTime ?? 0;
  const maxMakespan = Math.max(1, ...results.map((result) => result.summary.makespan));
  const winners = ranked
    .filter((result) => result.summary.averageWaitingTime === best)
    .map((result) => ALGORITHM_META[result.algorithmId].name);

  return (
    <div className="w-full">
      <div className="grid border-b xl:grid-cols-12">
        <header className="border-b px-5 py-8 sm:px-8 sm:py-10 lg:px-12 2xl:px-16 xl:col-span-7 xl:border-b-0 xl:border-r">
          <p className="coord-tag">
            <span style={{ color: 'var(--accent)' }}>[ 02 / BENCHMARK ]</span>
            <span>All Six Policies · Identical Workload</span>
          </p>
          <h1 className="hero-hybrid mt-4">
            Six policies, <span className="hero-serif-accent">one</span> workload.
          </h1>
          <p className="lead-copy mt-4 max-w-[54ch]">
            Every scheduling rule executes your exact process set side by side, ranked from the
            lowest average waiting time to the highest.
          </p>
        </header>

        <div className="dot-matrix flex flex-col justify-between gap-4 px-5 py-8 sm:px-8 sm:py-10 lg:px-12 2xl:px-16 xl:col-span-5">
          <p className="coord-tag">
            <span style={{ color: 'var(--green-text)' }}>●</span>
            <span>Optimal Policy</span>
          </p>
          <div>
            <p className="text-lg font-medium text-strong">{winners.join(' & ')}</p>
            <p className="mt-2 flex items-baseline gap-2.5">
              <span className="metric-numeral text-green">{best.toFixed(2)}</span>
              <span className="font-mono-num text-xs text-muted">time units avg. wait</span>
            </p>
          </div>
        </div>
      </div>

      <section aria-label="Ranked strategy comparison" className="blueprint-shell">
        <div
          className={`eyebrow hidden border-b px-5 py-3.5 sm:px-8 lg:px-12 2xl:px-16 md:grid ${ROW_GRID}`}
          style={{ backgroundColor: 'var(--bg-subtle)' }}
        >
          <span>Rule</span>
          <span>Synchronized timeline (0 → {maxMakespan})</span>
          <span className="text-right">Avg. wait</span>
        </div>

        <ol className="divide-y">
          {ranked.map((result, index) => {
            const meta = ALGORITHM_META[result.algorithmId];
            const average = result.summary.averageWaitingTime;
            const isBest = average === best;
            const suffix = result.algorithmId === 'rr' ? ` · slice ${timeQuantum}` : '';

            return (
              <li
                key={result.algorithmId}
                className={`grid items-center gap-4 px-5 py-5 sm:px-8 lg:px-12 2xl:px-16 ${ROW_GRID}`}
              >
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onOpenStrategy(result.algorithmId)}
                    className="group inline-flex items-center gap-1.5 text-left text-[1.02rem] font-medium hover:text-accent"
                    title="Open this rule in the Simulator"
                  >
                    <span className="font-mono-num mr-1 text-xs text-muted">0{index + 1}</span>
                    <span>{meta.name}</span>
                    <ArrowUpRight
                      className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </button>
                  <p className="mt-0.5 pl-6 text-xs text-muted">
                    {meta.behaviorLabel}
                    {suffix}
                  </p>
                </div>

                <MiniTimeline
                  timeline={result.timeline}
                  maxMakespan={maxMakespan}
                  colorMap={colorMap}
                />

                <p
                  className={`font-display text-3xl tabular-nums md:text-right ${
                    isBest ? 'text-green' : ''
                  }`}
                >
                  {average.toFixed(2)}
                </p>
              </li>
            );
          })}
        </ol>

        <Disclosure
          variant="panel"
          code="MATRIX"
          title="Tune Round Robin slice, view full matrix & download CSV"
          hint="Turnaround, response time, CPU utilization, and interruptions across all six rules"
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="compare-quantum"
                  className="text-[0.95rem] font-medium text-secondary"
                >
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
                  className="input font-mono-num w-20 text-center"
                />
              </div>
              <button type="button" className="btn" onClick={onExport}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Download comparison CSV
              </button>
            </div>

            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Rule</th>
                      <th scope="col">Avg. wait</th>
                      <th scope="col">Avg. turnaround</th>
                      <th scope="col">Avg. response</th>
                      <th scope="col">CPU busy</th>
                      <th scope="col">Interruptions</th>
                      <th scope="col">Makespan</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono-num">
                    {ranked.map((result) => (
                      <tr key={`row-${result.algorithmId}`}>
                        <td className="font-sans font-medium">
                          {ALGORITHM_META[result.algorithmId].name}
                        </td>
                        <td className="font-semibold">
                          {result.summary.averageWaitingTime.toFixed(2)}
                        </td>
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
            </div>
          </div>
        </Disclosure>
      </section>
    </div>
  );
}

interface MiniTimelineProps {
  timeline: TimelineSegment[];
  maxMakespan: number;
  colorMap: Map<string, number>;
}

function MiniTimeline({ timeline, maxMakespan, colorMap }: Readonly<MiniTimelineProps>) {
  return (
    <div
      className="flex h-11 w-full overflow-hidden rounded-lg border"
      style={{ backgroundColor: 'var(--bg-subtle)' }}
    >
      {timeline.map((segment) => {
        const isIdle = segment.processId === null;
        const label = segment.processId ?? 'Idle';
        return (
          <div
            key={`${segment.startTime}-${label}`}
            title={`${label}: from time ${segment.startTime} to ${segment.endTime}`}
            className={`font-mono-num flex items-center justify-center overflow-hidden border-r text-xs font-semibold ${
              isIdle ? 'idle-hatch text-muted' : 'text-white'
            }`}
            style={{
              width: `${(segment.duration / maxMakespan) * 100}%`,
              backgroundColor: isIdle ? undefined : getProcessColor(colorMap.get(label) ?? 0).hex,
              borderColor: 'var(--surface)',
            }}
          >
            <span className="truncate px-1">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
