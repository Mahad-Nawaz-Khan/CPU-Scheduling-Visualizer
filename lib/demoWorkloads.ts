import type { AlgorithmId, ProcessInput } from './types';

export interface DemoWorkload {
  processes: ProcessInput[];
  quantum: number;
  lesson: string;
}

function demoProcess(
  pidOrder: number,
  arrivalTime: number,
  burstTime: number,
  priority: number,
): ProcessInput {
  return {
    id: `P${pidOrder}`,
    pidOrder,
    arrivalTime,
    burstTime,
    priority,
    colorIndex: pidOrder - 1,
  };
}

export const DEMO_WORKLOADS: Record<AlgorithmId, DemoWorkload> = {
  fcfs: {
    processes: [demoProcess(1, 0, 5, 1), demoProcess(2, 1, 2, 1), demoProcess(3, 2, 1, 1)],
    quantum: 2,
    lesson:
      'P2 and P3 are tiny, yet they wait behind long P1 the whole time. That is the convoy effect.',
  },
  sjf: {
    processes: [demoProcess(1, 0, 3, 1), demoProcess(2, 1, 4, 1), demoProcess(3, 2, 1, 1)],
    quantum: 2,
    lesson:
      'P3 arrives last but cuts to the front of the line because it is the shortest. P1 is never interrupted.',
  },
  srtf: {
    processes: [demoProcess(1, 0, 5, 1), demoProcess(2, 1, 2, 1), demoProcess(3, 3, 1, 1)],
    quantum: 2,
    lesson:
      'P2 needs less time than what P1 has left, so it kicks P1 off the CPU the moment it arrives.',
  },
  'priority-np': {
    processes: [demoProcess(1, 0, 3, 2), demoProcess(2, 1, 2, 3), demoProcess(3, 2, 2, 1)],
    quantum: 2,
    lesson:
      'P3 is the most urgent (priority 1), so it jumps ahead of P2, but it still waits for P1 to finish.',
  },
  'priority-p': {
    processes: [demoProcess(1, 0, 4, 3), demoProcess(2, 1, 2, 1), demoProcess(3, 2, 1, 2)],
    quantum: 2,
    lesson:
      'P2 is more urgent than P1, so it takes the CPU the instant it arrives. P1 resumes last.',
  },
  rr: {
    processes: [demoProcess(1, 0, 5, 1), demoProcess(2, 0, 3, 1), demoProcess(3, 1, 2, 1)],
    quantum: 2,
    lesson:
      'Each process runs for at most 2 time units, then goes to the back of the line if it is not done.',
  },
};
