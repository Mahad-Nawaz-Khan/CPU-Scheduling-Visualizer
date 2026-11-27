'use client';

import {
  ALGORITHM_META,
  ALGORITHM_ORDER,
  ALGORITHM_PILL_LABEL,
  BEHAVIOR_TAG_CLASS,
  DEFAULT_QUANTUM,
  MAX_QUANTUM,
  MIN_QUANTUM,
} from '@/lib/constants';
import { clampInteger } from '@/lib/presets';
import type { AlgorithmId } from '@/lib/types';
import { Disclosure } from './Disclosure';
import { PolicyMicroDiagram } from './PolicyMicroDiagram';

interface StrategyPickerProps {
  algorithmId: AlgorithmId;
  timeQuantum: number;
  onSelect: (id: AlgorithmId) => void;
  onChangeQuantum: (quantum: number) => void;
}

const POLICY_CODE: Record<AlgorithmId, string> = {
  fcfs: 'FCFS',
  sjf: 'SJF',
  srtf: 'SRTF',
  'priority-np': 'PRI',
  'priority-p': 'PRI+',
  rr: 'RR',
};

interface RuleNoteProps {
  label: string;
  body: string;
  subnote?: string;
}

function RuleNote({ label, body, subnote }: Readonly<RuleNoteProps>) {
  return (
    <div className="space-y-1.5">
      <dt className="eyebrow">{label}</dt>
      <dd className="text-[0.95rem] leading-relaxed text-secondary">
        {body}
        {subnote && <span className="mt-2 block text-sm text-muted">{subnote}</span>}
      </dd>
    </div>
  );
}

export function StrategyPicker({
  algorithmId,
  timeQuantum,
  onSelect,
  onChangeQuantum,
}: Readonly<StrategyPickerProps>) {
  const meta = ALGORITHM_META[algorithmId];

  return (
    <div className="flex h-full flex-col justify-between gap-6">
      <fieldset>
        <legend className="coord-tag mb-4">
          <span style={{ color: 'var(--accent)' }}>[ 01 ]</span>
          <span>Scheduler Policy</span>
        </legend>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {ALGORITHM_ORDER.map((id) => (
            <label key={id} htmlFor={`strategy-${id}`} className="policy-tile">
              <input
                id={`strategy-${id}`}
                type="radio"
                name="strategy"
                value={id}
                checked={id === algorithmId}
                onChange={() => onSelect(id)}
              />
              <span className="truncate">{ALGORITHM_PILL_LABEL[id]}</span>
              <span className="font-mono-num shrink-0 text-[0.72rem] opacity-70">
                {POLICY_CODE[id]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="section-display">{meta.name}</h2>
              <span className={BEHAVIOR_TAG_CLASS[meta.behaviorLabel]}>{meta.behaviorLabel}</span>
            </div>
            <p className="max-w-[54ch] text-[1rem] text-secondary">{meta.oneLiner}</p>
          </div>

          {algorithmId === 'rr' && (
            <div className="flex items-center gap-3">
              <label htmlFor="time-quantum" className="text-sm font-medium text-secondary">
                Time slice
              </label>
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
                className="input font-mono-num w-20 text-center"
              />
            </div>
          )}
        </div>

        <PolicyMicroDiagram algorithmId={algorithmId} />

        <Disclosure
          code="INFO"
          title="How this rule works"
          hint={`Analogy, exact tie-breaking, and trade-offs · Textbook: ${meta.shortName}`}
        >
          <dl className="grid gap-6 pt-2 md:grid-cols-3">
            <RuleNote label="Everyday analogy" body={meta.analogy} />
            <RuleNote
              label="Decision & ties"
              body={meta.howItDecides}
              subnote={meta.tieBreakRule}
            />
            <RuleNote
              label="Trade-offs"
              body={`Strength: ${meta.goodAt}`}
              subnote={`Watch out: ${meta.watchOut}`}
            />
          </dl>
        </Disclosure>
      </div>
    </div>
  );
}
