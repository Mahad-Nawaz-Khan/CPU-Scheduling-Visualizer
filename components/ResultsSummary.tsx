'use client';

import { ArrowRight, Download } from 'lucide-react';
import { ALGORITHM_META, getProcessColor } from '@/lib/constants';
import { pluralize } from '@/lib/format';
import type { AlgorithmId, SimulationResult } from '@/lib/types';
import { AnimatedNumber } from './AnimatedNumber';
import { Disclosure } from './Disclosure';

type AverageKey = 'averageWaitingTime' | 'averageTurnaroundTime' | 'averageResponseTime';

const STATS: Array<{ code: string; key: AverageKey; label: string; description: string }> = [
  {
    code: '03.A',
    key: 'averageWaitingTime',
    label: 'Average wait',
    description: 'Time processes spent waiting in the ready line',
  },
  {
    code: '03.B',
    key: 'averageTurnaroundTime',
    label: 'Turnaround',
    description: 'Total elapsed time from arrival to completion',
  },
  {
    code: '03.C',
    key: 'averageResponseTime',
    label: 'First response',
    description: 'Delay before receiving the CPU for the first time',
  },
];

interface ResultsSummaryProps {
  result: SimulationResult;
  comparison: SimulationResult[];
  onSelectOptimal: (id: AlgorithmId) => void;
  onExport: () => void;
}

function formatComparisonDelta(current: number, baseline: number): string | null {
  if (baseline <= 0 || current === baseline) {
    return null;
  }
  const pct = Math.round(((current - baseline) / baseline) * 100);
  if (pct < 0) {
    return `${Math.abs(pct)}% FASTER VS FCFS`;
  }
  return `+${pct}% VS FCFS`;
}

export function ResultsSummary({
  result,
  comparison,
  onSelectOptimal,
  onExport,
}: Readonly<ResultsSummaryProps>) {
  const { summary, processMetrics } = result;
  const fcfsResult = comparison.find((item) => item.algorithmId === 'fcfs');
  const optimalResult = [...comparison].sort(
    (a, b) => a.summary.averageWaitingTime - b.summary.averageWaitingTime,
  )[0];

  const isOptimalWait =
    optimalResult !== undefined &&
    summary.averageWaitingTime <= optimalResult.summary.averageWaitingTime;

  const waitDelta = fcfsResult
    ? formatComparisonDelta(summary.averageWaitingTime, fcfsResult.summary.averageWaitingTime)
    : null;
  const responseDelta = fcfsResult
    ? formatComparisonDelta(summary.averageResponseTime, fcfsResult.summary.averageResponseTime)
    : null;

  const deltaByKey: Partial<Record<AverageKey, string | null>> = {
    averageWaitingTime: isOptimalWait ? '★ OPTIMAL WAIT' : waitDelta,
    averageResponseTime: responseDelta,
  };

  const maxByKey: Record<AverageKey, number> = {
    averageWaitingTime: Math.max(
      0.01,
      ...comparison.map((item) => item.summary.averageWaitingTime),
    ),
    averageTurnaroundTime: Math.max(
      0.01,
      ...comparison.map((item) => item.summary.averageTurnaroundTime),
    ),
    averageResponseTime: Math.max(
      0.01,
      ...comparison.map((item) => item.summary.averageResponseTime),
    ),
  };

  return (
    <section aria-labelledby="results-title" className="w-full">
      <h2 id="results-title" className="sr-only">
        Performance telemetry and per-process results
      </h2>

      <div className="grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        {STATS.map((stat) => {
          const badgeText = deltaByKey[stat.key];
          const isPositive =
            badgeText === '★ OPTIMAL WAIT' || (badgeText?.includes('FASTER') ?? false);
          const ratioPct = Math.max((summary[stat.key] / maxByKey[stat.key]) * 100, 6);

          return (
            <div key={stat.key} className="px-5 py-8 sm:px-8 lg:px-10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="coord-tag">
                  <span style={{ color: 'var(--accent)' }}>[ {stat.code} ]</span>
                  <span>{stat.label}</span>
                </p>
                {badgeText && (
                  <span className={isPositive ? 'tag tag-green' : 'tag tag-amber'}>
                    {badgeText}
                  </span>
                )}
              </div>

              <p className="mt-4 flex items-baseline gap-2.5">
                <output className="metric-numeral">
                  <AnimatedNumber value={summary[stat.key]} decimals={2} />
                </output>
                <span className="font-mono-num text-xs text-muted">units</span>
              </p>

              <div
                aria-hidden="true"
                className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: 'var(--surface-muted)' }}
              >
                <div
                  className="ratio-bar-fill h-full rounded-full"
                  style={{
                    width: `${ratioPct}%`,
                    backgroundColor: isPositive ? 'var(--green-text)' : 'var(--accent)',
                  }}
                />
              </div>

              <p className="mt-2.5 text-sm leading-relaxed text-secondary">{stat.description}</p>
            </div>
          );
        })}

        <div className="px-5 py-8 sm:px-8 lg:px-10">
          <p className="coord-tag">
            <span style={{ color: 'var(--accent)' }}>[ 03.D ]</span>
            <span>Core efficiency</span>
          </p>
          <p className="mt-4 flex items-baseline gap-2.5">
            <output className="metric-numeral">
              <AnimatedNumber value={Math.round(summary.cpuUtilization)} decimals={0} suffix="%" />
            </output>
            <span className="font-mono-num text-xs text-muted">busy</span>
          </p>
          <div
            aria-hidden="true"
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: 'var(--surface-muted)' }}
          >
            <div
              className="ratio-bar-fill h-full rounded-full"
              style={{
                width: `${Math.max(summary.cpuUtilization, 4)}%`,
                backgroundColor: 'var(--green-text)',
              }}
            />
          </div>
          <p className="font-mono-num mt-2.5 text-xs text-secondary">
            MAKESPAN: {summary.makespan} ·{' '}
            {pluralize(summary.preemptionCount, 'interrupt', 'interrupts').toUpperCase()} ·
            SWITCHES: {summary.contextSwitches}
          </p>
          {!isOptimalWait && optimalResult && (
            <button
              type="button"
              onClick={() => onSelectOptimal(optimalResult.algorithmId)}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              <span>
                Try {ALGORITHM_META[optimalResult.algorithmId].shortName} (
                {optimalResult.summary.averageWaitingTime.toFixed(2)} wait)
              </span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <Disclosure
        variant="panel"
        code="TABLE"
        title="Per-process metrics table, formulas & CSV export"
        hint="Exact arrival, burst, completion, turnaround, waiting, and response times for every process"
      >
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
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
                <tbody className="font-mono-num">
                  {processMetrics.map((metric) => (
                    <tr key={metric.id}>
                      <td>
                        <span className="inline-flex items-center gap-2.5 font-medium">
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
                <tfoot className="font-mono-num">
                  <tr>
                    <td colSpan={6} className="font-sans">
                      Average
                    </td>
                    <td>{summary.averageTurnaroundTime.toFixed(2)}</td>
                    <td>{summary.averageWaitingTime.toFixed(2)}</td>
                    <td>{summary.averageResponseTime.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-mono-num text-xs text-muted">
              TAT = CT − AT · WT = TAT − BT · RT = First run − AT
            </p>
            <button type="button" className="btn" onClick={onExport}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Download CSV
            </button>
          </div>
        </div>
      </Disclosure>
    </section>
  );
}
