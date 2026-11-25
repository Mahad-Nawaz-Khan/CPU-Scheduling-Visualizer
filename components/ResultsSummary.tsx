'use client';

import { ChevronDown, Download } from 'lucide-react';
import { getProcessColor } from '@/lib/constants';
import { pluralize } from '@/lib/format';
import type { SimulationResult } from '@/lib/types';

type AverageKey = 'averageWaitingTime' | 'averageTurnaroundTime' | 'averageResponseTime';

const METRICS: Array<{ key: AverageKey; label: string; description: string }> = [
  {
    key: 'averageWaitingTime',
    label: 'Average waiting time',
    description: 'How long a process sat in line instead of running.',
  },
  {
    key: 'averageTurnaroundTime',
    label: 'Average turnaround time',
    description: 'The total time from arriving to finishing.',
  },
  {
    key: 'averageResponseTime',
    label: 'Average response time',
    description: 'How long until a process got the CPU for the first time.',
  },
];

interface ResultsSummaryProps {
  result: SimulationResult;
  onExport: () => void;
}

export function ResultsSummary({ result, onExport }: Readonly<ResultsSummaryProps>) {
  const { summary, processMetrics } = result;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {METRICS.map((metric) => (
          <div key={metric.key} className="card p-5">
            <p className="text-sm font-medium text-secondary">{metric.label}</p>
            <p className="mt-2 flex items-baseline gap-1.5">
              <output className="text-3xl font-semibold tracking-tight tabular-nums">
                {summary[metric.key].toFixed(2)}
              </output>
              <span className="text-sm text-muted">time units</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{metric.description}</p>
          </div>
        ))}
      </div>

      <div className="card-muted flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 text-sm text-secondary">
        <span>
          Everything finished at time <strong className="text-strong">{summary.makespan}</strong>
        </span>
        <span>
          CPU busy <strong className="text-strong">{Math.round(summary.cpuUtilization)}%</strong> of
          the time
        </span>
        <span>
          <strong className="text-strong">
            {pluralize(summary.preemptionCount, 'interruption', 'interruptions')}
          </strong>
        </span>
        <span className="text-xs text-muted md:ml-auto">Lower times are better</span>
      </div>

      <details className="card group overflow-hidden">
        <summary className="flex items-center justify-between gap-3 px-5 py-4">
          <span>
            <span className="block text-sm font-medium">See the numbers for each process</span>
            <span className="block text-xs text-muted">
              Completion, turnaround, waiting, and response time per process
            </span>
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="overflow-x-auto border-t">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Process</th>
                <th scope="col">Arrival (AT)</th>
                <th scope="col">Burst (BT)</th>
                <th scope="col">Priority</th>
                <th scope="col">First run</th>
                <th scope="col">Completion (CT)</th>
                <th scope="col">Turnaround (TAT)</th>
                <th scope="col">Waiting (WT)</th>
                <th scope="col">Response (RT)</th>
              </tr>
            </thead>
            <tbody>
              {processMetrics.map((metric) => (
                <tr key={metric.id}>
                  <td>
                    <span className="inline-flex items-center gap-2 font-medium">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: getProcessColor(metric.colorIndex).hex }}
                        aria-hidden="true"
                      />
                      {metric.id}
                    </span>
                  </td>
                  <td>{metric.arrivalTime}</td>
                  <td>{metric.burstTime}</td>
                  <td>{metric.priority}</td>
                  <td>{metric.firstStartTime}</td>
                  <td>{metric.completionTime}</td>
                  <td>{metric.turnaroundTime}</td>
                  <td className="font-semibold">{metric.waitingTime}</td>
                  <td>{metric.responseTime}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6}>Average</td>
                <td>{summary.averageTurnaroundTime.toFixed(2)}</td>
                <td>{summary.averageWaitingTime.toFixed(2)}</td>
                <td>{summary.averageResponseTime.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="border-t px-5 py-3 text-xs leading-relaxed text-muted">
          TAT = CT − AT · WT = TAT − BT · RT = first run − AT
        </p>
      </details>

      <div className="flex justify-end">
        <button type="button" className="btn" onClick={onExport}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Download results (CSV)
        </button>
      </div>
    </div>
  );
}
