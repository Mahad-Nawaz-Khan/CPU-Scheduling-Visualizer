import { formatUnits } from '../format';
import type { ProcessInput, SimulationResult } from '../types';
import { compareArrivalThenPid, runPreemptiveScheduler, type SimProcessState } from './helpers';

function compareSrtf(a: SimProcessState, b: SimProcessState): number {
  if (a.remaining !== b.remaining) {
    return a.remaining - b.remaining;
  }
  return compareArrivalThenPid(a, b);
}

export function runSRTF(processes: ProcessInput[]): SimulationResult {
  return runPreemptiveScheduler(processes, {
    algorithmId: 'srtf',
    compareReady: compareSrtf,
    shouldPreempt: (candidate, running) => candidate.remaining < running.remaining,
    dispatchMessage: (process) =>
      `${process.id} gets the CPU because it has the least work left (${formatUnits(process.remaining)}).`,
    preemptMessage: (candidate, running) =>
      `${candidate.id} interrupts ${running.id}: it needs only ${formatUnits(candidate.remaining)}, while ${running.id} still needs ${formatUnits(running.remaining)}.`,
    sliceReason: (process) =>
      `Shortest remaining time (${process.remaining} at start of slice)`,
  });
}
