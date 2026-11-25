import { formatUnits } from '../format';
import { calculateMetrics } from '../metrics';
import type {
  AlgorithmId,
  DecisionEvent,
  ProcessInput,
  SimulationResult,
  TickSnapshot,
  TimelineSegment,
} from '../types';

export interface SimProcessState {
  id: string;
  pidOrder: number;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  remaining: number;
  completed: boolean;
}

export function compareArrivalThenPid(
  a: Pick<ProcessInput, 'arrivalTime' | 'pidOrder'>,
  b: Pick<ProcessInput, 'arrivalTime' | 'pidOrder'>,
): number {
  if (a.arrivalTime !== b.arrivalTime) {
    return a.arrivalTime - b.arrivalTime;
  }
  return a.pidOrder - b.pidOrder;
}

export function createInitialStates(processes: ProcessInput[]): SimProcessState[] {
  return [...processes].sort(compareArrivalThenPid).map((process) => ({
    id: process.id,
    pidOrder: process.pidOrder,
    arrivalTime: process.arrivalTime,
    burstTime: process.burstTime,
    priority: process.priority,
    remaining: process.burstTime,
    completed: false,
  }));
}

export function appendTickToTimeline(
  timeline: TimelineSegment[],
  processId: string | null,
  time: number,
  reason: string,
): void {
  const last = timeline[timeline.length - 1];
  if (
    last &&
    last.processId === processId &&
    last.endTime === time &&
    !last.preemptedAtEnd &&
    !last.completedAtEnd
  ) {
    last.endTime = time + 1;
    last.duration += 1;
    return;
  }

  timeline.push({
    processId,
    startTime: time,
    endTime: time + 1,
    duration: 1,
    preemptedAtEnd: false,
    completedAtEnd: false,
    reason,
  });
}

export function markLastSegmentFlag(
  timeline: TimelineSegment[],
  flag: 'preempted' | 'completed',
): void {
  const last = timeline[timeline.length - 1];
  if (!last || last.processId === null) {
    return;
  }
  if (flag === 'preempted') {
    last.preemptedAtEnd = true;
  } else {
    last.completedAtEnd = true;
  }
}

export function buildRemainingMap(states: SimProcessState[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const state of states) {
    map[state.id] = state.remaining;
  }
  return map;
}

export function collectProcessLists(
  states: SimProcessState[],
  time: number,
  runningId: string | null,
): {
  readyStates: SimProcessState[];
  completedIds: string[];
  notArrivedIds: string[];
} {
  const readyStates: SimProcessState[] = [];
  const completedIds: string[] = [];
  const notArrivedIds: string[] = [];

  for (const state of states) {
    if (state.completed) {
      completedIds.push(state.id);
    } else if (state.arrivalTime > time) {
      notArrivedIds.push(state.id);
    } else if (state.id !== runningId) {
      readyStates.push(state);
    }
  }

  return { readyStates, completedIds, notArrivedIds };
}

export function recordArrivalsAtTick(
  states: SimProcessState[],
  time: number,
  events: DecisionEvent[],
): void {
  for (const state of states) {
    if (state.arrivalTime === time) {
      events.push({
        time,
        type: 'arrival',
        processId: state.id,
        message: `${state.id} arrives and needs ${formatUnits(state.burstTime)} of CPU time (priority ${state.priority}).`,
      });
    }
  }
}

export function finalizeResult(
  algorithmId: AlgorithmId,
  processes: ProcessInput[],
  timeline: TimelineSegment[],
  ticks: TickSnapshot[],
  timeQuantum?: number,
): SimulationResult {
  const { processMetrics, summary } = calculateMetrics(processes, timeline);
  return {
    algorithmId,
    timeQuantum,
    timeline,
    ticks,
    processMetrics,
    summary,
  };
}

export function createEmptySimulation(
  algorithmId: AlgorithmId,
  timeQuantum?: number,
): SimulationResult {
  return finalizeResult(algorithmId, [], [], [], timeQuantum);
}

export function buildFinalSnapshot(
  states: SimProcessState[],
  time: number,
  events: DecisionEvent[],
): TickSnapshot {
  return {
    time,
    runningProcessId: null,
    readyQueueIds: [],
    remainingBurst: buildRemainingMap(states),
    completedIds: states.map((item) => item.id),
    notArrivedIds: [],
    events,
  };
}
