'use client';

import { Check, Zap } from 'lucide-react';
import { useMemo } from 'react';
import { TOKEN_METRIC_BY_ALGO, getProcessColor } from '@/lib/constants';
import type { AlgorithmId, ProcessInput, TickSnapshot, TokenMetric } from '@/lib/types';

type SideZone = 'arriving' | 'ready' | 'done';
type Zone = SideZone | 'cpu';

const ZONE_SLOTS: Record<SideZone, number[]> = {
  arriving: [12, 4.5],
  ready: [45.5, 36.5, 27.5],
  done: [83.5, 93.5],
};

const ZONE_FRAMES: Array<{ id: Zone; label: string; from: number; to: number }> = [
  { id: 'arriving', label: 'Not arrived', from: 0, to: 16 },
  { id: 'ready', label: 'Ready queue', from: 19, to: 52 },
  { id: 'cpu', label: 'CPU', from: 55, to: 75 },
  { id: 'done', label: 'Finished', from: 78, to: 100 },
];

const ZONE_TOKEN_STYLE: Record<Zone, { scale: number; opacity: number }> = {
  arriving: { scale: 0.9, opacity: 0.45 },
  ready: { scale: 1, opacity: 1 },
  cpu: { scale: 1.2, opacity: 1 },
  done: { scale: 0.9, opacity: 0.55 },
};

const SIDE_ZONE_ORDER: SideZone[] = ['ready', 'done', 'arriving'];

const ZONE_MEMBERS: Record<SideZone, (snapshot: TickSnapshot) => string[]> = {
  arriving: (snapshot) => snapshot.notArrivedIds,
  ready: (snapshot) => snapshot.readyQueueIds,
  done: (snapshot) => snapshot.completedIds,
};

const METRIC_LABEL: Record<TokenMetric, (process: ProcessInput, remaining: number) => string> = {
  arrival: (process) => `arr ${process.arrivalTime}`,
  remaining: (_process, remaining) => `${remaining}u`,
  priority: (process) => `pri ${process.priority}`,
};

const ARROW_POSITIONS = [17.5, 53.5, 76.5];
const CPU_CENTER = 65;
const ZONE_TOP = 32;
const ZONE_BOTTOM = 10;
const FIRST_ROW_Y = 100;
const ROW_GAP = 46;
const MIN_STAGE_HEIGHT = 196;

interface Placement {
  zone: Zone;
  rank: number;
  x: number;
  y: number;
}

function slotPosition(zone: SideZone, rank: number): { x: number; y: number } {
  const centers = ZONE_SLOTS[zone];
  return {
    x: centers[rank % centers.length],
    y: FIRST_ROW_Y + Math.floor(rank / centers.length) * ROW_GAP,
  };
}

function placeProcess(id: string, snapshot: TickSnapshot): Placement {
  if (snapshot.runningProcessId === id) {
    return { zone: 'cpu', rank: 0, x: CPU_CENTER, y: FIRST_ROW_Y };
  }
  for (const zone of SIDE_ZONE_ORDER) {
    const rank = ZONE_MEMBERS[zone](snapshot).indexOf(id);
    if (rank !== -1) {
      return { zone, rank, ...slotPosition(zone, rank) };
    }
  }
  return { zone: 'arriving', rank: 0, ...slotPosition('arriving', 0) };
}

function computeRows(ticks: TickSnapshot[]): number {
  let rows = 1;
  for (const tick of ticks) {
    rows = Math.max(
      rows,
      Math.ceil(tick.notArrivedIds.length / ZONE_SLOTS.arriving.length),
      Math.ceil(tick.readyQueueIds.length / ZONE_SLOTS.ready.length),
      Math.ceil(tick.completedIds.length / ZONE_SLOTS.done.length),
    );
  }
  return rows;
}

function findKickedOut(snapshot: TickSnapshot, previous: TickSnapshot | undefined): string | null {
  const previousId = previous?.runningProcessId ?? null;
  if (previousId === null || previousId === snapshot.runningProcessId) {
    return null;
  }
  if (!snapshot.readyQueueIds.includes(previousId)) {
    return null;
  }
  return previousId;
}

function tokenDetail(
  process: ProcessInput,
  placement: Placement,
  snapshot: TickSnapshot,
  metric: TokenMetric,
): string | null {
  if (placement.zone === 'done') {
    return null;
  }
  if (placement.zone === 'arriving') {
    return `@${process.arrivalTime}`;
  }
  return METRIC_LABEL[metric](process, snapshot.remainingBurst[process.id] ?? process.burstTime);
}

