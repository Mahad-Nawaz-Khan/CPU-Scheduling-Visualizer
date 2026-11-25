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

export interface NonPreemptivePolicy {
  algorithmId: AlgorithmId;
  compareReady: (a: SimProcessState, b: SimProcessState) => number;
  dispatchMessage: (process: SimProcessState) => string;
  sliceReason: (process: SimProcessState) => string;
}

export interface PreemptivePolicy {
  algorithmId: AlgorithmId;
  compareReady: (a: SimProcessState, b: SimProcessState) => number;
  shouldPreempt: (candidate: SimProcessState, running: SimProcessState) => boolean;
  dispatchMessage: (process: SimProcessState) => string;
  preemptMessage: (candidate: SimProcessState, running: SimProcessState) => string;
  sliceReason: (process: SimProcessState) => string;
}

const IDLE_EVENT_MESSAGE = 'The CPU is idle because no process is waiting.';
const IDLE_TIMELINE_REASON = 'No ready processes available';

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
  const last = timeline.at(-1);
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

export function markSegmentPreempted(timeline: TimelineSegment[]): void {
  const last = timeline.at(-1);
  if (last && last.processId !== null) {
    last.preemptedAtEnd = true;
  }
}

export function markSegmentCompleted(timeline: TimelineSegment[]): void {
  const last = timeline.at(-1);
  if (last && last.processId !== null) {
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

function selectNextReady(
  states: SimProcessState[],
  time: number,
  compareReady: (a: SimProcessState, b: SimProcessState) => number,
): SimProcessState | null {
  const ready = states
    .filter((item) => !item.completed && item.arrivalTime <= time)
    .sort(compareReady);
  return ready[0] ?? null;
}

function recordTickSnapshot(
  states: SimProcessState[],
  time: number,
  running: SimProcessState | null,
  compareReady: (a: SimProcessState, b: SimProcessState) => number,
  events: DecisionEvent[],
  ticks: TickSnapshot[],
): void {
  const { readyStates, completedIds, notArrivedIds } = collectProcessLists(
    states,
    time,
    running ? running.id : null,
  );
  readyStates.sort(compareReady);

  ticks.push({
    time,
    runningProcessId: running ? running.id : null,
    readyQueueIds: readyStates.map((item) => item.id),
    remainingBurst: buildRemainingMap(states),
    completedIds,
    notArrivedIds,
    events,
  });
}

function executeTickStep(
  running: SimProcessState | null,
  timeline: TimelineSegment[],
  currentTime: number,
  sliceReason: (process: SimProcessState) => string,
  pendingCompletionEvents: DecisionEvent[],
): { nextRunning: SimProcessState | null; finishedOne: boolean } {
  if (running === null) {
    appendTickToTimeline(timeline, null, currentTime, IDLE_TIMELINE_REASON);
    return { nextRunning: null, finishedOne: false };
  }

  appendTickToTimeline(timeline, running.id, currentTime, sliceReason(running));
  running.remaining -= 1;

  if (running.remaining > 0) {
    return { nextRunning: running, finishedOne: false };
  }

  running.completed = true;
  markSegmentCompleted(timeline);
  pendingCompletionEvents.push({
    time: currentTime + 1,
    type: 'complete',
    processId: running.id,
    message: `${running.id} finishes its work at time ${currentTime + 1}.`,
  });
  return { nextRunning: null, finishedOne: true };
}

function pickNonPreemptiveProcess(
  states: SimProcessState[],
  currentTime: number,
  events: DecisionEvent[],
  policy: NonPreemptivePolicy,
): SimProcessState | null {
  const selected = selectNextReady(states, currentTime, policy.compareReady);
  if (selected === null) {
    events.push({
      time: currentTime,
      type: 'idle',
      processId: null,
      message: IDLE_EVENT_MESSAGE,
    });
    return null;
  }

  events.push({
    time: currentTime,
    type: 'dispatch',
    processId: selected.id,
    message: policy.dispatchMessage(selected),
  });
  return selected;
}

export function runNonPreemptiveScheduler(
  processes: ProcessInput[],
  policy: NonPreemptivePolicy,
): SimulationResult {
  if (processes.length === 0) {
    return createEmptySimulation(policy.algorithmId);
  }

  const states = createInitialStates(processes);
  const timeline: TimelineSegment[] = [];
  const ticks: TickSnapshot[] = [];

  let currentTime = 0;
  let completedCount = 0;
  let running: SimProcessState | null = null;
  let pendingCompletionEvents: DecisionEvent[] = [];

  while (completedCount < states.length) {
    const events: DecisionEvent[] = [...pendingCompletionEvents];
    pendingCompletionEvents = [];
    recordArrivalsAtTick(states, currentTime, events);

    running ??= pickNonPreemptiveProcess(states, currentTime, events, policy);

    recordTickSnapshot(states, currentTime, running, policy.compareReady, events, ticks);

    const step = executeTickStep(
      running,
      timeline,
      currentTime,
      policy.sliceReason,
      pendingCompletionEvents,
    );
    running = step.nextRunning;
    if (step.finishedOne) {
      completedCount += 1;
    }

    currentTime += 1;
  }

  ticks.push(buildFinalSnapshot(states, currentTime, pendingCompletionEvents));
  return finalizeResult(policy.algorithmId, processes, timeline, ticks);
}

function pickPreemptiveProcess(
  states: SimProcessState[],
  currentRunning: SimProcessState | null,
  currentTime: number,
  events: DecisionEvent[],
  timeline: TimelineSegment[],
  policy: PreemptivePolicy,
): SimProcessState | null {
  const bestCandidate = selectNextReady(states, currentTime, policy.compareReady);
  if (bestCandidate === null) {
    events.push({
      time: currentTime,
      type: 'idle',
      processId: null,
      message: IDLE_EVENT_MESSAGE,
    });
    return null;
  }

  if (currentRunning === null) {
    events.push({
      time: currentTime,
      type: 'dispatch',
      processId: bestCandidate.id,
      message: policy.dispatchMessage(bestCandidate),
    });
    return bestCandidate;
  }

  if (
    bestCandidate.id !== currentRunning.id &&
    policy.shouldPreempt(bestCandidate, currentRunning)
  ) {
    markSegmentPreempted(timeline);
    events.push({
      time: currentTime,
      type: 'preempt',
      processId: bestCandidate.id,
      message: policy.preemptMessage(bestCandidate, currentRunning),
    });
    return bestCandidate;
  }

  return currentRunning;
}

export function runPreemptiveScheduler(
  processes: ProcessInput[],
  policy: PreemptivePolicy,
): SimulationResult {
  if (processes.length === 0) {
    return createEmptySimulation(policy.algorithmId);
  }

  const states = createInitialStates(processes);
  const timeline: TimelineSegment[] = [];
  const ticks: TickSnapshot[] = [];

  let currentTime = 0;
  let completedCount = 0;
  let running: SimProcessState | null = null;
  let pendingCompletionEvents: DecisionEvent[] = [];

  while (completedCount < states.length) {
    const events: DecisionEvent[] = [...pendingCompletionEvents];
    pendingCompletionEvents = [];
    recordArrivalsAtTick(states, currentTime, events);

    running = pickPreemptiveProcess(states, running, currentTime, events, timeline, policy);

    recordTickSnapshot(states, currentTime, running, policy.compareReady, events, ticks);

    const step = executeTickStep(
      running,
      timeline,
      currentTime,
      policy.sliceReason,
      pendingCompletionEvents,
    );
    running = step.nextRunning;
    if (step.finishedOne) {
      completedCount += 1;
    }

    currentTime += 1;
  }

  ticks.push(buildFinalSnapshot(states, currentTime, pendingCompletionEvents));
  return finalizeResult(policy.algorithmId, processes, timeline, ticks);
}
