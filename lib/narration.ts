import type { DecisionEvent, DecisionEventType } from './types';

const EVENT_PRIORITY: Record<DecisionEventType, number> = {
  preempt: 0,
  dispatch: 1,
  quantum: 2,
  complete: 3,
  arrival: 4,
  idle: 5,
};

export function pickHeadline(events: DecisionEvent[]): DecisionEvent | undefined {
  return [...events].sort((a, b) => EVENT_PRIORITY[a.type] - EVENT_PRIORITY[b.type])[0];
}
