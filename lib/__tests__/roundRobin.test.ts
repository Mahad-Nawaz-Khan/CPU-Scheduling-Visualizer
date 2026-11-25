import { describe, expect, it } from 'vitest';
import { runFCFS } from '../algorithms/fcfs';
import { runRoundRobin } from '../algorithms/roundRobin';
import { PRESET_SCENARIOS } from '../presets';
import type { ProcessInput } from '../types';

describe('Round Robin Scheduling Algorithm', () => {
  it('executes default sample with Time Quantum = 2 accurately', () => {
    const defaultProcesses = PRESET_SCENARIOS[0].processes;
    const result = runRoundRobin(defaultProcesses, 2);

    expect(
      result.timeline.map((segment) => ({
        id: segment.processId,
        start: segment.startTime,
        end: segment.endTime,
      })),
    ).toEqual([
      { id: 'P1', start: 0, end: 2 },
      { id: 'P2', start: 2, end: 4 },
      { id: 'P3', start: 4, end: 5 },
      { id: 'P1', start: 5, end: 7 },
      { id: 'P2', start: 7, end: 8 },
      { id: 'P1', start: 8, end: 9 },
    ]);

    expect(result.processMetrics).toMatchObject([
      { id: 'P1', completionTime: 9, turnaroundTime: 9, waitingTime: 4, responseTime: 0 },
      { id: 'P2', completionTime: 8, turnaroundTime: 7, waitingTime: 4, responseTime: 1 },
      { id: 'P3', completionTime: 5, turnaroundTime: 3, waitingTime: 2, responseTime: 2 },
    ]);
  });

  it('enqueues new arrivals at quantum boundary BEFORE re-queuing preempted process', () => {
    const processes: ProcessInput[] = [
      { id: 'P1', pidOrder: 1, arrivalTime: 0, burstTime: 4, priority: 1, colorIndex: 0 },
      { id: 'P2', pidOrder: 2, arrivalTime: 2, burstTime: 2, priority: 1, colorIndex: 1 },
    ];
    const result = runRoundRobin(processes, 2);

    expect(
      result.timeline.map((segment) => ({
        id: segment.processId,
        start: segment.startTime,
        end: segment.endTime,
      })),
    ).toEqual([
      { id: 'P1', start: 0, end: 2 },
      { id: 'P2', start: 2, end: 4 },
      { id: 'P1', start: 4, end: 6 },
    ]);
  });

  it('merges contiguous lone process slices while logging quantum check', () => {
    const processes: ProcessInput[] = [
      { id: 'P1', pidOrder: 1, arrivalTime: 0, burstTime: 5, priority: 1, colorIndex: 0 },
    ];
    const result = runRoundRobin(processes, 2);

    expect(result.timeline).toHaveLength(1);
    expect(result.timeline[0]).toMatchObject({
      processId: 'P1',
      startTime: 0,
      endTime: 5,
      duration: 5,
      completedAtEnd: true,
    });

    const quantumChecks = result.ticks
      .flatMap((tick) => tick.events)
      .filter((event) => event.type === 'quantum');
    expect(quantumChecks).toHaveLength(2);
  });

  it('matches FCFS order when Time Quantum exceeds maximum burst time', () => {
    const defaultProcesses = PRESET_SCENARIOS[0].processes;
    const rrLarge = runRoundRobin(defaultProcesses, 20);
    const fcfs = runFCFS(defaultProcesses);

    expect(
      rrLarge.timeline.map((segment) => ({
        id: segment.processId,
        start: segment.startTime,
        end: segment.endTime,
      })),
    ).toEqual(
      fcfs.timeline.map((segment) => ({
        id: segment.processId,
        start: segment.startTime,
        end: segment.endTime,
      })),
    );
  });
});
