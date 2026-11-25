import type { DecisionEvent, ProcessInput, SimulationResult, TickSnapshot, TimelineSegment } from '../types';
import {
  appendTickToTimeline,
  buildFinalSnapshot,
  buildRemainingMap,
  collectProcessLists,
  compareArrivalThenPid,
  createEmptySimulation,
  createInitialStates,
  finalizeResult,
  markLastSegmentFlag,
  recordArrivalsAtTick,
  type SimProcessState,
} from './helpers';

function comparePriority(a: SimProcessState, b: SimProcessState): number {
  if (a.priority !== b.priority) {
    return a.priority - b.priority;
  }
  return compareArrivalThenPid(a, b);
}

function selectReadyPriority(states: SimProcessState[], time: number): SimProcessState | null {
  const ready = states
    .filter((item) => !item.completed && item.arrivalTime <= time)
    .sort(comparePriority);
  return ready[0] ?? null;
}

function choosePreemptivePriority(
  states: SimProcessState[],
  currentRunning: SimProcessState | null,
  time: number,
  events: DecisionEvent[],
  timeline: TimelineSegment[],
): SimProcessState | null {
  const bestCandidate = selectReadyPriority(states, time);

  if (bestCandidate === null) {
    events.push({
      time,
      type: 'idle',
      processId: null,
      message: 'The CPU is idle because no process is waiting.',
    });
    return null;
  }

  if (currentRunning === null) {
    events.push({
      time,
      type: 'dispatch',
      processId: bestCandidate.id,
      message: `${bestCandidate.id} gets the CPU because it is the most urgent waiting process (priority ${bestCandidate.priority}).`,
    });
    return bestCandidate;
  }

  if (bestCandidate.id !== currentRunning.id && bestCandidate.priority < currentRunning.priority) {
    markLastSegmentFlag(timeline, 'preempted');
    events.push({
      time,
      type: 'preempt',
      processId: bestCandidate.id,
      message: `${bestCandidate.id} interrupts ${currentRunning.id} because priority ${bestCandidate.priority} is more urgent than priority ${currentRunning.priority}.`,
    });
    return bestCandidate;
  }

  return currentRunning;
}

export function runPriorityNonPreemptive(processes: ProcessInput[]): SimulationResult {
  if (processes.length === 0) {
    return createEmptySimulation('priority-np');
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

    if (running === null) {
      running = selectReadyPriority(states, currentTime);
      if (running !== null) {
        events.push({
          time: currentTime,
          type: 'dispatch',
          processId: running.id,
          message: `${running.id} gets the CPU because it is the most urgent waiting process (priority ${running.priority}).`,
        });
      } else {
        events.push({
          time: currentTime,
          type: 'idle',
          processId: null,
          message: 'The CPU is idle because no process is waiting.',
        });
      }
    }

    const { readyStates, completedIds, notArrivedIds } = collectProcessLists(
      states,
      currentTime,
      running ? running.id : null,
    );
    readyStates.sort(comparePriority);

    ticks.push({
      time: currentTime,
      runningProcessId: running ? running.id : null,
      readyQueueIds: readyStates.map((item) => item.id),
      remainingBurst: buildRemainingMap(states),
      completedIds,
      notArrivedIds,
      events,
    });

    if (running !== null) {
      appendTickToTimeline(
        timeline,
        running.id,
        currentTime,
        `Highest priority ready process (Priority=${running.priority})`,
      );
      running.remaining -= 1;

      if (running.remaining === 0) {
        running.completed = true;
        completedCount += 1;
        markLastSegmentFlag(timeline, 'completed');
        pendingCompletionEvents.push({
          time: currentTime + 1,
          type: 'complete',
          processId: running.id,
          message: `${running.id} finishes its work at time ${currentTime + 1}.`,
        });
        running = null;
      }
    } else {
      appendTickToTimeline(timeline, null, currentTime, 'No ready processes available');
    }

    currentTime += 1;
  }

  ticks.push(buildFinalSnapshot(states, currentTime, pendingCompletionEvents));
  return finalizeResult('priority-np', processes, timeline, ticks);
}

export function runPriorityPreemptive(processes: ProcessInput[]): SimulationResult {
  if (processes.length === 0) {
    return createEmptySimulation('priority-p');
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

    running = choosePreemptivePriority(states, running, currentTime, events, timeline);

    const { readyStates, completedIds, notArrivedIds } = collectProcessLists(
      states,
      currentTime,
      running ? running.id : null,
    );
    readyStates.sort(comparePriority);

    ticks.push({
      time: currentTime,
      runningProcessId: running ? running.id : null,
      readyQueueIds: readyStates.map((item) => item.id),
      remainingBurst: buildRemainingMap(states),
      completedIds,
      notArrivedIds,
      events,
    });

    if (running !== null) {
      appendTickToTimeline(
        timeline,
        running.id,
        currentTime,
        `Highest priority active process (Priority=${running.priority})`,
      );
      running.remaining -= 1;

      if (running.remaining === 0) {
        running.completed = true;
        completedCount += 1;
        markLastSegmentFlag(timeline, 'completed');
        pendingCompletionEvents.push({
          time: currentTime + 1,
          type: 'complete',
          processId: running.id,
          message: `${running.id} finishes its work at time ${currentTime + 1}.`,
        });
        running = null;
      }
    } else {
      appendTickToTimeline(timeline, null, currentTime, 'No ready processes available');
    }

    currentTime += 1;
  }

  ticks.push(buildFinalSnapshot(states, currentTime, pendingCompletionEvents));
  return finalizeResult('priority-p', processes, timeline, ticks);
}