interface ZoneFrameProps {
  label: string;
  from: number;
  to: number;
  meta: string;
  isCpu: boolean;
  showFront: boolean;
  accentColor?: string;
}

function ZoneFrame({
  label,
  from,
  to,
  meta,
  isCpu,
  showFront,
  accentColor,
}: Readonly<ZoneFrameProps>) {
  return (
    <div
      aria-hidden="true"
      className="absolute rounded-xl border transition-[border-color,box-shadow] duration-300"
      style={{
        top: ZONE_TOP,
        bottom: ZONE_BOTTOM,
        left: `${from}%`,
        width: `${to - from}%`,
        backgroundColor: isCpu ? 'var(--surface)' : 'transparent',
        borderStyle: isCpu ? 'solid' : 'dashed',
        borderColor: accentColor ?? 'var(--border-strong)',
        boxShadow: accentColor ? `0 0 28px -10px ${accentColor}` : 'none',
      }}
    >
      <div className="flex items-center justify-between gap-1 px-2.5 pt-2">
        <span className="font-mono-num truncate text-[0.62rem] uppercase tracking-wider text-muted">
          {label}
        </span>
        <span className="font-mono-num truncate text-[0.62rem] text-muted">{meta}</span>
      </div>
      {showFront && (
        <span className="font-mono-num absolute bottom-2 right-2.5 text-[0.58rem] uppercase tracking-wider text-muted">
          front →
        </span>
      )}
    </div>
  );
}

interface KickBackArcProps {
  height: number;
  targetX: number;
}

function KickBackArc({ height, targetX }: Readonly<KickBackArcProps>) {
  const startY = FIRST_ROW_Y - 34;
  return (
    <>
      <svg
        aria-hidden="true"
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ zIndex: 5 }}
      >
        <path
          d={`M ${CPU_CENTER} ${startY} C ${CPU_CENTER - 2} 14, ${targetX + 2} 14, ${targetX} ${startY}`}
          fill="none"
          stroke="var(--amber-text)"
          strokeWidth="2"
          strokeDasharray="6 6"
          vectorEffect="non-scaling-stroke"
          className="anim-bus-reverse"
        />
      </svg>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          left: `${(CPU_CENTER + targetX) / 2}%`,
          top: 2,
          transform: 'translateX(-50%)',
          zIndex: 7,
        }}
      >
        <span
          className="anim-badge-pop font-mono-num inline-block whitespace-nowrap rounded border px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: 'var(--amber-soft)',
            borderColor: 'var(--amber-text)',
            color: 'var(--amber-text)',
          }}
        >
          ⚡ sent back to the queue
        </span>
      </div>
    </>
  );
}

interface StageTokenProps {
  process: ProcessInput;
  placement: Placement;
  detail: string | null;
  isKicked: boolean;
}

function StageToken({ process, placement, detail, isKicked }: Readonly<StageTokenProps>) {
  const color = getProcessColor(process.colorIndex).hex;
  const zoneStyle = ZONE_TOKEN_STYLE[placement.zone];
  const isRunning = placement.zone === 'cpu';
  const isNext = placement.zone === 'ready' && placement.rank === 0;

  let boxShadow = 'none';
  if (isRunning) {
    boxShadow = `0 0 0 2px #ffffff, 0 0 26px -2px ${color}`;
  }
  if (isKicked) {
    boxShadow = '0 0 0 2px var(--amber-text)';
  }

  return (
    <div
      aria-hidden="true"
      className="stage-token font-mono-num absolute flex h-[2.15rem] w-12 flex-col items-center justify-center rounded-lg text-white"
      style={{
        left: `${placement.x}%`,
        top: `${placement.y}px`,
        backgroundColor: color,
        opacity: zoneStyle.opacity,
        transform: `translate(-50%, -50%) scale(${zoneStyle.scale})`,
        boxShadow,
        zIndex: isRunning ? 6 : 4,
      }}
    >
      <span className="text-[0.78rem] font-semibold leading-none">{process.id}</span>
      {detail && <span className="mt-0.5 text-[0.6rem] leading-none opacity-90">{detail}</span>}
      {placement.zone === 'done' && <Check className="mt-0.5 h-3 w-3" aria-hidden="true" />}
      {isNext && (
        <span className="absolute -top-4 text-[0.58rem] font-semibold uppercase tracking-wider text-accent">
          next
        </span>
      )}
      {isKicked && (
        <span
          className="anim-badge-pop absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--amber-text)' }}
        >
          <Zap className="h-2.5 w-2.5 text-white" aria-hidden="true" />
        </span>
      )}
    </div>
  );
}

