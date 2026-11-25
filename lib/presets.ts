import {
  MAX_ARRIVAL_TIME,
  MAX_BURST_TIME,
  MAX_PRIORITY,
  MIN_ARRIVAL_TIME,
  MIN_BURST_TIME,
  MIN_PRIORITY,
  PROCESS_PALETTE,
} from './constants';
import type { PresetScenario, ProcessInput } from './types';

export function clampInteger(
  rawValue: number,
  min: number,
  max: number,
  fallback: number,
): number {
  if (!Number.isFinite(rawValue)) {
    return fallback;
  }
  const rounded = Math.trunc(rawValue);
  return Math.min(Math.max(rounded, min), max);
}

export function sanitizeProcessInput(process: ProcessInput): ProcessInput {
  return {
    ...process,
    arrivalTime: clampInteger(process.arrivalTime, MIN_ARRIVAL_TIME, MAX_ARRIVAL_TIME, 0),
    burstTime: clampInteger(process.burstTime, MIN_BURST_TIME, MAX_BURST_TIME, 1),
    priority: clampInteger(process.priority, MIN_PRIORITY, MAX_PRIORITY, 1),
  };
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'default-sample',
    name: 'Basic example',
    description: 'Three processes arriving one after another. A good place to start.',
    recommendedAlgorithm: 'fcfs',
    processes: [
      { id: 'P1', pidOrder: 1, arrivalTime: 0, burstTime: 5, priority: 2, colorIndex: 0 },
      { id: 'P2', pidOrder: 2, arrivalTime: 1, burstTime: 3, priority: 1, colorIndex: 1 },
      { id: 'P3', pidOrder: 3, arrivalTime: 2, burstTime: 1, priority: 3, colorIndex: 2 },
    ],
  },
  {
    id: 'convoy-effect',
    name: 'Convoy effect',
    description:
      'One long process arrives first, followed by three short ones. Compare First Come, First Served with Shortest Job First.',
    recommendedAlgorithm: 'fcfs',
    processes: [
      { id: 'P1', pidOrder: 1, arrivalTime: 0, burstTime: 14, priority: 3, colorIndex: 0 },
      { id: 'P2', pidOrder: 2, arrivalTime: 1, burstTime: 2, priority: 1, colorIndex: 1 },
      { id: 'P3', pidOrder: 3, arrivalTime: 2, burstTime: 1, priority: 2, colorIndex: 2 },
      { id: 'P4', pidOrder: 4, arrivalTime: 3, burstTime: 2, priority: 1, colorIndex: 3 },
    ],
  },
  {
    id: 'idle-gaps',
    name: 'CPU idle time',
    description: 'Processes arrive with gaps between them, so the CPU sometimes has nothing to do.',
    recommendedAlgorithm: 'fcfs',
    processes: [
      { id: 'P1', pidOrder: 1, arrivalTime: 2, burstTime: 3, priority: 2, colorIndex: 0 },
      { id: 'P2', pidOrder: 2, arrivalTime: 7, burstTime: 4, priority: 1, colorIndex: 1 },
      { id: 'P3', pidOrder: 3, arrivalTime: 8, burstTime: 2, priority: 3, colorIndex: 2 },
    ],
  },
  {
    id: 'preemption-showcase',
    name: 'Interruptions',
    description:
      'Shorter and more urgent processes keep arriving. Try Shortest Remaining Time First to watch them interrupt.',
    recommendedAlgorithm: 'srtf',
    processes: [
      { id: 'P1', pidOrder: 1, arrivalTime: 0, burstTime: 8, priority: 4, colorIndex: 0 },
      { id: 'P2', pidOrder: 2, arrivalTime: 1, burstTime: 4, priority: 2, colorIndex: 1 },
      { id: 'P3', pidOrder: 3, arrivalTime: 2, burstTime: 2, priority: 1, colorIndex: 2 },
      { id: 'P4', pidOrder: 4, arrivalTime: 3, burstTime: 5, priority: 3, colorIndex: 3 },
    ],
  },
  {
    id: 'simultaneous-ties',
    name: 'Taking turns',
    description:
      'Several equal processes arrive together. Round Robin shows how they share the CPU in turns.',
    recommendedAlgorithm: 'rr',
    processes: [
      { id: 'P1', pidOrder: 1, arrivalTime: 0, burstTime: 4, priority: 2, colorIndex: 0 },
      { id: 'P2', pidOrder: 2, arrivalTime: 0, burstTime: 4, priority: 2, colorIndex: 1 },
      { id: 'P3', pidOrder: 3, arrivalTime: 2, burstTime: 3, priority: 1, colorIndex: 2 },
      { id: 'P4', pidOrder: 4, arrivalTime: 2, burstTime: 3, priority: 1, colorIndex: 3 },
    ],
  },
];

export function cloneProcesses(processes: ProcessInput[]): ProcessInput[] {
  return processes.map((process) => ({ ...process }));
}

export function getDefaultProcesses(): ProcessInput[] {
  return cloneProcesses(PRESET_SCENARIOS[0].processes);
}

export function generateRandomProcesses(count = 5): ProcessInput[] {
  const safeCount = clampInteger(count, 3, 10, 5);
  const generated: ProcessInput[] = [];
  let runningArrival = 0;

  for (let index = 0; index < safeCount; index += 1) {
    if (index > 0) {
      runningArrival += Math.floor(Math.random() * 4);
    }
    const pidOrder = index + 1;

    generated.push({
      id: `P${pidOrder}`,
      pidOrder,
      arrivalTime: Math.min(runningArrival, MAX_ARRIVAL_TIME),
      burstTime: 1 + Math.floor(Math.random() * 9),
      priority: 1 + Math.floor(Math.random() * 5),
      colorIndex: index % PROCESS_PALETTE.length,
    });
  }

  return generated;
}
