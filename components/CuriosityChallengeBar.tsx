'use client';

import { ChevronDown, Play, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AlgorithmId } from '@/lib/types';

interface ParadoxExperiment {
  id: string;
  tag: string;
  question: string;
  options: Array<{ label: string; outcome: string }>;
  insight: string;
  presetId: string;
  algorithmId: AlgorithmId;
  quantum?: number;
}

const EXPERIMENTS: ParadoxExperiment[] = [
  {
    id: 'convoy',
    tag: 'PARADOX 01',
    question:
      'A 14-unit job (P1) arrives alone at t=0, then three tiny 1–2 unit jobs arrive at t=1..3. Switching FCFS (10.25 wait) to non-preemptive Shortest Job First cuts average wait to…',
    options: [
      { label: '~3.00 units', outcome: 'Wait — look! It only drops from 10.25 to 10.00 units.' },
      { label: '~10.00 units', outcome: 'Sharp eye! SJF barely moves it (10.25 → 10.00).' },
    ],
    insight:
      'Because P1 arrived alone at t=0 and SJF never interrupts, everyone still waits behind the 14-unit convoy.',
    presetId: 'convoy-effect',
    algorithmId: 'sjf',
  },
  {
    id: 'preempt-power',
    tag: 'PARADOX 02',
    question:
      'Now allow shorter newcomers to interrupt that 14-unit job mid-run (Shortest Remaining Time First). Where does average wait drop?',
    options: [
      { label: 'Plummets to 1.75 units', outcome: 'Spot-on! Interrupting P1 once slashes average wait to 1.75 (83% faster).' },
      { label: 'Barely changes (~9.5 units)', outcome: 'Surprise: three tiny jobs clear immediately, slashing wait from 10.25 to 1.75!' },
    ],
    insight:
      'Preemption breaks the convoy bottleneck instantly instead of trapping short tasks behind one giant burst.',
    presetId: 'convoy-effect',
    algorithmId: 'srtf',
  },
  {
    id: 'rr-surprise',
    tag: 'PARADOX 03',
    question:
      'In the Basic Example, Round Robin (slice 2) keeps Average Wait at 3.33 (same as FCFS). What actually improves?',
    options: [
      { label: 'First Response drops 3.33 → 1.00', outcome: 'Exactly right! Every process starts right away.' },
      { label: 'Total finish time shrinks', outcome: 'Total work is still 9, but First Response drops 3.33 → 1.00!' },
    ],
    insight:
      'Time-slicing trades context switches for fast responsiveness so nobody feels frozen.',
    presetId: 'default-sample',
    algorithmId: 'rr',
    quantum: 2,
  },
  {
    id: 'starvation',
    tag: 'PARADOX 04',
    question:
      'Under Priority + Interrupt, P1 (priority 4) starts at t=0 while priority 1–3 jobs arrive right behind it. When does P1 finally finish?',
    options: [
      { label: 'Right after P2 at t=12', outcome: 'Longer! P1 sits waiting until every urgent job finishes at t=19.' },
      { label: 'Last of all at t=19', outcome: 'Correct — low-priority tasks keep getting bumped to the very end.' },
    ],
    insight:
      'Real OS kernels solve this "starvation" by gradually boosting priority as a task ages.',
    presetId: 'preemption-showcase',
    algorithmId: 'priority-p',
  },
];

const STORAGE_KEY = 'cpu-studio-paradoxes-v1';

interface CuriosityChallengeBarProps {
  onRunExperiment: (presetId: string, algorithmId: AlgorithmId, quantum?: number) => void;
}

export function CuriosityChallengeBar({ onRunExperiment }: Readonly<CuriosityChallengeBarProps>) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeId, setActiveId] = useState<string>(EXPERIMENTS[0].id);
  const [exploredIds, setExploredIds] = useState<string[]>([]);
  const [chosenOutcome, setChosenOutcome] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = globalThis.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setExploredIds(parsed.filter((item): item is string => typeof item === 'string'));
        }
      }
    } catch {
      // Ignore storage read issues
    }
  }, []);

  const activeExperiment =
    EXPERIMENTS.find((item) => item.id === activeId) ?? EXPERIMENTS[0];

  function selectExperiment(id: string) {
    setActiveId(id);
    setChosenOutcome(null);
  }

  function handlePredict(outcomeText: string) {
    setChosenOutcome(outcomeText);
    if (!exploredIds.includes(activeExperiment.id)) {
      const next = [...exploredIds, activeExperiment.id];
      setExploredIds(next);
      try {
        globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage write issues
      }
    }
    onRunExperiment(
      activeExperiment.presetId,
      activeExperiment.algorithmId,
      activeExperiment.quantum,
    );
  }

  return (
    <section aria-label="Interactive OS paradox lab" className="border-b">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8 lg:px-12 2xl:px-16">
        <div className="flex flex-wrap items-center gap-3">
          <span className="coord-tag">
            <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <span>Lab // Predict &amp; Observe</span>
          </span>
          <div className="flex items-center gap-1.5" aria-label={`${exploredIds.length} of ${EXPERIMENTS.length} explored`}>
            {EXPERIMENTS.map((item) => {
              const done = exploredIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setIsOpen(true);
                    selectExperiment(item.id);
                  }}
                  title={item.tag}
                  aria-label={`${item.tag}${done ? ' explored' : ''}`}
                  className="h-2.5 w-2.5 rounded-full border transition-transform hover:scale-125"
                  style={{
                    backgroundColor: done ? 'var(--accent)' : 'transparent',
                    borderColor: done ? 'var(--accent)' : 'var(--border-strong)',
                  }}
                />
              );
            })}
            <span className="font-mono-num ml-1.5 text-xs text-muted">
              {exploredIds.length}/{EXPERIMENTS.length} explored
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-ghost font-mono-num h-8 px-2.5 text-xs text-muted"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span>{isOpen ? 'HIDE LAB' : 'OPEN LAB'}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {isOpen && (
        <div
          className="grid items-center gap-5 border-t px-5 py-5 sm:px-8 lg:grid-cols-12 lg:px-12 2xl:px-16"
          style={{ backgroundColor: 'var(--bg-subtle)' }}
        >
          <div className="flex flex-wrap gap-1.5 lg:col-span-3">
            {EXPERIMENTS.map((item) => {
              const isSelected = item.id === activeExperiment.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectExperiment(item.id)}
                  className="font-mono-num rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: isSelected ? 'var(--ink-cta)' : 'var(--surface)',
                    color: isSelected ? 'var(--on-ink)' : 'var(--text-secondary)',
                    borderColor: isSelected ? 'var(--ink-cta)' : 'var(--border-strong)',
                  }}
                >
                  {item.tag}
                </button>
              );
            })}
          </div>

          <div className="space-y-3 lg:col-span-9">
            <p className="text-[0.98rem] font-medium leading-snug text-strong">
              {activeExperiment.question}
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              {activeExperiment.options.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  className="btn h-9 text-sm"
                  onClick={() => handlePredict(option.outcome)}
                >
                  <Play className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  <span>Predict: {option.label}</span>
                </button>
              ))}
            </div>

            {chosenOutcome && (
              <output className="narration-enter block rounded-lg border px-3.5 py-2.5 text-sm leading-relaxed" style={{ backgroundColor: 'var(--surface)' }}>
                <strong className="text-accent">{chosenOutcome}</strong>{' '}
                <span className="text-secondary">{activeExperiment.insight}</span>
              </output>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
