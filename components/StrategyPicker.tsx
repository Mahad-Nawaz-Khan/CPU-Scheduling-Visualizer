'use client';

import { Lightbulb } from 'lucide-react';
import {
  ALGORITHM_META,
  ALGORITHM_ORDER,
  BEHAVIOR_TAG_CLASS,
  DEFAULT_QUANTUM,
  MAX_QUANTUM,
  MIN_QUANTUM,
} from '@/lib/constants';
import { clampInteger } from '@/lib/presets';
import type { AlgorithmId } from '@/lib/types';

interface StrategyPickerProps {
  algorithmId: AlgorithmId;
  timeQuantum: number;
  onSelect: (id: AlgorithmId) => void;
  onChangeQuantum: (quantum: number) => void;
}

export function StrategyPicker({
  algorithmId,
  timeQuantum,
  onSelect,
  onChangeQuantum,
}: Readonly<StrategyPickerProps>) {
  const meta = ALGORITHM_META[algorithmId];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <fieldset className="card space-y-1 p-2">
        <legend className="sr-only">Scheduling strategy</legend>
        {ALGORITHM_ORDER.map((id) => {
          const option = ALGORITHM_META[id];
          return (
            <label key={id} htmlFor={`strategy-${id}`} className="strategy-option">
              <input
                id={`strategy-${id}`}
                type="radio"
                name="strategy"
                value={id}
                checked={id === algorithmId}
                onChange={() => onSelect(id)}
                className="mt-1 h-4 w-4 shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-medium">{option.name}</span>
                  <span className={BEHAVIOR_TAG_CLASS[option.behaviorLabel]}>
                    {option.behaviorLabel}
                  </span>
                </span>
                <span className="mt-0.5 block text-sm text-muted">{option.oneLiner}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <aside className="card flex flex-col gap-5 p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Selected strategy</p>
          <h3 className="mt-1 text-lg font-semibold">{meta.name}</h3>
          <p className="mt-0.5 text-xs text-muted">
            Textbook name: {meta.shortName} · {meta.badgeLabel}
          </p>
        </div>

        <div className="card-muted flex gap-3 p-4">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-secondary">
            <span className="font-medium text-strong">Everyday analogy: </span>
            {meta.analogy}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-medium">How it decides</h4>
          <p className="mt-1 text-sm leading-relaxed text-secondary">{meta.howItDecides}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium">When there&apos;s a tie</h4>
          <p className="mt-1 text-sm leading-relaxed text-secondary">{meta.tieBreakRule}</p>
        </div>

        {algorithmId === 'rr' && (
          <div className="flex items-center justify-between gap-4 border-t pt-5">
            <div>
              <label htmlFor="time-quantum" className="text-sm font-medium">
                Time slice (quantum)
              </label>
              <p className="text-xs text-muted">How long each process may run per turn</p>
            </div>
            <input
              id="time-quantum"
              name="time-quantum"
              type="number"
              min={MIN_QUANTUM}
              max={MAX_QUANTUM}
              value={timeQuantum}
              onChange={(event) =>
                onChangeQuantum(
                  clampInteger(
                    Number.parseInt(event.target.value, 10),
                    MIN_QUANTUM,
                    MAX_QUANTUM,
                    DEFAULT_QUANTUM,
                  ),
                )
              }
              className="input w-20 tabular-nums"
            />
          </div>
        )}
      </aside>
    </div>
  );
}
