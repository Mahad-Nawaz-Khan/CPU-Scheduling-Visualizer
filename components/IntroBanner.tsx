'use client';

import { ArrowUpRight } from 'lucide-react';

interface IntroBannerProps {
  onOpenLearn: () => void;
}

export function IntroBanner({ onOpenLearn }: Readonly<IntroBannerProps>) {
  return (
    <div className="flex h-full flex-col justify-between gap-8">
      <div>
        <p className="coord-tag">
          <span style={{ color: 'var(--accent)' }}>[ 00 ]</span>
          <span>OS Kernel · Single-Core Multiplexing</span>
        </p>
        <h1 className="hero-hybrid mt-4">
          How silicon shares <span className="hero-serif-accent">time</span> across competing
          programs.
        </h1>
        <p className="lead-copy mt-5 max-w-[50ch]">
          A processor core executes one instruction stream at a time. Select a scheduling policy and
          scrub or play the timeline to see who gets the core, who waits in the ready queue, and why.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-5 pt-1">
        <button
          type="button"
          onClick={onOpenLearn}
          className="inline-flex items-center gap-1.5 text-[0.95rem] font-medium text-accent hover:underline"
        >
          Read the 2-minute field manual
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="font-mono-num hidden items-center gap-2 text-xs text-muted sm:inline-flex">
          <kbd className="kbd-hint">Space</kbd> play/pause
          <kbd className="kbd-hint">←</kbd>
          <kbd className="kbd-hint">→</kbd> step
        </span>
      </div>
    </div>
  );
}