interface SchedulerStageProps {
  ticks: TickSnapshot[];
  time: number;
  processes: ProcessInput[];
  algorithmId: AlgorithmId;
}

export function SchedulerStage({
  ticks,
  time,
  processes,
  algorithmId,
}: Readonly<SchedulerStageProps>) {
  const rows = useMemo(() => computeRows(ticks), [ticks]);
  if (ticks.length === 0) {
    return null;
  }

  const index = Math.min(Math.max(time, 0), ticks.length - 1);
  const snapshot = ticks[index];
  const previous = index > 0 ? ticks[index - 1] : undefined;
  const metric = TOKEN_METRIC_BY_ALGO[algorithmId];
  const runningId = snapshot.runningProcessId;
  const runningProcess = processes.find((process) => process.id === runningId);
  const runningColor = runningProcess ? getProcessColor(runningProcess.colorIndex).hex : undefined;
  const remaining = runningId ? (snapshot.remainingBurst[runningId] ?? 0) : 0;
  const progressPct = runningProcess
    ? ((runningProcess.burstTime - remaining) / runningProcess.burstTime) * 100
    : 0;
  const kickedId = findKickedOut(snapshot, previous);
  const kickedTarget = kickedId ? placeProcess(kickedId, snapshot) : null;
  const isNewDispatch = runningId !== null && runningId !== (previous?.runningProcessId ?? null);
  const height = Math.max(MIN_STAGE_HEIGHT, FIRST_ROW_Y + (rows - 1) * ROW_GAP + 64);

  let cpuState = 'idle';
  if (runningId) {
    cpuState = `running ${runningId}`;
  } else if (snapshot.completedIds.length === processes.length) {
    cpuState = 'all done';
  }

  const zoneMeta: Record<Zone, string> = {
    arriving: String(snapshot.notArrivedIds.length),
    ready: String(snapshot.readyQueueIds.length),
    cpu: cpuState,
    done: String(snapshot.completedIds.length),
  };

  return (
    <div className="w-full overflow-x-auto overflow-y-hidden">
      <div className="relative min-w-[620px]" style={{ height }}>
        {ZONE_FRAMES.map((zone) => (
          <ZoneFrame
            key={zone.id}
            label={zone.label}
            from={zone.from}
            to={zone.to}
            meta={zoneMeta[zone.id]}
            isCpu={zone.id === 'cpu'}
            showFront={zone.id === 'ready'}
            accentColor={zone.id === 'cpu' ? runningColor : undefined}
          />
        ))}

        {ARROW_POSITIONS.map((x) => (
          <span
            key={x}
            aria-hidden="true"
            className="font-mono-num absolute text-sm text-muted"
            style={{ left: `${x}%`, top: FIRST_ROW_Y, transform: 'translate(-50%, -50%)' }}
          >
            →
          </span>
        ))}

        {isNewDispatch && (
          <span
            key={`dispatch-${snapshot.time}-${runningId}`}
            aria-hidden="true"
            className="anim-shockwave pointer-events-none absolute rounded-xl border-2"
            style={{
              top: ZONE_TOP,
              bottom: ZONE_BOTTOM,
              left: '55%',
              width: '20%',
              borderColor: runningColor,
            }}
          />
        )}

        {kickedTarget && (
          <KickBackArc
            key={`kick-${snapshot.time}-${kickedId}`}
            height={height}
            targetX={kickedTarget.x}
          />
        )}

        <div
          aria-hidden="true"
          className="absolute"
          style={{ left: '57%', width: '16%', bottom: ZONE_BOTTOM + 10 }}
        >
          <div
            className="h-1.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: 'var(--surface-muted)' }}
          >
            <div
              className="cpu-progress h-full rounded-full"
              style={{
                width: `${progressPct}%`,
                backgroundColor: runningColor ?? 'var(--border-strong)',
              }}
            />
          </div>
        </div>

        {processes.map((process) => {
          const placement = placeProcess(process.id, snapshot);
          return (
            <StageToken
              key={process.id}
              process={process}
              placement={placement}
              detail={tokenDetail(process, placement, snapshot, metric)}
              isKicked={process.id === kickedId}
            />
          );
        })}
      </div>
    </div>
  );
}
