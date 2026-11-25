import { describe, expect, it } from 'vitest';
import { runAllAlgorithms } from '../algorithms';
import { calculateMetrics } from '../metrics';
import { PRESET_SCENARIOS } from '../presets';
import type { TimelineSegment } from '../types';

describe('Metrics Calculation & Cross-Algorithm Consistency', () => {
  it('computes TAT, WT, RT, CPU Utilization, and Throughput accurately', () => {
    const processes = PRESET_SCENARIOS[0].processes;
    const timeline: TimelineSegment[] = [
      {
        processId: 'P1',
        startTime: 0,
        endTime: 5,
        duration: 5,
        preemptedAtEnd: false,
        completedAtEnd: true,
        reason: 'test',
      },
      {
        processId: 'P2',
        startTime: 5,
        endTime: 8,
        duration: 3,
        preemptedAtEnd: false,
        completedAtEnd: true,
        reason: 'test',
      },
      {
        processId: 'P3',
        startTime: 8,
        endTime: 9,
        duration: 1,
        preemptedAtEnd: false,
        completedAtEnd: true,
        reason: 'test',
      },
    ];

    const { processMetrics, summary } = calculateMetrics(processes, timeline);

    for (const metric of processMetrics) {
      expect(metric.turnaroundTime).toBe(metric.completionTime - metric.arrivalTime);
      expect(metric.waitingTime).toBe(metric.turnaroundTime - metric.burstTime);
      expect(metric.responseTime).toBe(metric.firstStartTime - metric.arrivalTime);
    }

    expect(summary.totalBurstTime).toBe(9);
    expect(summary.cpuUtilization).toBe(100);
    expect(summary.throughput).toBe(0.33);
    expect(summary.contextSwitches).toBe(2);
  });

  it('satisfies OS mathematical invariants across all 6 algorithms', () => {
    for (const preset of PRESET_SCENARIOS) {
      const results = runAllAlgorithms(preset.processes, 2);
      expect(results).toHaveLength(6);

      for (const result of results) {
        expect(result.summary.totalProcesses).toBe(preset.processes.length);
        expect(result.summary.totalBurstTime + result.summary.totalIdleTime).toBe(
          result.summary.makespan,
        );
        expect(result.ticks).toHaveLength(result.summary.makespan + 1);

        for (const metric of result.processMetrics) {
          expect(metric.turnaroundTime).toBe(metric.completionTime - metric.arrivalTime);
          expect(metric.waitingTime).toBe(metric.turnaroundTime - metric.burstTime);
          expect(metric.responseTime).toBeGreaterThanOrEqual(0);
          expect(metric.waitingTime).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});
