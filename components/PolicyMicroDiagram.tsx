'use client';

import { Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ALGORITHM_RUNNERS } from '@/lib/algorithms';
import {
  ALGORITHM_META,
  STAGE_HINT_BY_ALGO,
  buildProcessColorMap,
  getProcessColor,
} from '@/lib/constants';
import { DEMO_WORKLOADS } from '@/lib/demoWorkloads';
import { pickHeadline } from '@/lib/narration';
import type { AlgorithmId, ProcessInput, TimelineSegment } from '@/lib/types';
import { SchedulerStage } from './SchedulerStage';

const FRAME_MS = 1200;
const END_HOLD_FRAMES = 2;

interface PolicyMicroDiagramProps {
  algorithmId: AlgorithmId;
}

function isEntryVisible(entry: IntersectionObserverEntry): boolean {
  return entry.isIntersecting;
}

function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => setInView(entries.some(isEntryVisible)),
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}

function padTime(value: number): string {
  return String(value).padStart(2, '0');
}

interface TheaterGanttProps {
  timeline: TimelineSegment[];
  processes: ProcessInput[];
  makespan: number;
  time: number;
}

function TheaterGantt({ timeline, processes, makespan, time }: Readonly<TheaterGanttProps>) {
  const colorMap = buildProcessColorMap(processes);
  const revealPct = makespan > 0 ? (time / makespan) * 100 : 0;
  const ticks = Array.from({ length: makespan + 1 }, (_, value) => value);

  const revealedSegments = timeline.map((segment) => {
    const label = segment.processId ?? 'Idle';
    const isIdle = segment.processId === null;
    return (
      <div
        key={`${segment.startTime}-${label}`}
        className={`font-mono-num flex items-center justify-center border-r text-[0.68rem] font-semibold ${
          isIdle ? 'idle-hatch text-muted' : 'text-white'
        }`}
        style={{
          width: `${(segment.duration / makespan) * 100}%`,
          backgroundColor: isIdle ? undefined : getProcessColor(colorMap.get(label) ?? 0).hex,
          borderColor: 'var(--surface)',
        }}
      >
        {label}
      </div>
    );
  });

  const ghostBlocks = timeline.map((segment) => {
    const label = segment.processId ?? 'Idle';
    const isIdle = segment.processId === null;
    return (
      <div
        key={`ghost-${segment.startTime}-${label}`}
        className={`border-r ${isIdle ? 'idle-hatch' : ''}`}
        style={{
          width: `${(segment.duration / makespan) * 100}%`,
          backgroundColor: isIdle ? undefined : getProcessColor(colorMap.get(label) ?? 0).hex,
          borderColor: 'var(--surface)',
        }}
      />
    );
  });

  const ghostLabels = timeline.map((segment) => {
    const label = segment.processId ?? 'Idle';
    return (
      <div
        key={`label-${segment.startTime}-${label}`}
        className="font-mono-num flex items-center justify-center text-[0.68rem] font-semibold text-secondary"
        style={{ width: `${(segment.duration / makespan) * 100}%` }}
      >
        {label}
      </div>
    );
  });

  return (
    <div aria-hidden="true">
      <div
        className="relative h-7 w-full overflow-hidden rounded-md border"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="absolute inset-0 flex opacity-20">{ghostBlocks}</div>
        <div className="absolute inset-0 flex opacity-70">{ghostLabels}</div>
        <div
          className="theater-reveal absolute inset-0 flex"
          style={{ clipPath: `inset(0 ${100 - revealPct}% 0 0)` }}
        >
          {revealedSegments}
        </div>
        {time > 0 && time < makespan && (
          <div
            className="theater-playhead pointer-events-none absolute inset-y-0 w-0.5"
            style={{
              left: `${revealPct}%`,
              backgroundColor: 'var(--accent)',
            }}
          />
        )}
      </div>
      <div className="font-mono-num relative mt-1 h-4 text-[0.62rem] text-muted">
        {ticks.map((value) => (
          <span
            key={value}
            className={`absolute -translate-x-1/2 ${value === time ? 'font-semibold text-accent' : ''}`}
            style={{ left: `${(value / makespan) * 100}%` }}
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function PolicyTheater({ algorithmId }: Readonly<PolicyMicroDiagramProps>) {
  const demo = DEMO_WORKLOADS[algorithmId];
  const meta = ALGORITHM_META[algorithmId];
  const result = useMemo(
    () => ALGORITHM_RUNNERS[algorithmId](demo.processes, demo.quantum),
    [algorithmId, demo],
  );
  const lastFrame = result.ticks.length - 1;
  const period = lastFrame + 1 + END_HOLD_FRAMES;

  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { ref, inView } = useInView<HTMLElement>();

  useEffect(() => {
    if (isPaused || !inView) {
      return undefined;
    }
    const timer = globalThis.setInterval(() => setStep((value) => value + 1), FRAME_MS);
    return () => globalThis.clearInterval(timer);
  }, [isPaused, inView]);

  const cycle = Math.floor(step / period);
  const time = Math.min(step % period, lastFrame);
  const snapshot = result.ticks[time];
  const headline = pickHeadline(snapshot.events);

  let caption = headline?.message ?? 'The CPU is idle.';
  if (!headline && snapshot.runningProcessId) {
    caption = `${snapshot.runningProcessId} keeps running. Nothing else changes.`;
  }
  if (time === lastFrame) {
    caption = `All done at time ${lastFrame}.`;
  }

  const PlayStateIcon = isPaused ? Play : Pause;

  return (
    <figure ref={ref} className="card-muted space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="coord-tag">
          <span className="text-accent">Demo</span>
          <span>How {meta.shortName} picks the next job</span>
        </p>
        <div className="flex items-center gap-1">
          <span className="font-mono-num mr-1 text-xs text-muted">
            t = {padTime(time)} / {padTime(lastFrame)}
          </span>
          <button
            type="button"
            className="btn btn-icon btn-ghost"
            onClick={() => setStep((value) => (Math.floor(value / period) + 1) * period)}
            aria-label="Restart demo"
            title="Restart demo"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn btn-icon btn-ghost"
            onClick={() => setIsPaused((value) => !value)}
            aria-label={isPaused ? 'Play demo' : 'Pause demo'}
            title={isPaused ? 'Play demo' : 'Pause demo'}
          >
            <PlayStateIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <SchedulerStage
        key={cycle}
        ticks={result.ticks}
        time={time}
        processes={demo.processes}
        algorithmId={algorithmId}
      />

      <output
        key={`${cycle}-${time}`}
        className="narration-enter block text-[0.95rem] font-medium leading-snug text-strong"
      >
        {caption}
      </output>

      <TheaterGantt
        key={`gantt-${cycle}`}
        timeline={result.timeline}
        processes={demo.processes}
        makespan={result.summary.makespan}
        time={time}
      />

      <figcaption className="space-y-1">
        <p className="text-sm leading-relaxed text-secondary">
          <strong className="text-strong">Takeaway: </strong>
          {demo.lesson}
        </p>
        <p className="text-xs text-muted">{STAGE_HINT_BY_ALGO[algorithmId]}</p>
      </figcaption>
    </figure>
  );
}

export function PolicyMicroDiagram({ algorithmId }: Readonly<PolicyMicroDiagramProps>) {
  return <PolicyTheater key={algorithmId} algorithmId={algorithmId} />;
}
