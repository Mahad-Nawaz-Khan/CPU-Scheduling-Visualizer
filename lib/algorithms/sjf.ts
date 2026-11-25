import { formatUnits } from '../format';
import type { ProcessInput, SimulationResult } from '../types';
import { compareArrivalThenPid, runNonPreemptiveScheduler, type SimProcessState } from './helpers';

function compareSjf(a: SimProcessState, b: SimProcessState): number {
  if (a.burstTime !== b.burstTime) {
    return a.burstTime - b.burstTime;
  }
  return compareArrivalThenPid(a, b);
}

export function runSJF(processes: ProcessInput[]): SimulationResult {
  return runNonPreemptiveScheduler(processes, {
    algorithmId: 'sjf',
    compareReady: compareSjf,
    dispatchMessage: (process) =>
      `${process.id} gets the CPU because it needs the least total time (${formatUnits(process.burstTime)}) of everyone waiting.`,
    sliceReason: (process) =>
      `Shortest total burst among ready jobs (BT=${process.burstTime})`,
  });
}
