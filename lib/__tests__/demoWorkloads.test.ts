import { describe, expect, it } from 'vitest';
import { ALGORITHM_RUNNERS } from '../algorithms';
import { DEMO_WORKLOADS } from '../demoWorkloads';
import type { AlgorithmId } from '../types';

function runDemo(id: AlgorithmId) {
  const demo = DEMO_WORKLOADS[id];
  return ALGORITHM_RUNNERS[id](demo.processes, demo.quantum);
}

function order(id: AlgorithmId): Array<string | null> {
  return runDemo(id).timeline.map((segment) => segment.processId);
}

describe('Policy demo workloads illustrate their scheduling rule', () => {
  it('FCFS demo keeps short jobs stuck behind the long first arrival', () => {
    expect(order('fcfs')).toEqual(['P1', 'P2', 'P3']);
    expect(runDemo('fcfs').summary.preemptionCount).toBe(0);
  });

  it('SJF demo lets the late but shortest job jump ahead without interrupting', () => {
    expect(order('sjf')).toEqual(['P1', 'P3', 'P2']);
    expect(runDemo('sjf').summary.preemptionCount).toBe(0);
  });

  it('SRTF demo shows a shorter arrival kicking the running job out', () => {
    const result = runDemo('srtf');
    expect(order('srtf')).toEqual(['P1', 'P2', 'P3', 'P1']);
    expect(result.summary.preemptionCount).toBe(1);
    expect(result.ticks[1].runningProcessId).toBe('P2');
    expect(result.ticks[1].readyQueueIds).toContain('P1');
  });

  it('Priority (no interruptions) demo reorders the queue but never preempts', () => {
    expect(order('priority-np')).toEqual(['P1', 'P3', 'P2']);
    expect(runDemo('priority-np').summary.preemptionCount).toBe(0);
  });

  it('Priority (with interruptions) demo lets the urgent arrival take the CPU at once', () => {
    const result = runDemo('priority-p');
    expect(order('priority-p')).toEqual(['P1', 'P2', 'P3', 'P1']);
    expect(result.ticks[1].runningProcessId).toBe('P2');
  });

  it('Round Robin demo rotates jobs every time slice', () => {
    const result = runDemo('rr');
    expect(order('rr')).toEqual(['P1', 'P2', 'P3', 'P1', 'P2', 'P1']);
    expect(result.ticks[2].runningProcessId).toBe('P2');
    expect(result.ticks[2].readyQueueIds.at(-1)).toBe('P1');
  });
});
