import type {
  AlgorithmId,
  AlgorithmMeta,
  BehaviorLabel,
  PlaybackSpeed,
  ProcessColorSpec,
  ProcessInput,
} from './types';

export const MAX_PROCESS_COUNT = 15;
export const MIN_ARRIVAL_TIME = 0;
export const MAX_ARRIVAL_TIME = 100;
export const MIN_BURST_TIME = 1;
export const MAX_BURST_TIME = 50;
export const MIN_PRIORITY = 1;
export const MAX_PRIORITY = 20;
export const MIN_QUANTUM = 1;
export const MAX_QUANTUM = 20;
export const DEFAULT_QUANTUM = 2;

export const PROCESS_PALETTE: ProcessColorSpec[] = [
  { name: 'Indigo', hex: '#4f46e5' },
  { name: 'Teal', hex: '#0d9488' },
  { name: 'Amber', hex: '#d97706' },
  { name: 'Rose', hex: '#e11d48' },
  { name: 'Sky', hex: '#0284c7' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Orange', hex: '#ea580c' },
  { name: 'Pink', hex: '#db2777' },
  { name: 'Cyan', hex: '#0891b2' },
  { name: 'Lime', hex: '#65a30d' },
  { name: 'Slate', hex: '#475569' },
];

export const ALGORITHM_ORDER: AlgorithmId[] = [
  'fcfs',
  'sjf',
  'srtf',
  'priority-np',
  'priority-p',
  'rr',
];

export const BEHAVIOR_TAG_CLASS: Record<BehaviorLabel, string> = {
  'Runs to completion': 'tag tag-green',
  'Can interrupt': 'tag tag-amber',
};

export const ALGORITHM_META: Record<AlgorithmId, AlgorithmMeta> = {
  fcfs: {
    id: 'fcfs',
    name: 'First Come, First Served',
    shortName: 'FCFS',
    preemptive: false,
    badgeLabel: 'Non-Preemptive',
    behaviorLabel: 'Runs to completion',
    oneLiner: 'Whoever arrives first runs first.',
    analogy:
      'Like the line at a coffee shop: customers are served in the order they walk in, no matter how big their order is.',
    howItDecides:
      'When the CPU is free, it picks the process that arrived earliest and lets it run until it is completely done.',
    tieBreakRule:
      'If two processes arrive at the same moment, the lower-numbered one goes first (P1 before P2).',
    goodAt: 'Simple and predictable. Nobody ever gets skipped.',
    watchOut:
      'One long process at the front makes everyone behind it wait. This is called the "convoy effect".',
  },
  sjf: {
    id: 'sjf',
    name: 'Shortest Job First',
    shortName: 'SJF',
    preemptive: false,
    badgeLabel: 'Non-Preemptive',
    behaviorLabel: 'Runs to completion',
    oneLiner: 'The quickest job goes next.',
    analogy:
      'Like a cashier who serves the customer with the fewest items first, so the line moves faster overall.',
    howItDecides:
      'When the CPU is free, it picks the waiting process that needs the least total CPU time, then lets it finish.',
    tieBreakRule:
      'If two jobs are equally short, the one that arrived first wins. If they also arrived together, the lower number wins.',
    goodAt: 'The lowest average waiting time of any strategy that never interrupts.',
    watchOut:
      'Long jobs can wait a very long time if short jobs keep arriving. It also needs to know job lengths in advance.',
  },
  srtf: {
    id: 'srtf',
    name: 'Shortest Remaining Time First',
    shortName: 'SRTF',
    preemptive: true,
    badgeLabel: 'Preemptive',
    behaviorLabel: 'Can interrupt',
    oneLiner: 'Like Shortest Job First, but a quicker newcomer can interrupt.',
    analogy:
      'Like a cashier who pauses a big order whenever someone arrives with just one item, serves them, then goes back.',
    howItDecides:
      'At every moment, the process with the least work left gets the CPU. A new arrival interrupts only if it needs strictly less time than the running one.',
    tieBreakRule:
      'An equal amount of remaining work never causes an interruption. Otherwise, earliest arrival wins, then the lower number.',
    goodAt: 'The lowest possible average waiting time.',
    watchOut: 'Lots of interruptions, and long jobs can keep getting pushed back.',
  },
  'priority-np': {
    id: 'priority-np',
    name: 'Priority (no interruptions)',
    shortName: 'Priority',
    preemptive: false,
    badgeLabel: 'Non-Preemptive',
    behaviorLabel: 'Runs to completion',
    oneLiner: 'The most urgent process goes next. Priority 1 is the most urgent.',
    analogy:
      'Like a hospital emergency room: the most serious case is seen next, but the doctor finishes with the current patient first.',
    howItDecides:
      'When the CPU is free, it picks the waiting process with the smallest priority number and lets it finish.',
    tieBreakRule:
      'If two processes are equally urgent, the one that arrived first wins, then the lower number.',
    goodAt: 'Important work gets done before background tasks.',
    watchOut:
      'Low-priority processes can wait forever if urgent ones keep coming. This is called "starvation".',
  },
  'priority-p': {
    id: 'priority-p',
    name: 'Priority (with interruptions)',
    shortName: 'Priority+',
    preemptive: true,
    badgeLabel: 'Preemptive',
    behaviorLabel: 'Can interrupt',
    oneLiner: 'A more urgent process can interrupt immediately.',
    analogy:
      'Like an emergency room where a critical patient arriving makes the doctor step away from a minor case right away.',
    howItDecides:
      'At every moment, the process with the smallest priority number runs. A new arrival interrupts only if its priority number is strictly smaller.',
    tieBreakRule:
      'Equal priority never causes an interruption. Otherwise, earliest arrival wins, then the lower number.',
    goodAt: 'Urgent work starts the instant it arrives.',
    watchOut: 'Low-priority processes can starve, and frequent interruptions add overhead.',
  },
  rr: {
    id: 'rr',
    name: 'Round Robin',
    shortName: 'RR',
    preemptive: true,
    badgeLabel: 'Preemptive',
    behaviorLabel: 'Can interrupt',
    oneLiner: 'Everyone takes turns for a fixed time slice.',
    analogy:
      'Like friends sharing one game controller: each person plays for a few minutes, then passes it to the next person in line.',
    howItDecides:
      'Processes wait in a line. The one at the front runs for at most one time slice (the "quantum"), then goes to the back of the line if it still has work left.',
    tieBreakRule:
      'A process that arrives at the exact moment a time slice ends joins the line before the process whose slice just ended.',
    goodAt: 'Fair and responsive. Every process gets a turn quickly.',
    watchOut:
      'A tiny time slice means constant switching. A huge one makes it behave just like First Come, First Served.',
  },
};

export const PLAYBACK_SPEED_INTERVAL_MS: Record<PlaybackSpeed, number> = {
  0.5: 1400,
  1: 750,
  2: 380,
  4: 180,
};

export function getProcessColor(colorIndex: number): ProcessColorSpec {
  const safeIndex = Math.abs(colorIndex) % PROCESS_PALETTE.length;
  return PROCESS_PALETTE[safeIndex];
}

export function buildProcessColorMap(processes: ProcessInput[]): Map<string, number> {
  return new Map(processes.map((process) => [process.id, process.colorIndex]));
}
