'use client';

import { ArrowRight } from 'lucide-react';

interface IntroBannerProps {
  onOpenLearn: () => void;
}

export function IntroBanner({ onOpenLearn }: Readonly<IntroBannerProps>) {
  return (
    <section className="max-w-3xl">
      <p className="text-sm font-medium text-accent">Operating Systems · CPU Scheduling</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        How does a computer decide what runs next?
      </h1>
      <p className="mt-4 text-base leading-relaxed text-secondary">
        A CPU core can only work on one program at a time, yet many programs want it at once. The
        operating system&apos;s <strong className="font-semibold text-strong">scheduler</strong>{' '}
        decides who goes next. Follow the four steps below: set up a few programs, pick a
        scheduling strategy, and watch every decision play out.
      </p>
      <button
        type="button"
        onClick={onOpenLearn}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
      >
        New to this topic? Read the 2-minute guide
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </section>
  );
}
