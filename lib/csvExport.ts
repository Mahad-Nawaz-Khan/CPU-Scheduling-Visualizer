import { ALGORITHM_META } from './constants';
import type { SimulationResult } from './types';

function escapeCsvCell(value: string | number): string {
  const text = String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function triggerCsvDownload(filename: string, rows: Array<Array<string | number>>): void {
  const csvBody = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
  const blob = new Blob([csvBody], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportSingleSimulationCsv(result: SimulationResult): void {
  const meta = ALGORITHM_META[result.algorithmId];
  const quantumLabel =
    result.algorithmId === 'rr' && result.timeQuantum !== undefined
      ? ` (Q=${result.timeQuantum})`
      : '';

  const rows: Array<Array<string | number>> = [
    ['CPU Scheduling Visualizer - Simulation Export'],
    ['Algorithm', `${meta.name}${quantumLabel}`, 'Type', meta.badgeLabel],
    [],
    ['Process Metrics'],
    ['PID', 'Arrival Time', 'Burst Time', 'Priority', 'First Start', 'Completion Time (CT)', 'Turnaround Time (TAT)', 'Waiting Time (WT)', 'Response Time (RT)', 'Preemptions'],
  ];

  for (const metric of result.processMetrics) {
    rows.push([
      metric.id,
      metric.arrivalTime,
      metric.burstTime,
      metric.priority,
      metric.firstStartTime,
      metric.completionTime,
      metric.turnaroundTime,
      metric.waitingTime,
      metric.responseTime,
      metric.preemptions,
    ]);
  }

  rows.push([]);
  rows.push(['Summary Metrics']);
  rows.push(['Total Processes', result.summary.totalProcesses]);
  rows.push(['Total Burst Time', result.summary.totalBurstTime]);
  rows.push(['Makespan', result.summary.makespan]);
  rows.push(['Total Idle Time', result.summary.totalIdleTime]);
  rows.push(['CPU Utilization (%)', result.summary.cpuUtilization]);
  rows.push(['Throughput (proc/tick)', result.summary.throughput]);
  rows.push(['Preemptions', result.summary.preemptionCount]);
  rows.push(['Context Switches', result.summary.contextSwitches]);
  rows.push(['Average Waiting Time', result.summary.averageWaitingTime]);
  rows.push(['Average Turnaround Time', result.summary.averageTurnaroundTime]);
  rows.push(['Average Response Time', result.summary.averageResponseTime]);

  rows.push([]);
  rows.push(['Gantt Timeline Segments']);
  rows.push(['Process', 'Start Time', 'End Time', 'Duration', 'Preempted At End', 'Completed At End', 'Reason']);
  for (const segment of result.timeline) {
    rows.push([
      segment.processId ?? 'IDLE',
      segment.startTime,
      segment.endTime,
      segment.duration,
      segment.preemptedAtEnd ? 'Yes' : 'No',
      segment.completedAtEnd ? 'Yes' : 'No',
      segment.reason,
    ]);
  }

  triggerCsvDownload(`cpu-schedule-${result.algorithmId}.csv`, rows);
}

export function exportComparisonCsv(
  results: SimulationResult[],
  timeQuantum: number,
): void {
  const rows: Array<Array<string | number>> = [
    ['CPU Scheduling Visualizer - 6-Algorithm Comparison'],
    ['Round Robin Time Quantum', timeQuantum],
    [],
    [
      'Algorithm',
      'Type',
      'Avg Waiting Time',
      'Avg Turnaround Time',
      'Avg Response Time',
      'CPU Utilization (%)',
      'Throughput',
      'Makespan',
      'Idle Time',
      'Preemptions',
      'Context Switches',
    ],
  ];

  for (const result of results) {
    const meta = ALGORITHM_META[result.algorithmId];
    const nameWithQuantum =
      result.algorithmId === 'rr' ? `${meta.shortName} (Q=${timeQuantum})` : meta.shortName;

    rows.push([
      nameWithQuantum,
      meta.badgeLabel,
      result.summary.averageWaitingTime,
      result.summary.averageTurnaroundTime,
      result.summary.averageResponseTime,
      result.summary.cpuUtilization,
      result.summary.throughput,
      result.summary.makespan,
      result.summary.totalIdleTime,
      result.summary.preemptionCount,
      result.summary.contextSwitches,
    ]);
  }

  triggerCsvDownload('cpu-scheduling-comparison.csv', rows);
}
