import { describe, expect, it } from 'vitest';
import { runSJF } from '../algorithms/sjf';
import { PRESET_SCENARIOS } from '../presets';
import type { ProcessInput } from '../types';

describe('SJF (Non-Preemptive) Scheduling Algorithm', () => {
  it('selects shortest ready job without preempting running P1 on default sample', () => {
    const defaultProcesses = PRESET_SCENARIOS[0].processes;
    const result = runSJF(defaultProcesses);

    expect(
      result.timeline.map((segment) => ({
        id: segment.processId,
        start: segment.startTime,
        end: segment.endTime,
      })),
    ).toEqual([
      { id: 'P1', start: 0, end: 5 },
      { id: 'P3', start: 5, end: 6 },
      { id: 'P2', start: 6, end: 9 },
    ]);

    expect(result.summary.preemptionCount).toBe(0);
    expect(result.summary.averageWaitingTime).toBe(2.67);
    expect(result.summary.averageTurnaroundTime).toBe(5.67);
  });

  it('never executes processes before their arrival time', () => {
    const processes: ProcessInput[] = [
      { id: 'P1', pidOrder: 1, arrivalTime: 0, burstTime: 6, priority: 1, colorIndex: 0 },
      { id: 'P2', pidOrder: 2, arrivalTime: 4, burstTime: 1, priority: 1, colorIndex: 1 },
      { id: 'P3', pidOrder: 3, arrivalTime: 8, burstTime: 2, priority: 1, colorIndex: 2 },
    ];
    const result = runSJF(processes);

    expect(
      result.timeline.map((segment) => ({
        id: segment.processId,
        start: segment.startTime,
        end: segment.endTime,
      })),
    ).toEqual([
      { id: 'P1', start: 0, end: 6 },
      { id: 'P2', start: 6, end: 7 },
      { id: null, start: 7, end: 8 },
      { id: 'P3', start: 8, end: 10 },
    ]);
  });

  it('breaks equal burst time ties by earliest arrival then pidOrder', () => {
    const processes: ProcessInput[] = [
      { id: 'P1', pidOrder: 1, arrivalTime: 0, burstTime: 5, priority: 1, colorIndex: 0 },
      { id: 'P2', pidOrder: 2, arrivalTime: 2, burstTime: 3, priority: 1, colorIndex: 1 },
      { id: 'P3', pidOrder: 3, arrivalTime: 1, burstTime: 3, priority: 1, colorIndex: 2 },
      { id: 'P4', pidOrder: 4, arrivalTime: 1, burstTime: 3, priority: 1, colorIndex: 3 },
    ];
    const result = runSJF(processes);

    expect(result.timeline.map((segment) => segment.processId)).toEqual([
      'P1',
      'P3',
      'P4',
      'P2',
    ]);
  });
});
