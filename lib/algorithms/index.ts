import { ALGORITHM_ORDER, DEFAULT_QUANTUM } from '../constants';
import type { AlgorithmId, ProcessInput, SimulationResult } from '../types';
import { runFCFS } from './fcfs';
import { runPriorityNonPreemptive, runPriorityPreemptive } from './priority';
import { runRoundRobin } from './roundRobin';
import { runSJF } from './sjf';
import { runSRTF } from './srtf';

export type AlgorithmRunner = (
  processes: ProcessInput[],
  timeQuantum: number,
) => SimulationResult;

export const ALGORITHM_RUNNERS: Record<AlgorithmId, AlgorithmRunner> = {
  fcfs: (processes) => runFCFS(processes),
  sjf: (processes) => runSJF(processes),
  srtf: (processes) => runSRTF(processes),
  'priority-np': (processes) => runPriorityNonPreemptive(processes),
  'priority-p': (processes) => runPriorityPreemptive(processes),
  rr: (processes, timeQuantum) => runRoundRobin(processes, timeQuantum),
};

export function runAlgorithm(
  algorithmId: AlgorithmId,
  processes: ProcessInput[],
  timeQuantum = DEFAULT_QUANTUM,
): SimulationResult {
  const runner = ALGORITHM_RUNNERS[algorithmId];
  return runner(processes, timeQuantum);
}

export function runAllAlgorithms(
  processes: ProcessInput[],
  timeQuantum = DEFAULT_QUANTUM,
): SimulationResult[] {
  return ALGORITHM_ORDER.map((algorithmId) =>
    ALGORITHM_RUNNERS[algorithmId](processes, timeQuantum),
  );
}
