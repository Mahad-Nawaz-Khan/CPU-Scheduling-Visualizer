import type { ProcessInput, SimulationResult } from '../types';
import { compareArrivalThenPid, runNonPreemptiveScheduler } from './helpers';

export function runFCFS(processes: ProcessInput[]): SimulationResult {
  return runNonPreemptiveScheduler(processes, {
    algorithmId: 'fcfs',
    compareReady: compareArrivalThenPid,
    dispatchMessage: (process) =>
      `${process.id} gets the CPU because it arrived first (at time ${process.arrivalTime}) of everyone waiting.`,
    sliceReason: (process) => `Earliest arrival in ready queue (AT=${process.arrivalTime})`,
  });
}
