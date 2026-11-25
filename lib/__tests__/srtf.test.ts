import { describe, expect, it } from 'vitest';
import { runSRTF } from '../algorithms/srtf';
import { PRESET_SCENARIOS } from '../presets';
import type { ProcessInput } from '../types';

describe('SRTF (Preemptive) Scheduling Algorithm', () => {
  it('preempts when a newly arrived process has strictly shorter remaining burst', () => {
    const defaultProcesses = PRESET_SCENARIOS[0].processes;
    const result = runSRTF(defaultProcesses);

    expect(
      result.timeline.map((segment) => ({
        id: segment.processId,
        start: segment.startTime,
        end: segment.endTime,
        preempted: segment.preemptedAtEnd,
      })),
    ).toEqual([
      { id: 'P1', start: 0, end: 1, preempted: true },
      { id: 'P2', start: 1, end: 2, preempted: true },
      { id: 'P3', start: 2, end: 3, preempted: false },
      { id: 'P2', start: 3, end: 5, preempted: false },
      { id: 'P1', start: 5, end: 9, preempted: false },
    ]);

    expect(result.summary.preemptionCount).toBe(2);
    expect(result.summary.averageWaitingTime).toBe(1.67);
    expect(result.summary.averageTurnaroundTime).toBe(4.67);
  });

  it('does NOT preempt on remaining burst ties', () => {
    const processes: ProcessInput[] = [
      { id: 'P1', pidOrder: 1, arrivalTime: 0, burstTime: 4, priority: 1, colorIndex: 0 },
      { id: 'P2', pidOrder: 2, arrivalTime: 2, burstTime: 2, priority: 1, colorIndex: 1 },
    ];
    const result = runSRTF(processes);

    expect(
      result.timeline.map((segment) => ({
        id: segment.processId,
        start: segment.startTime,
        end: segment.endTime,
      })),
    ).toEqual([
      { id: 'P1', start: 0, end: 4 },
      { id: 'P2', start: 4, end: 6 },
    ]);
    expect(result.summary.preemptionCount).toBe(0);
  });

  it('handles CPU idle gaps cleanly', () => {
    const idlePreset = PRESET_SCENARIOS[2].processes;
    const result = runSRTF(idlePreset);

    expect(result.summary.totalIdleTime).toBe(4);
    expect(result.summary.makespan).toBe(13);
  });
});
