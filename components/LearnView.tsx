'use client';

import { ArrowRight, Hand, Lock } from 'lucide-react';
import { ALGORITHM_META, ALGORITHM_ORDER, BEHAVIOR_TAG_CLASS } from '@/lib/constants';
import { GLOSSARY_TERMS } from '@/lib/glossary';
import { PRESET_SCENARIOS } from '@/lib/presets';
import type { AlgorithmId } from '@/lib/types';

interface LearnViewProps {
  onTryScenario: (presetId: string, algorithmId: AlgorithmId) => void;
}

const FORMULAS = [
  {
    name: 'Turnaround time',
    formula: 'TAT = CT − AT',
    meaning: 'Finish time minus arrival time: the whole time a process spent in the system.',
  },
  {
    name: 'Waiting time',
    formula: 'WT = TAT − BT',
    meaning: 'Turnaround time minus the time actually spent running: the time spent waiting in line.',
  },
  {
    name: 'Response time',
    formula: 'RT = First run − AT',
    meaning: 'How long a process waited before it got the CPU for the very first time.',
  },
  {
    name: 'CPU utilization',
    formula: 'Busy time ÷ Total time × 100%',
    meaning: 'How much of the time the CPU was doing useful work instead of sitting idle.',
  },
];

function SectionHeading({ title, subtitle }: Readonly<{ title: string; subtitle?: string }>) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-secondary">{subtitle}</p>}
    </div>
  );
}

export function LearnView({ onTryScenario }: Readonly<LearnViewProps>) {
  return (
    <div className="mx-auto max-w-4xl space-y-14">
      <header>
        <p className="text-sm font-medium text-accent">Beginner&apos;s guide</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          CPU scheduling in 2 minutes
        </h1>
        <p className="mt-4 text-base leading-relaxed text-secondary">
          Everything you need to understand the Simulator, explained without jargon. The textbook
          terms are included too, so you can connect this to your course material.
        </p>
      </header>

      <section>
        <SectionHeading title="The big idea" />
        <div className="card space-y-4 p-6 text-base leading-relaxed text-secondary">
          <p>
            Your computer runs many programs at once: a browser, a music player, background updates.
            Each of these is a <strong className="text-strong">process</strong>. But a single CPU
            core can only execute one process at any instant.
          </p>
          <p>
            So processes wait in a line called the{' '}
            <strong className="text-strong">ready queue</strong>. Whenever the CPU becomes free, the{' '}
            <strong className="text-strong">scheduler</strong> picks the next process from that
            line. The rule it uses to choose is called the{' '}
            <strong className="text-strong">scheduling algorithm</strong>.
          </p>
          <p>
            Different rules lead to very different results. Some finish short tasks quickly, some
            are fairer, and some react faster to urgent work. The Simulator lets you see those
            differences for yourself.
          </p>
        </div>
      </section>

      <section>
        <SectionHeading
          title="Two families of strategies"
          subtitle="The biggest difference between strategies is whether they are allowed to interrupt."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-6">
            <Lock className="h-5 w-5 text-green" aria-hidden="true" />
            <h3 className="mt-3 font-semibold">Runs to completion</h3>
            <p className="text-xs text-muted">Textbook term: non-preemptive</p>
            <p className="mt-3 text-sm leading-relaxed text-secondary">
              Once a process gets the CPU, it keeps it until it is finished. Simple and with little
              overhead, but an urgent or short process that arrives later has to wait.
            </p>
          </div>
          <div className="card p-6">
            <Hand className="h-5 w-5 text-amber" aria-hidden="true" />
            <h3 className="mt-3 font-semibold">Can interrupt</h3>
            <p className="text-xs text-muted">Textbook term: preemptive</p>
            <p className="mt-3 text-sm leading-relaxed text-secondary">
              The scheduler may pause a running process, either because a better candidate arrived
              or because its time slice ran out. More responsive, at the cost of extra switching.
            </p>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading title="The six strategies" />
        <div className="grid gap-4 md:grid-cols-2">
          {ALGORITHM_ORDER.map((id) => {
            const meta = ALGORITHM_META[id];
            return (
              <article key={id} className="card flex flex-col p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{meta.name}</h3>
                  <span className={BEHAVIOR_TAG_CLASS[meta.behaviorLabel]}>{meta.behaviorLabel}</span>
                </div>
                <p className="mt-1 text-xs text-muted">Textbook name: {meta.shortName}</p>
                <p className="mt-3 text-sm leading-relaxed text-secondary">{meta.analogy}</p>
                <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
                  <div>
                    <dt className="inline font-medium text-green">Good at: </dt>
                    <dd className="inline text-secondary">{meta.goodAt}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-amber">Watch out: </dt>
                    <dd className="inline text-secondary">{meta.watchOut}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeading title="Key terms" />
        <dl className="card grid gap-x-10 gap-y-5 p-6 sm:grid-cols-2">
          {GLOSSARY_TERMS.map((item) => (
            <div key={item.term}>
              <dt className="text-sm font-semibold">{item.term}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-secondary">{item.definition}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <SectionHeading
          title="How the results are calculated"
          subtitle="AT = arrival time, BT = burst time, CT = completion time."
        />
        <div className="card divide-y">
          {FORMULAS.map((item) => (
            <div key={item.name} className="grid gap-2 px-6 py-4 sm:grid-cols-[200px_1fr] sm:items-baseline">
              <div>
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="mt-0.5 text-sm font-medium tabular-nums text-accent">{item.formula}</p>
              </div>
              <p className="text-sm leading-relaxed text-secondary">{item.meaning}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          title="Try a classic scenario"
          subtitle="Each one loads into the Simulator with a strategy that shows the idea clearly."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {PRESET_SCENARIOS.map((preset) => (
            <div key={preset.id} className="card flex flex-col justify-between gap-4 p-5">
              <div>
                <h3 className="font-semibold">{preset.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-secondary">{preset.description}</p>
              </div>
              <button
                type="button"
                className="btn w-fit"
                onClick={() => onTryScenario(preset.id, preset.recommendedAlgorithm)}
              >
                Open in Simulator
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
