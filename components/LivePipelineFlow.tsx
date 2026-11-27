'use client';

import { STAGE_HINT_BY_ALGO } from '@/lib/constants';
import type { AlgorithmId, ProcessInput, TickSnapshot } from '@/lib/types';
import { SchedulerStage } from './SchedulerStage';

interface LivePipelineFlowProps {
  algorithmId: AlgorithmId;
  ticks: TickSnapshot[];
  processes: ProcessInput[];
  currentTime: number;
}

export function LivePipelineFlow({
  algorithmId,
  ticks,
  processes,
  currentTime,
}: Readonly<LivePipelineFlowProps>) {
  if (ticks.length === 0) {
    return null;
  }

  return (
    <div
      className="border-t px-5 py-5 sm:px-8 lg:px-12 2xl:px-16"
      style={{ backgroundColor: 'var(--bg-subtle)' }}
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="coord-tag">
          <span style={{ color: 'var(--accent)' }}>[ LIVE ]</span>
          <span>Inside the scheduler at t = {currentTime}</span>
        </p>
        <p className="text-xs text-muted">{STAGE_HINT_BY_ALGO[algorithmId]}</p>
      </div>
      <SchedulerStage
        ticks={ticks}
        time={currentTime}
        processes={processes}
        algorithmId={algorithmId}
      />
    </div>
  );
}
