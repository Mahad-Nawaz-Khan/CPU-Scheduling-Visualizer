import { describe, expect, it } from 'vitest';
import { runFCFS } from '../algorithms/fcfs';
import { PRESET_SCENARIOS } from '../presets';
import type { ProcessInput } from '../types';

describe('FCFS Scheduling Algorithm', () => {
  it('matches textbook default sample metrics and timeline', () => {
    const defaultProcesses = PRESET_SCENARIOS[0].processes;
    const result = runFCFS(defaultProcesses);

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

    expect(result.processMetrics).toMatchObject([
      { id: 'P1', completionTime: 5, turnaroundTime: 5, waitingTime: 0, responseTime: 0 },
      { id: 'P2', completionTime: 8, turnaroundTime: 7, waitingTime: 4, responseTime: 4 },
      { id: 'P3', completionTime: 9, turnaroundTime: 7, waitingTime: 6, responseTime: 6 },
    ]);

    expect(result.summary.averageWaitingTime).toBe(3.33);
    expect(result.summary.averageTurnaroundTime).toBe(6.33);
    expect(result.summary.totalIdleTime).toBe(0);
    expect(result.ticks).toHaveLength(10);
  });

  it('produces IDLE segments when CPU has no ready processes', () => {
    const idleProcesses: ProcessInput[] = [
      { id: 'P1', pidOrder: 1, arrivalTime: 2, burstTime: 3, priority: 2, colorIndex: 0 },
      { id: 'P2', pidOrder: 2, arrivalTime: 7, burstTime: 2, priority: 1, colorIndex: 1 },
    ];
    const result = runFCFS(idleProcesses);

    expect(
      result.timeline.map((segment) => ({
        id: segment.processId,
        start: segment.startTime,
        end: segment.endTime,
      })),
    ).toEqual([
      { id: null, start: 0, end: 2 },
      { id: 'P1', start: 2, end: 5 },
      { id: null, start: 5, end: 7 },
      { id: 'P2', start: 7, end: 9 },
    ]);

    expect(result.summary.totalIdleTime).toBe(4);
    expect(result.summary.makespan).toBe(9);
    expect(result.summary.cpuUtilization).toBe(55.56);
  });

  it('breaks simultaneous arrival ties using pidOrder', () => {
    const tiedProcesses: ProcessInput[] = [
      { id: 'P3', pidOrder: 3, arrivalTime: 0, burstTime: 2, priority: 1, colorIndex: 2 },
      { id: 'P1', pidOrder: 1, arrivalTime: 0, burstTime: 3, priority: 2, colorIndex: 0 },
      { id: 'P2', pidOrder: 2, arrivalTime: 0, burstTime: 1, priority: 3, colorIndex: 1 },
    ];
    const result = runFCFS(tiedProcesses);

    expect(result.timeline.map((segment) => segment.processId)).toEqual(['P1', 'P2', 'P3']);
  });

  it('handles empty process list gracefully', () => {
    const result = runFCFS([]);
    expect(result.timeline).toEqual([]);
    expect(result.ticks).toEqual([]);
    expect(result.summary.makespan).toBe(0);
  });
});
