'use client';

import { ArrowUpRight } from 'lucide-react';
import { ALGORITHM_META, ALGORITHM_ORDER, BEHAVIOR_TAG_CLASS } from '@/lib/constants';
import { GLOSSARY_TERMS } from '@/lib/glossary';
import { PRESET_SCENARIOS } from '@/lib/presets';
import type { AlgorithmId } from '@/lib/types';
import { Disclosure } from './Disclosure';
import { PolicyMicroDiagram } from './PolicyMicroDiagram';

interface LearnViewProps {
  onTryScenario: (presetId: string, algorithmId: AlgorithmId) => void;
}

const FORMULAS = [
  {
    name: 'Turnaround time',
    formula: 'TAT = CT − AT',
    meaning: 'Completion time minus arrival time: total duration spent in the system.',
  },
  {
    name: 'Waiting time',
    formula: 'WT = TAT − BT',
    meaning: 'Turnaround time minus burst time: total time spent waiting in the ready line.',
  },
  {
    name: 'Response time',
    formula: 'RT = First run − AT',
    meaning: 'Elapsed time between arrival and the very first moment on the CPU.',
  },
  {
    name: 'CPU utilization',
    formula: 'Busy ÷ Total × 100%',
    meaning: 'Share of total elapsed time where the processor performed active work.',
  },
];

export function LearnView({ onTryScenario }: Readonly<LearnViewProps>) {
  return (
    <div className="grid w-full xl:grid-cols-12">
      <div className="border-b px-5 py-8 sm:px-8 sm:py-10 lg:px-12 2xl:px-16 xl:col-span-5 xl:border-b-0 xl:border-r">
        <p className="coord-tag">
          <span style={{ color: 'var(--accent)' }}>[ 03 / MANUAL ]</span>
          <span>Operating Systems Field Guide</span>
        </p>
        <h1 className="hero-hybrid mt-4">
          A clear guide to CPU <span className="hero-serif-accent">scheduling</span>.
        </h1>
        <p className="lead-copy mt-4 max-w-[46ch]">
          The core intuition in plain English first, with textbook definitions, equations, and
          worked presets organized beside it.
        </p>

        <div className="mt-8 space-y-4 border-t pt-6 text-[1.02rem] leading-[1.7] text-secondary">
          <p>
            Your computer appears to run dozens of programs at once, yet a single processor core
            executes <strong className="font-semibold text-strong">only one instruction stream at any instant</strong>.
            Waiting programs sit in the <strong className="font-semibold text-strong">ready queue</strong>.
          </p>
          <p>
            Whenever the core becomes free — or a timer tick fires — the OS{' '}
            <strong className="font-semibold text-strong">scheduler</strong> picks who runs next.
            Non-preemptive rules run a program to completion; preemptive rules can pause one
            mid-way to favor a shorter, more urgent, or next-in-turn task.
          </p>
        </div>
      </div>

      <div className="blueprint-shell xl:col-span-7">
        <div className="border-b px-5 py-6 sm:px-8 lg:px-12">
          <p className="coord-tag mb-2">
            <span style={{ color: 'var(--accent)' }}>[ 03.A ]</span>
            <span>The Six Scheduling Rules</span>
          </p>
          {ALGORITHM_ORDER.map((id) => {
            const meta = ALGORITHM_META[id];
            return (
              <Disclosure
                key={id}
                code={meta.shortName}
                title={
                  <span className="flex flex-wrap items-center gap-2.5">
                    <span>{meta.name}</span>
                    <span className={BEHAVIOR_TAG_CLASS[meta.behaviorLabel]}>
                      {meta.behaviorLabel}
                    </span>
                  </span>
                }
                hint={meta.oneLiner}
              >
                <div className="space-y-4 pt-2">
                  <PolicyMicroDiagram algorithmId={id} />
                  <dl className="grid gap-5 text-[0.95rem] leading-relaxed text-secondary md:grid-cols-3">
                    <div>
                      <dt className="eyebrow mb-1">Analogy</dt>
                      <dd>{meta.analogy}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow mb-1">Good at</dt>
                      <dd>{meta.goodAt}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow mb-1">Watch out</dt>
                      <dd>
                        {meta.watchOut}
                        <span className="font-mono-num mt-2 block text-xs text-muted">
                          {meta.shortName} · {meta.badgeLabel}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </Disclosure>
            );
          })}
        </div>

        <Disclosure
          variant="panel"
          code="GLOSSARY"
          title="Glossary of OS terms"
          hint="Plain-language definitions for every term used in the studio"
        >
          <dl className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {GLOSSARY_TERMS.map((item) => (
              <div key={item.term}>
                <dt className="text-[0.96rem] font-semibold text-strong">{item.term}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-secondary">{item.definition}</dd>
              </div>
            ))}
          </dl>
        </Disclosure>

        <Disclosure
          variant="panel"
          code="MATH"
          title="Formulas & equations"
          hint="AT = arrival time · BT = burst time · CT = completion time"
        >
          <div className="divide-y">
            {FORMULAS.map((item) => (
              <div
                key={item.name}
                className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[200px_1fr] sm:items-baseline"
              >
                <div>
                  <p className="text-[0.96rem] font-semibold text-strong">{item.name}</p>
                  <p className="font-mono-num mt-0.5 text-sm font-medium text-accent">
                    {item.formula}
                  </p>
                </div>
                <p className="text-[0.95rem] text-secondary">{item.meaning}</p>
              </div>
            ))}
          </div>
        </Disclosure>

        <section
          aria-labelledby="scenarios-title"
          className="border-t px-5 py-8 sm:px-8 lg:px-12"
        >
          <h2 id="scenarios-title" className="coord-tag mb-4">
            <span style={{ color: 'var(--accent)' }}>[ 03.B ]</span>
            <span>Interactive Demonstrations</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {PRESET_SCENARIOS.map((preset) => (
              <div key={preset.id} className="card-muted flex flex-col justify-between gap-4 p-5">
                <div>
                  <h3 className="text-[1.02rem] font-semibold text-strong">{preset.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-secondary">
                    {preset.description}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn w-fit"
                  onClick={() => onTryScenario(preset.id, preset.recommendedAlgorithm)}
                >
                  Load scenario
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
