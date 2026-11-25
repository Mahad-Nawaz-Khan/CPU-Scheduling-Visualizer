'use client';

import { Zap } from 'lucide-react';
import { buildProcessColorMap, getProcessColor } from '@/lib/constants';
import type { ProcessInput, TimelineSegment } from '@/lib/types';
import { ProcessChip } from './ProcessChip';

interface GanttChartProps {
  timeline: TimelineSegment[];
  processes: ProcessInput[];
  makespan: number;
  currentTime: number;
}

const EVERY_TICK_LIMIT = 30;

function buildTickValues(timeline: TimelineSegment[], makespan: number): number[] {
  const values = new Set<number>([0]);
  for (const segment of timeline) {
    values.add(segment.endTime);
  }
  if (makespan <= EVERY_TICK_LIMIT) {
    for (let tick = 0; tick <= makespan; tick += 1) {
      values.add(tick);
    }
  }
  return [...values].sort((a, b) => a - b);
}

interface GanttBlockProps {
  segment: TimelineSegment;
  makespan: number;
  currentTime: number;
  colorIndex: number;
}

function GanttBlock({ segment, makespan, currentTime, colorIndex }: GanttBlockProps) {
  const visibleEnd = Math.min(segment.endTime, currentTime);
  const visibleDuration = visibleEnd - segment.startTime;
  if (visibleDuration <= 0) {
    return null;
  }

  const isIdle = segment.processId === null;
  const label = segment.processId ?? 'Idle';
  const isFullyShown = visibleEnd === segment.endTime;

  return (
    <div
      title={`${label}: from time ${segment.startTime} to ${segment.endTime}`}
      className={`absolute inset-y-0 flex items-center justify-center overflow-hidden border-r-2 ${
        isIdle ? 'idle-hatch text-muted' : 'text-white'
      }`}
      style={{
        left: `${(segment.startTime / makespan) * 100}%`,
        width: `${(visibleDuration / makespan) * 100}%`,
        backgroundColor: isIdle ? undefined : getProcessColor(colorIndex).hex,
        borderColor: 'var(--surface)',
      }}
    >
      <span className="truncate px-1 text-sm font-semibold">{label}</span>
      {segment.preemptedAtEnd && isFullyShown && (
        <Zap className="absolute right-1 top-1 h-3 w-3" aria-hidden="true" />
      )}
    </div>
  );
}

export function GanttChart({ timeline, processes, makespan, currentTime }: GanttChartProps) {
  if (makespan === 0) {
    return <p className="text-sm text-muted">Add a process to see the timeline.</p>;
  }

  const colorMap = buildProcessColorMap(processes);
  const ticks = buildTickValues(timeline, makespan);
  const boundaries = new Set([0, ...timeline.map((segment) => segment.endTime)]);
  const scheduleSummary = timeline
    .map((segment) => `${segment.processId ?? 'Idle'} from ${segment.startTime} to ${segment.endTime}`)
    .join(', ');

  return (
    <div>
      <p className="sr-only">Schedule: {scheduleSummary}.</p>
      <div className="relative" aria-hidden="true">
        <div
          className="relative h-14 overflow-hidden rounded-lg"
          style={{ backgroundColor: 'var(--surface-muted)' }}
        >
          {timeline.map((segment) => (
            <GanttBlock
              key={`${segment.startTime}-${segment.processId ?? 'idle'}`}
              segment={segment}
              makespan={makespan}
              currentTime={currentTime}
              colorIndex={colorMap.get(segment.processId ?? '') ?? 0}
            />
          ))}
        </div>
        {currentTime < makespan && (
          <div
            className="pointer-events-none absolute -bottom-1 -top-1 w-0.5 rounded-full"
            style={{
              left: `calc(${(currentTime / makespan) * 100}% - 1px)`,
              backgroundColor: 'var(--text)',
            }}
          />
        )}
      </div>

      <div className="relative mt-2 h-5 text-xs tabular-nums" aria-hidden="true">
        {ticks.map((value, index) => {
          let transform = 'translateX(-50%)';
          if (index === 0) {
            transform = 'none';
          } else if (index === ticks.length - 1) {
            transform = 'translateX(-100%)';
          }
          return (
            <span
              key={value}
              className={`absolute ${
                boundaries.has(value) ? 'font-medium text-secondary' : 'text-muted opacity-50'
              }`}
              style={{ left: `${(value / makespan) * 100}%`, transform }}
            >
              {value}
            </span>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
        {processes.map((process) => (
          <ProcessChip key={process.id} id={process.id} colorIndex={process.colorIndex} />
        ))}
        <span className="process-chip">
          <span className="idle-hatch h-2.5 w-4 rounded-sm" aria-hidden="true" />
          Idle
        </span>
        <span className="inline-flex items-center gap-1 px-1">
          <Zap className="h-3.5 w-3.5 text-amber" aria-hidden="true" />
          marks an interruption
        </span>
      </div>
    </div>
  );
}
