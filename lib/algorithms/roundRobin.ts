import { DEFAULT_QUANTUM, MAX_QUANTUM, MIN_QUANTUM } from '../constants';
import { formatUnits } from '../format';
import { clampInteger } from '../presets';
import type {
  DecisionEvent,
  ProcessInput,
  SimulationResult,
  TickSnapshot,
  TimelineSegment,
} from '../types';
import {
  appendTickToTimeline,
  buildFinalSnapshot,
  buildRemainingMap,
  collectProcessLists,
  createEmptySimulation,
  createInitialStates,
  finalizeResult,
  markSegmentCompleted,
  markSegmentPreempted,
  recordArrivalsAtTick,
  type SimProcessState,
} from './helpers';

function enqueueArrivalsForTick(
  states: SimProcessState[],
  readyQueue: SimProcessState[],
  enqueuedIds: Set<string>,
  time: number,
): void {
  for (const state of states) {
    if (state.arrivalTime <= time && !state.completed && !enqueuedIds.has(state.id)) {
      readyQueue.push(state);
      enqueuedIds.add(state.id);
    }
  }
}

function dispatchFromQueue(
  readyQueue: SimProcessState[],
  currentTime: number,
  timeQuantum: number,
  events: DecisionEvent[],
): SimProcessState | null {
  const next = readyQueue.shift() ?? null;
  if (next === null) {
    events.push({
      time: currentTime,
      type: 'idle',
      processId: null,
      message: 'The CPU is idle because the line is empty.',
    });
    return null;
  }

  events.push({
    time: currentTime,
    type: 'dispatch',
    processId: next.id,
    message: `${next.id} is at the front of the line, so it gets the CPU for up to ${formatUnits(timeQuantum)}.`,
  });
  return next;
}

function handleQuantumExpired(
  running: SimProcessState,
  readyQueue: SimProcessState[],
  timeline: TimelineSegment[],
  nextTime: number,
  pendingEvents: DecisionEvent[],
): SimProcessState | null {
  if (readyQueue.length === 0) {
    pendingEvents.push({
      time: nextTime,
      type: 'quantum',
      processId: running.id,
      message: `${running.id} used up its time slice, but nobody else is waiting, so it keeps the CPU.`,
    });
    return running;
  }

  markSegmentPreempted(timeline);
  const queuedAhead = readyQueue.map((item) => item.id).join(', ');
  readyQueue.push(running);
  pendingEvents.push({
    time: nextTime,
    type: 'preempt',
    processId: running.id,
    message: `${running.id} used up its time slice, so it goes to the back of the line behind ${queuedAhead}.`,
  });
  return null;
}

function advanceRoundRobinTick(
  running: SimProcessState | null,
  quantumUsed: number,
  timeQuantum: number,
  states: SimProcessState[],
  readyQueue: SimProcessState[],
  enqueuedIds: Set<string>,
  timeline: TimelineSegment[],
  currentTime: number,
  pendingEvents: DecisionEvent[],
): { nextRunning: SimProcessState | null; nextQuantumUsed: number; finishedOne: boolean } {
  const nextTime = currentTime + 1;

  if (running === null) {
    appendTickToTimeline(timeline, null, currentTime, 'Ready queue empty');
    enqueueArrivalsForTick(states, readyQueue, enqueuedIds, nextTime);
    return { nextRunning: null, nextQuantumUsed: 0, finishedOne: false };
  }

  appendTickToTimeline(
    timeline,
    running.id,
    currentTime,
    `Round Robin FIFO slice (Time Quantum=${timeQuantum})`,
  );
  running.remaining -= 1;
  const updatedQuantum = quantumUsed + 1;
  enqueueArrivalsForTick(states, readyQueue, enqueuedIds, nextTime);

  if (running.remaining === 0) {
    running.completed = true;
    markSegmentCompleted(timeline);
    pendingEvents.push({
      time: nextTime,
      type: 'complete',
      processId: running.id,
      message: `${running.id} finishes its work at time ${nextTime}.`,
    });
    return { nextRunning: null, nextQuantumUsed: 0, finishedOne: true };
  }

  if (updatedQuantum < timeQuantum) {
    return { nextRunning: running, nextQuantumUsed: updatedQuantum, finishedOne: false };
  }

  const nextRunning = handleQuantumExpired(
    running,
    readyQueue,
    timeline,
    nextTime,
    pendingEvents,
  );
  return { nextRunning, nextQuantumUsed: 0, finishedOne: false };
}

export function runRoundRobin(
  processes: ProcessInput[],
  rawQuantum = DEFAULT_QUANTUM,
): SimulationResult {
  const timeQuantum = clampInteger(rawQuantum, MIN_QUANTUM, MAX_QUANTUM, DEFAULT_QUANTUM);
  if (processes.length === 0) {
    return createEmptySimulation('rr', timeQuantum);
  }

  const states = createInitialStates(processes);
  const timeline: TimelineSegment[] = [];
  const ticks: TickSnapshot[] = [];
  const readyQueue: SimProcessState[] = [];
  const enqueuedIds = new Set<string>();

  let currentTime = 0;
  let completedCount = 0;
  let running: SimProcessState | null = null;
  let quantumUsed = 0;
  let pendingEvents: DecisionEvent[] = [];

  enqueueArrivalsForTick(states, readyQueue, enqueuedIds, 0);

  while (completedCount < states.length) {
    const events: DecisionEvent[] = [...pendingEvents];
    pendingEvents = [];
    recordArrivalsAtTick(states, currentTime, events);

    if (running === null) {
      running = dispatchFromQueue(readyQueue, currentTime, timeQuantum, events);
      quantumUsed = 0;
    }

    const { completedIds, notArrivedIds } = collectProcessLists(
      states,
      currentTime,
      running ? running.id : null,
    );

    ticks.push({
      time: currentTime,
      runningProcessId: running ? running.id : null,
      readyQueueIds: readyQueue.map((item) => item.id),
      remainingBurst: buildRemainingMap(states),
      completedIds,
      notArrivedIds,
      events,
    });

    const step = advanceRoundRobinTick(
      running,
      quantumUsed,
      timeQuantum,
      states,
      readyQueue,
      enqueuedIds,
      timeline,
      currentTime,
      pendingEvents,
    );
    running = step.nextRunning;
    quantumUsed = step.nextQuantumUsed;
    if (step.finishedOne) {
      completedCount += 1;
    }

    currentTime += 1;
  }

  ticks.push(buildFinalSnapshot(states, currentTime, pendingEvents));
  return finalizeResult('rr', processes, timeline, ticks, timeQuantum);
}
