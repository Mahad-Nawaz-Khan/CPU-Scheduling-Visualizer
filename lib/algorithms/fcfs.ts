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

function selectReadyFcfs(states: SimProcessState[], time: number): SimProcessState | null {
  const ready = states
    .filter((item) => !item.completed && item.arrivalTime <= time)
    .sort(compareArrivalThenPid);
  return ready[0] ?? null;
}

export function runFCFS(processes: ProcessInput[]): SimulationResult {
  if (processes.length === 0) {
    return createEmptySimulation('fcfs');
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
      running = selectReadyFcfs(states, currentTime);
      if (running !== null) {
        events.push({
          time: currentTime,
          type: 'dispatch',
          processId: running.id,
          message: `${running.id} gets the CPU because it arrived first (at time ${running.arrivalTime}) of everyone waiting.`,
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
    readyStates.sort(compareArrivalThenPid);

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
        `Earliest arrival in ready queue (AT=${running.arrivalTime})`,
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
  return finalizeResult('fcfs', processes, timeline, ticks);
}
