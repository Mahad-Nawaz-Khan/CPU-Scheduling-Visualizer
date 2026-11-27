'use client';

import { buildProcessColorMap, getProcessColor } from '@/lib/constants';
import { pickHeadline } from '@/lib/narration';
import type { AlgorithmId, DecisionEventType, ProcessInput, TickSnapshot } from '@/lib/types';

const EVENT_BADGE: Record<DecisionEventType, { label: string; className: string }> = {
  preempt: { label: 'PREEMPT ⚡', className: 'tag tag-amber' },
  dispatch: { label: 'DISPATCH ▶', className: 'tag tag-green' },
  quantum: { label: 'QUANTUM ↻', className: 'tag tag-amber' },
  complete: { label: 'COMPLETE ✓', className: 'tag tag-green' },
  arrival: { label: 'ARRIVAL +', className: 'tag' },
  idle: { label: 'IDLE', className: 'tag' },
};

interface NarrationProps {
  algorithmId: AlgorithmId;
  ticks: TickSnapshot[];
  processes: ProcessInput[];
  currentTime: number;
  makespan: number;
}

function describeQuietTick(runningId: string | null): string {
  if (runningId === null) {
    return 'The CPU is idle, waiting for the next process to arrive.';
  }
  return `${runningId} keeps the CPU. Nothing else changed.`;
}

export function Narration({
  algorithmId,
  ticks,
  processes,
  currentTime,
  makespan,
}: Readonly<NarrationProps>) {
  const snapshot = ticks[Math.min(Math.max(currentTime, 0), ticks.length - 1)];
  if (!snapshot || makespan === 0) {
    return <output className="block text-base text-muted">Add a process to get started.</output>;
  }

  const colorMap = buildProcessColorMap(processes);
  const isFinished = currentTime >= makespan;
  const headline = pickHeadline(snapshot.events);
  const focusId = headline?.processId ?? snapshot.runningProcessId;
  const dotColor = focusId ? getProcessColor(colorMap.get(focusId) ?? 0).hex : 'var(--text-muted)';

  let message = headline?.message ?? describeQuietTick(snapshot.runningProcessId);
  let badge = headline ? EVENT_BADGE[headline.type] : { label: 'EXECUTING', className: 'tag' };
  if (isFinished) {
    message = `Every process has finished its work by time ${makespan}.`;
    badge = { label: 'ALL DONE ✓', className: 'tag tag-green' };
  }
  const extraCount = isFinished ? 0 : Math.max(snapshot.events.length - 1, 0);

  return (
    <output
      key={`${algorithmId}-${currentTime}`}
      className="narration-enter flex items-start gap-3.5 border-l-2 pl-4"
      style={{ borderColor: dotColor }}
    >
      <span className="min-w-0">
        <span className="eyebrow flex flex-wrap items-center gap-2">
          {!isFinished && snapshot.runningProcessId && (
            <span
              className="anim-core-pulse inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: dotColor }}
              aria-hidden="true"
            />
          )}
          <span>Moment · t = {String(currentTime).padStart(2, '0')}</span>
          <span
            className={`anim-badge-pop ${badge.className}`}
            style={
              badge.className === 'tag'
                ? { backgroundColor: 'var(--surface-muted)', color: 'var(--text-secondary)' }
                : undefined
            }
          >
            {badge.label}
          </span>
          {extraCount > 0 && <span>+{extraCount} more in inspector</span>}
        </span>
        <span className="narration-copy mt-1.5 block">{message}</span>
      </span>
    </output>
  );
}
