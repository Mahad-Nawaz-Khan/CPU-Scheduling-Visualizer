import { DEFAULT_QUANTUM, MAX_QUANTUM, MIN_QUANTUM } from '../constants';
import { formatUnits } from '../format';
import { clampInteger } from '../presets';
import type { DecisionEvent, ProcessInput, SimulationResult, TickSnapshot, TimelineSegment } from '../types';
import {
  appendTickToTimeline,
  buildFinalSnapshot,
  buildRemainingMap,
  collectProcessLists,
  createEmptySimulation,
  createInitialStates,
  finalizeResult,
  markLastSegmentFlag,
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
      running = readyQueue.shift() ?? null;
      quantumUsed = 0;
      if (running !== null) {
        events.push({
          time: currentTime,
          type: 'dispatch',
          processId: running.id,
          message: `${running.id} is at the front of the line, so it gets the CPU for up to ${formatUnits(timeQuantum)}.`,
        });
      } else {
        events.push({
          time: currentTime,
          type: 'idle',
          processId: null,
          message: 'The CPU is idle because the line is empty.',
        });
      }
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

    if (running !== null) {
      appendTickToTimeline(
        timeline,
        running.id,
        currentTime,
        `Round Robin FIFO slice (Time Quantum=${timeQuantum})`,
      );
      running.remaining -= 1;
      quantumUsed += 1;

      const nextTime = currentTime + 1;
      enqueueArrivalsForTick(states, readyQueue, enqueuedIds, nextTime);

      if (running.remaining === 0) {
        running.completed = true;
        completedCount += 1;
        markLastSegmentFlag(timeline, 'completed');
        pendingEvents.push({
          time: nextTime,
          type: 'complete',
          processId: running.id,
          message: `${running.id} finishes its work at time ${nextTime}.`,
        });
        running = null;
        quantumUsed = 0;
      } else if (quantumUsed === timeQuantum) {
        if (readyQueue.length > 0) {
          markLastSegmentFlag(timeline, 'preempted');
          readyQueue.push(running);
          pendingEvents.push({
            time: nextTime,
            type: 'preempt',
            processId: running.id,
            message: `${running.id} used up its time slice, so it goes to the back of the line behind ${readyQueue.slice(0, -1).map((item) => item.id).join(', ')}.`,
          });
          running = null;
          quantumUsed = 0;
        } else {
          pendingEvents.push({
            time: nextTime,
            type: 'quantum',
            processId: running.id,
            message: `${running.id} used up its time slice, but nobody else is waiting, so it keeps the CPU.`,
          });
          quantumUsed = 0;
        }
      }
    } else {
      appendTickToTimeline(timeline, null, currentTime, 'Ready queue empty');
      enqueueArrivalsForTick(states, readyQueue, enqueuedIds, currentTime + 1);
    }

    currentTime += 1;
  }

  ticks.push(buildFinalSnapshot(states, currentTime, pendingEvents));
  return finalizeResult('rr', processes, timeline, ticks, timeQuantum);
}
