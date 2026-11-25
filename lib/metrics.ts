import type { ProcessInput, ProcessMetrics, SummaryMetrics, TimelineSegment } from './types';

function roundTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function countContextSwitches(timeline: TimelineSegment[]): number {
  let switches = 0;
  let lastActiveProcessId: string | null = null;

  for (const segment of timeline) {
    if (segment.processId === null) {
      continue;
    }
    if (lastActiveProcessId !== null && lastActiveProcessId !== segment.processId) {
      switches += 1;
    }
    lastActiveProcessId = segment.processId;
  }

  return switches;
}

export function calculateMetrics(
  processes: ProcessInput[],
  timeline: TimelineSegment[],
): { processMetrics: ProcessMetrics[]; summary: SummaryMetrics } {
  if (processes.length === 0) {
    return {
      processMetrics: [],
      summary: {
        totalProcesses: 0,
        totalBurstTime: 0,
        makespan: 0,
        totalIdleTime: 0,
        cpuUtilization: 0,
        throughput: 0,
        preemptionCount: 0,
        contextSwitches: 0,
        averageWaitingTime: 0,
        averageTurnaroundTime: 0,
        averageResponseTime: 0,
      },
    };
  }

  const firstStartMap = new Map<string, number>();
  const completionMap = new Map<string, number>();
  const preemptionMap = new Map<string, number>();

  let totalIdleTime = 0;
  let totalPreemptions = 0;

  for (const segment of timeline) {
    if (segment.processId === null) {
      totalIdleTime += segment.duration;
      continue;
    }

    if (!firstStartMap.has(segment.processId)) {
      firstStartMap.set(segment.processId, segment.startTime);
    }

    completionMap.set(segment.processId, segment.endTime);

    if (segment.preemptedAtEnd) {
      const prevPreemptions = preemptionMap.get(segment.processId) ?? 0;
      preemptionMap.set(segment.processId, prevPreemptions + 1);
      totalPreemptions += 1;
    }
  }

  const processMetrics: ProcessMetrics[] = processes.map((process) => {
    const firstStartTime = firstStartMap.get(process.id) ?? process.arrivalTime;
    const completionTime = completionMap.get(process.id) ?? process.arrivalTime;
    const turnaroundTime = completionTime - process.arrivalTime;
    const waitingTime = turnaroundTime - process.burstTime;
    const responseTime = firstStartTime - process.arrivalTime;
    const preemptions = preemptionMap.get(process.id) ?? 0;

    return {
      id: process.id,
      arrivalTime: process.arrivalTime,
      burstTime: process.burstTime,
      priority: process.priority,
      colorIndex: process.colorIndex,
      firstStartTime,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime,
      preemptions,
    };
  });

  const totalProcesses = processes.length;
  const totalBurstTime = processes.reduce((sum, item) => sum + item.burstTime, 0);
  const lastSegment = timeline[timeline.length - 1];
  const makespan = lastSegment ? lastSegment.endTime : 0;

  const sumWT = processMetrics.reduce((sum, item) => sum + item.waitingTime, 0);
  const sumTAT = processMetrics.reduce((sum, item) => sum + item.turnaroundTime, 0);
  const sumRT = processMetrics.reduce((sum, item) => sum + item.responseTime, 0);

  const cpuUtilization = makespan > 0 ? roundTwo((totalBurstTime / makespan) * 100) : 0;
  const throughput = makespan > 0 ? roundTwo(totalProcesses / makespan) : 0;

  return {
    processMetrics,
    summary: {
      totalProcesses,
      totalBurstTime,
      makespan,
      totalIdleTime,
      cpuUtilization,
      throughput,
      preemptionCount: totalPreemptions,
      contextSwitches: countContextSwitches(timeline),
      averageWaitingTime: roundTwo(sumWT / totalProcesses),
      averageTurnaroundTime: roundTwo(sumTAT / totalProcesses),
      averageResponseTime: roundTwo(sumRT / totalProcesses),
    },
  };
}
