import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

type DisclosureVariant = 'hairline' | 'panel';

interface DisclosureProps {
  title: ReactNode;
  code?: string;
  hint?: string;
  variant?: DisclosureVariant;
  children: ReactNode;
}

const WRAPPER_CLASSES: Record<DisclosureVariant, { root: string; summary: string; body: string }> =
  {
    hairline: {
      root: 'group/disclosure border-t',
      summary: 'flex items-center justify-between gap-4 py-4',
      body: 'pb-5 pt-2',
    },
    panel: {
      root: 'group/disclosure border-t',
      summary:
        'flex items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12 2xl:px-16 transition-colors hover:bg-[var(--surface-hover)]',
      body: 'border-t px-5 py-6 sm:px-8 lg:px-12 2xl:px-16',
    },
  };

export function Disclosure({
  title,
  code,
  hint,
  variant = 'hairline',
  children,
}: Readonly<DisclosureProps>) {
  const styles = WRAPPER_CLASSES[variant];

  return (
    <details className={styles.root}>
      <summary className={styles.summary}>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2.5 text-[0.96rem] font-medium text-strong transition-colors group-hover/disclosure:text-accent">
            {code && <span className="font-mono-num text-xs text-muted">[{code}]</span>}
            <span>{title}</span>
          </span>
          {hint && <span className="mt-0.5 block text-sm text-muted">{hint}</span>}
        </span>
        <span className="font-mono-num inline-flex items-center gap-1.5 text-xs text-muted">
          <span className="hidden sm:inline group-open/disclosure:hidden">EXPAND</span>
          <span className="hidden group-open/disclosure:sm:inline">COLLAPSE</span>
          <ChevronDown
            className="h-4 w-4 shrink-0 transition-transform duration-200 group-open/disclosure:rotate-180"
            aria-hidden="true"
          />
        </span>
      </summary>
      <div className={styles.body}>{children}</div>
    </details>
  );
}
