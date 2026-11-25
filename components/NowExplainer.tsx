'use client';

import {
  CheckCircle2,
  ChevronDown,
  Coffee,
  Cpu,
  LogIn,
  Play,
  Timer,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { buildProcessColorMap, getProcessColor } from '@/lib/constants';
import { formatUnits } from '@/lib/format';
import type { DecisionEvent, DecisionEventType, ProcessInput, TickSnapshot } from '@/lib/types';
import { ProcessChip } from './ProcessChip';

const EVENT_STYLE: Record<DecisionEventType, { icon: LucideIcon; className: string }> = {
  arrival: { icon: LogIn, className: 'text-accent' },
  dispatch: { icon: Play, className: 'text-green' },
  preempt: { icon: Zap, className: 'text-amber' },
  quantum: { icon: Timer, className: 'text-amber' },
  complete: { icon: CheckCircle2, className: 'text-green' },
  idle: { icon: Coffee, className: 'text-muted' },
};

interface NowExplainerProps {
  ticks: TickSnapshot[];
  processes: ProcessInput[];
  currentTime: number;
  makespan: number;
}

export function NowExplainer({
  ticks,
  processes,
  currentTime,
  makespan,
}: Readonly<NowExplainerProps>) {
  if (ticks.length === 0) {
    return null;
  }

  const tickIndex = Math.min(Math.max(currentTime, 0), ticks.length - 1);
  const snapshot = ticks[tickIndex];
  const colorMap = buildProcessColorMap(processes);
  const isFinished = currentTime >= makespan;
  const history = ticks.slice(0, tickIndex + 1).flatMap((tick) => tick.events);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <CpuStatusCard
        snapshot={snapshot}
        colorMap={colorMap}
        currentTime={currentTime}
        isFinished={isFinished}
      />
      <EventsCard
        snapshot={snapshot}
        history={history}
        currentTime={currentTime}
        isFinished={isFinished}
      />
    </div>
  );
}

interface CpuStatusCardProps {
  snapshot: TickSnapshot;
  colorMap: Map<string, number>;
  currentTime: number;
  isFinished: boolean;
}

function CpuStatusCard({
  snapshot,
  colorMap,
  currentTime,
  isFinished,
}: Readonly<CpuStatusCardProps>) {
  const runningId = snapshot.runningProcessId;
  const runningColor = runningId ? getProcessColor(colorMap.get(runningId) ?? 0) : null;

  let cpuLabel = runningId ?? 'Idle';
  let cpuHint = 'No process is ready, so the CPU has nothing to do.';
  if (isFinished) {
    cpuLabel = 'All done';
    cpuHint = 'Every process has finished its work.';
  } else if (runningId) {
    cpuHint = `${formatUnits(snapshot.remainingBurst[runningId] ?? 0)} of work left`;
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-secondary">Right now · time {currentTime}</h3>
      <div className="mt-4 flex items-center gap-4">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: runningColor?.hex ?? 'var(--surface-muted)',
            color: runningColor ? '#ffffff' : 'var(--text-muted)',
          }}
        >
          <Cpu className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs text-muted">Using the CPU</p>
          <p className="text-xl font-semibold">{cpuLabel}</p>
          <p className="text-sm text-muted">{cpuHint}</p>
        </div>
      </div>

      <dl className="mt-5 space-y-4 border-t pt-4">
        <QueueRow
          label="Waiting in line"
          hint="in the order they will be picked"
          ids={snapshot.readyQueueIds}
          colorMap={colorMap}
          numbered
          emptyText="Nobody is waiting."
        />
        <QueueRow
          label="Not arrived yet"
          ids={snapshot.notArrivedIds}
          colorMap={colorMap}
          emptyText="Everyone has arrived."
        />
        <QueueRow
          label="Finished"
          ids={snapshot.completedIds}
          colorMap={colorMap}
          emptyText="None yet."
        />
      </dl>
    </div>
  );
}

interface QueueRowProps {
  label: string;
  hint?: string;
  ids: string[];
  colorMap: Map<string, number>;
  numbered?: boolean;
  emptyText: string;
}

function QueueRow({
  label,
  hint,
  ids,
  colorMap,
  numbered = false,
  emptyText,
}: Readonly<QueueRowProps>) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted">
        {label}
        {hint && <span className="font-normal"> · {hint}</span>}
      </dt>
      <dd className="mt-1.5 flex flex-wrap gap-1.5">
        {ids.length === 0 && <span className="text-sm text-muted">{emptyText}</span>}
        {ids.map((id, index) => (
          <ProcessChip
            key={id}
            id={id}
            colorIndex={colorMap.get(id) ?? 0}
            prefix={numbered ? `${index + 1}.` : undefined}
          />
        ))}
      </dd>
    </div>
  );
}

interface EventsCardProps {
  snapshot: TickSnapshot;
  history: DecisionEvent[];
  currentTime: number;
  isFinished: boolean;
}

function EventsCard({
  snapshot,
  history,
  currentTime,
  isFinished,
}: Readonly<EventsCardProps>) {
  const showQuietMessage = snapshot.events.length === 0 && !isFinished;
  let quietMessage = 'The CPU is idle, waiting for the next process to arrive.';
  if (snapshot.runningProcessId !== null) {
    quietMessage = `Nothing new happened, so ${snapshot.runningProcessId} simply keeps running.`;
  }

  return (
    <div className="card flex flex-col p-5">
      <h3 className="text-sm font-medium text-secondary">What just happened, and why</h3>
      <ul className="mt-4 flex-1 space-y-3">
        {snapshot.events.map((event) => (
          <EventLine
            key={`${event.time}-${event.type}-${event.processId ?? 'none'}-${event.message}`}
            event={event}
          />
        ))}
        {showQuietMessage && <li className="text-sm text-secondary">{quietMessage}</li>}
        {isFinished && (
          <li className="text-sm font-medium text-green">
            All processes are finished. See the results in step 4 below.
          </li>
        )}
      </ul>

      <details className="group mt-5 border-t pt-4">
        <summary className="flex items-center justify-between gap-2 text-sm font-medium text-accent">
          Show the full history up to time {currentTime}
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <ol className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
          {history.map((event) => (
            <li
              key={`hist-${event.time}-${event.type}-${event.processId ?? 'none'}-${event.message}`}
              className="flex gap-3 text-sm"
            >
              <span className="w-14 shrink-0 tabular-nums text-muted">t = {event.time}</span>
              <span className="text-secondary">{event.message}</span>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

function EventLine({ event }: Readonly<{ event: DecisionEvent }>) {
  const style = EVENT_STYLE[event.type];
  const Icon = style.icon;

  return (
    <li className="flex gap-3 text-sm">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.className}`} aria-hidden="true" />
      <span className="leading-relaxed">{event.message}</span>
    </li>
  );
}
