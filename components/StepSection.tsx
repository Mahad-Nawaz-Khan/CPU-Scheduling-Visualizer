import type { ReactNode } from 'react';

interface StepSectionProps {
  step: number;
  title: string;
  description: string;
  children: ReactNode;
}

export function StepSection({ step, title, description, children }: StepSectionProps) {
  const headingId = `step-${step}-title`;

  return (
    <section aria-labelledby={headingId} className="space-y-5">
      <header className="flex items-start gap-4">
        <span className="step-badge" aria-hidden="true">
          {step}
        </span>
        <div>
          <h2 id={headingId} className="text-xl font-semibold tracking-tight">
            <span className="sr-only">Step {step}: </span>
            {title}
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-secondary">{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}
