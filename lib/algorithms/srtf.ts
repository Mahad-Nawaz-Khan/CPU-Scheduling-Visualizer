import { formatUnits } from '../format';
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

function compareSrtf(a: SimProcessState, b: SimProcessState): number {
  if (a.remaining !== b.remaining) {
    return a.remaining - b.remaining;
  }
  return compareArrivalThenPid(a, b);
}

function chooseNextSrtf(
  states: SimProcessState[],
  currentRunning: SimProcessState | null,
  time: number,
  events: DecisionEvent[],
  timeline: TimelineSegment[],
): SimProcessState | null {
  const ready = states
    .filter((item) => !item.completed && item.arrivalTime <= time)
    .sort(compareSrtf);

  const bestCandidate = ready[0] ?? null;

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
      message: `${bestCandidate.id} gets the CPU because it has the least work left (${formatUnits(bestCandidate.remaining)}).`,
    });
    return bestCandidate;
  }

  if (bestCandidate.id !== currentRunning.id && bestCandidate.remaining < currentRunning.remaining) {
    markLastSegmentFlag(timeline, 'preempted');
    events.push({
      time,
      type: 'preempt',
      processId: bestCandidate.id,
      message: `${bestCandidate.id} interrupts ${currentRunning.id}: it needs only ${formatUnits(bestCandidate.remaining)}, while ${currentRunning.id} still needs ${formatUnits(currentRunning.remaining)}.`,
    });
    return bestCandidate;
  }

  return currentRunning;
}

export function runSRTF(processes: ProcessInput[]): SimulationResult {
  if (processes.length === 0) {
    return createEmptySimulation('srtf');
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

    running = chooseNextSrtf(states, running, currentTime, events, timeline);

    const { readyStates, completedIds, notArrivedIds } = collectProcessLists(
      states,
      currentTime,
      running ? running.id : null,
    );
    readyStates.sort(compareSrtf);

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
        `Shortest remaining time (${running.remaining} at start of slice)`,
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
  return finalizeResult('srtf', processes, timeline, ticks);
}
