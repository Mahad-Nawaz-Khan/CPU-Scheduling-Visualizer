export type AlgorithmId =
  | 'fcfs'
  | 'sjf'
  | 'srtf'
  | 'priority-np'
  | 'priority-p'
  | 'rr';

export type AppView = 'simulate' | 'compare' | 'learn';

export type PlaybackSpeed = 0.5 | 1 | 2 | 4;

export type ThemeMode = 'dark' | 'light';

export type EditableProcessField = 'arrivalTime' | 'burstTime' | 'priority';

export type TokenMetric = 'arrival' | 'remaining' | 'priority';

export interface ProcessInput {
  id: string;
  pidOrder: number;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  colorIndex: number;
}

export interface TimelineSegment {
  processId: string | null;
  startTime: number;
  endTime: number;
  duration: number;
  preemptedAtEnd: boolean;
  completedAtEnd: boolean;
  reason: string;
}

export type DecisionEventType =
  | 'arrival'
  | 'dispatch'
  | 'preempt'
  | 'quantum'
  | 'complete'
  | 'idle';

export interface DecisionEvent {
  time: number;
  type: DecisionEventType;
  processId: string | null;
  message: string;
}

export interface TickSnapshot {
  time: number;
  runningProcessId: string | null;
  readyQueueIds: string[];
  remainingBurst: Record<string, number>;
  completedIds: string[];
  notArrivedIds: string[];
  events: DecisionEvent[];
}

export interface ProcessMetrics {
  id: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  colorIndex: number;
  firstStartTime: number;
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
  responseTime: number;
  preemptions: number;
}

export interface SummaryMetrics {
  totalProcesses: number;
  totalBurstTime: number;
  makespan: number;
  totalIdleTime: number;
  cpuUtilization: number;
  throughput: number;
  preemptionCount: number;
  contextSwitches: number;
  averageWaitingTime: number;
  averageTurnaroundTime: number;
  averageResponseTime: number;
}

export interface SimulationResult {
  algorithmId: AlgorithmId;
  timeQuantum?: number;
  timeline: TimelineSegment[];
  ticks: TickSnapshot[];
  processMetrics: ProcessMetrics[];
  summary: SummaryMetrics;
}

export type BehaviorLabel = 'Runs to completion' | 'Can interrupt';

export interface AlgorithmMeta {
  id: AlgorithmId;
  name: string;
  shortName: string;
  preemptive: boolean;
  badgeLabel: 'Non-Preemptive' | 'Preemptive';
  behaviorLabel: BehaviorLabel;
  oneLiner: string;
  analogy: string;
  howItDecides: string;
  tieBreakRule: string;
  goodAt: string;
  watchOut: string;
}

export interface ProcessColorSpec {
  name: string;
  hex: string;
}

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  recommendedAlgorithm: AlgorithmId;
  processes: ProcessInput[];
}
