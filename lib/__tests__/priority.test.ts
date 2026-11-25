import { describe, expect, it } from 'vitest';
import { runPriorityNonPreemptive, runPriorityPreemptive } from '../algorithms/priority';
import { PRESET_SCENARIOS } from '../presets';
import type { ProcessInput } from '../types';

describe('Priority Scheduling Algorithms (1 = Highest Priority)', () => {
  it('runs Priority Non-Preemptive without interrupting running process', () => {
    const defaultProcesses = PRESET_SCENARIOS[0].processes;
    const result = runPriorityNonPreemptive(defaultProcesses);

    expect(
      result.timeline.map((segment) => ({
        id: segment.processId,
        start: segment.startTime,
        end: segment.endTime,
      })),
    ).toEqual([
      { id: 'P1', start: 0, end: 5 },
      { id: 'P2', start: 5, end: 8 },
      { id: 'P3', start: 8, end: 9 },
    ]);
    expect(result.summary.preemptionCount).toBe(0);
  });

  it('runs Priority Preemptive and interrupts when smaller priority number arrives', () => {
    const defaultProcesses = PRESET_SCENARIOS[0].processes;
    const result = runPriorityPreemptive(defaultProcesses);

    expect(
      result.timeline.map((segment) => ({
        id: segment.processId,
        start: segment.startTime,
        end: segment.endTime,
        preempted: segment.preemptedAtEnd,
      })),
    ).toEqual([
      { id: 'P1', start: 0, end: 1, preempted: true },
      { id: 'P2', start: 1, end: 4, preempted: false },
      { id: 'P1', start: 4, end: 8, preempted: false },
      { id: 'P3', start: 8, end: 9, preempted: false },
    ]);

    expect(result.summary.preemptionCount).toBe(1);
    expect(result.processMetrics).toMatchObject([
      { id: 'P1', completionTime: 8, waitingTime: 3, responseTime: 0 },
      { id: 'P2', completionTime: 4, waitingTime: 0, responseTime: 0 },
      { id: 'P3', completionTime: 9, waitingTime: 6, responseTime: 6 },
    ]);
  });

  it('does NOT preempt on equal priority and breaks ready ties by arrival then PID', () => {
    const processes: ProcessInput[] = [
      { id: 'P1', pidOrder: 1, arrivalTime: 0, burstTime: 4, priority: 2, colorIndex: 0 },
      { id: 'P2', pidOrder: 2, arrivalTime: 1, burstTime: 2, priority: 2, colorIndex: 1 },
      { id: 'P3', pidOrder: 3, arrivalTime: 2, burstTime: 2, priority: 2, colorIndex: 2 },
    ];
    const result = runPriorityPreemptive(processes);

    expect(result.timeline.map((segment) => segment.processId)).toEqual(['P1', 'P2', 'P3']);
    expect(result.summary.preemptionCount).toBe(0);
  });
});
