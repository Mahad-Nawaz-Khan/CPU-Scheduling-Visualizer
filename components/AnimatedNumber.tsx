'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
}

function prefersReducedMotion(): boolean {
  if (typeof globalThis.matchMedia !== 'function') {
    return true;
  }
  return globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function AnimatedNumber({
  value,
  decimals = 2,
  suffix = '',
}: Readonly<AnimatedNumberProps>) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousRef = useRef(value);

  useEffect(() => {
    const startValue = previousRef.current;
    previousRef.current = value;

    if (startValue === value || prefersReducedMotion()) {
      setDisplayValue(value);
      return undefined;
    }

    const durationMs = 240;
    const startTime = performance.now();
    let frameId = 0;

    function step(now: number) {
      const progress = Math.min((now - startTime) / durationMs, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(startValue + (value - startValue) * eased);
      if (progress < 1) {
        frameId = globalThis.requestAnimationFrame(step);
      }
    }

    frameId = globalThis.requestAnimationFrame(step);
    return () => globalThis.cancelAnimationFrame(frameId);
  }, [value]);

  return (
    <>
      {displayValue.toFixed(decimals)}
      {suffix}
    </>
  );
}
