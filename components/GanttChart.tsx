'use client';

import { Zap } from 'lucide-react';
import { buildProcessColorMap, getProcessColor } from '@/lib/constants';
import type { ProcessInput, TimelineSegment } from '@/lib/types';

interface GanttChartProps {
  timeline: TimelineSegment[];
  processes: ProcessInput[];
  makespan: number;
  currentTime: number;
  onSeek: (time: number) => void;
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
  onSeek: (time: number) => void;
}

function GanttBlock({
  segment,
  makespan,
  currentTime,
  colorIndex,
  onSeek,
}: Readonly<GanttBlockProps>) {
  const visibleEnd = Math.min(segment.endTime, currentTime);
  const visibleDuration = visibleEnd - segment.startTime;
  if (visibleDuration <= 0) {
    return null;
  }

  const isIdle = segment.processId === null;
  const label = segment.processId ?? 'Idle';
  const isFullyShown = visibleEnd === segment.endTime;
  const isCurrentlyExecuting =
    currentTime > segment.startTime && currentTime < segment.endTime && !isIdle;
  const widthRatio = visibleDuration / makespan;
  const showRange = widthRatio >= 0.08;

  return (
    <button
      type="button"
      onClick={() => onSeek(segment.endTime)}
      title={`${label} (${segment.startTime} → ${segment.endTime}) — click to jump to t=${segment.endTime}`}
      aria-label={`Jump to time ${segment.endTime}, end of ${label} slice`}
      className={`gantt-liquid absolute inset-y-0 flex cursor-pointer flex-col items-center justify-center overflow-hidden border-r-2 hover:brightness-110 ${
        isIdle ? 'idle-hatch text-muted' : 'text-white'
      }`}
      style={{
        left: `${(segment.startTime / makespan) * 100}%`,
        width: `${widthRatio * 100}%`,
        backgroundColor: isIdle ? undefined : getProcessColor(colorIndex).hex,
        borderColor: 'var(--surface)',
      }}
    >
      {isCurrentlyExecuting && (
        <span
          aria-hidden="true"
          className="gantt-active-sweep pointer-events-none absolute inset-y-0 left-0 w-1/2"
        />
      )}
      <span className="font-mono-num relative z-10 truncate px-1.5 text-[1rem] font-semibold tracking-tight">
        {label}
      </span>
      {showRange && (
        <span className="font-mono-num relative z-10 text-[0.74rem] opacity-85">
          {segment.startTime}–{visibleEnd}
        </span>
      )}
      {segment.preemptedAtEnd && isFullyShown && (
        <Zap
          className="anim-badge-pop absolute right-1.5 top-1.5 z-10 h-3.5 w-3.5 opacity-95"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

export function GanttChart({
  timeline,
  processes,
  makespan,
  currentTime,
  onSeek,
}: Readonly<GanttChartProps>) {
  if (makespan === 0) {
    return <p className="text-base text-muted">Add a process to see the execution timeline.</p>;
  }

  const colorMap = buildProcessColorMap(processes);
  const ticks = buildTickValues(timeline, makespan);
  const boundaries = new Set([0, ...timeline.map((segment) => segment.endTime)]);
  const hasIdle = timeline.some((segment) => segment.processId === null);
  const hasInterruption = timeline.some((segment) => segment.preemptedAtEnd);
  const scheduleSummary = timeline
    .map((segment) => `${segment.processId ?? 'Idle'} from ${segment.startTime} to ${segment.endTime}`)
    .join(', ');
  const playheadPct = (currentTime / makespan) * 100;

  return (
    <div>
      <p className="sr-only">Schedule: {scheduleSummary}.</p>
      <div className="relative pt-3">
        <div
          className="relative h-20 overflow-hidden rounded-xl border"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          {timeline.map((segment) => (
            <GanttBlock
              key={`${segment.startTime}-${segment.processId ?? 'idle'}`}
              segment={segment}
              makespan={makespan}
              currentTime={currentTime}
              colorIndex={colorMap.get(segment.processId ?? '') ?? 0}
              onSeek={onSeek}
            />
          ))}
        </div>

        {currentTime < makespan && (
          <div
            aria-hidden="true"
            className="gantt-liquid pointer-events-none absolute bottom-0 top-0 z-20"
            style={{ left: `${playheadPct}%` }}
          >
            <div
              className="h-full w-0.5 -translate-x-1/2 rounded-full"
              style={{
                backgroundColor: 'var(--accent)',
                boxShadow: '0 0 14px var(--accent)',
              }}
            />
            <span
              className="font-mono-num absolute -top-4 -translate-x-1/2 rounded px-1.5 py-0.5 text-[0.7rem] font-semibold text-white shadow-sm"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              t={currentTime}
            </span>
          </div>
        )}
      </div>

      <div className="font-mono-num relative mt-3 h-5 text-[0.8125rem]" aria-hidden="true">
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
                boundaries.has(value) ? 'font-semibold text-strong' : 'text-muted opacity-50'
              }`}
              style={{ left: `${(value / makespan) * 100}%`, transform }}
            >
              {value}
            </span>
          );
        })}
      </div>

      {(hasIdle || hasInterruption) && (
        <div className="mt-3 flex flex-wrap items-center gap-5 text-xs text-muted">
          {hasIdle && (
            <span className="inline-flex items-center gap-1.5">
              <span className="idle-hatch h-3 w-5 rounded-sm border" aria-hidden="true" />
              CPU idle
            </span>
          )}
          {hasInterruption && (
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber" aria-hidden="true" />
              Interrupted mid-work (click any block to jump to its boundary)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
