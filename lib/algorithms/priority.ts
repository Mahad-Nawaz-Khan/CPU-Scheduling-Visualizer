import type { ProcessInput, SimulationResult } from '../types';
import {
  compareArrivalThenPid,
  runNonPreemptiveScheduler,
  runPreemptiveScheduler,
  type SimProcessState,
} from './helpers';

function comparePriority(a: SimProcessState, b: SimProcessState): number {
  if (a.priority !== b.priority) {
    return a.priority - b.priority;
  }
  return compareArrivalThenPid(a, b);
}

export function runPriorityNonPreemptive(processes: ProcessInput[]): SimulationResult {
  return runNonPreemptiveScheduler(processes, {
    algorithmId: 'priority-np',
    compareReady: comparePriority,
    dispatchMessage: (process) =>
      `${process.id} gets the CPU because it is the most urgent waiting process (priority ${process.priority}).`,
    sliceReason: (process) =>
      `Highest priority ready process (Priority=${process.priority})`,
  });
}

export function runPriorityPreemptive(processes: ProcessInput[]): SimulationResult {
  return runPreemptiveScheduler(processes, {
    algorithmId: 'priority-p',
    compareReady: comparePriority,
    shouldPreempt: (candidate, running) => candidate.priority < running.priority,
    dispatchMessage: (process) =>
      `${process.id} gets the CPU because it is the most urgent waiting process (priority ${process.priority}).`,
    preemptMessage: (candidate, running) =>
      `${candidate.id} interrupts ${running.id} because priority ${candidate.priority} is more urgent than priority ${running.priority}.`,
    sliceReason: (process) =>
      `Highest priority active process (Priority=${process.priority})`,
  });
}
