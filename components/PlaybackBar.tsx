'use client';

import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import type { PlaybackSpeed } from '@/lib/types';

interface PlaybackBarProps {
  currentTime: number;
  makespan: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  onTogglePlay: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onRestart: () => void;
  onJumpToEnd: () => void;
  onSeek: (time: number) => void;
  onChangeSpeed: (speed: PlaybackSpeed) => void;
}

const SPEED_OPTIONS: PlaybackSpeed[] = [0.5, 1, 2, 4];
const SPEED_BY_VALUE: Record<string, PlaybackSpeed> = { '0.5': 0.5, '1': 1, '2': 2, '4': 4 };

export function PlaybackBar({
  currentTime,
  makespan,
  isPlaying,
  speed,
  onTogglePlay,
  onStepBack,
  onStepForward,
  onRestart,
  onJumpToEnd,
  onSeek,
  onChangeSpeed,
}: PlaybackBarProps) {
  const atStart = currentTime <= 0;
  const atEnd = currentTime >= makespan;
  const PlayIcon = isPlaying ? Pause : Play;

  let playLabel = 'Play';
  if (isPlaying) {
    playLabel = 'Pause';
  } else if (atEnd) {
    playLabel = 'Replay';
  }

  return (
    <div className="flex flex-col gap-4 border-t pt-5 md:flex-row md:items-center">
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="btn btn-icon btn-ghost"
          onClick={onRestart}
          disabled={atStart}
          aria-label="Back to the start"
          title="Back to the start"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn btn-icon btn-ghost"
          onClick={onStepBack}
          disabled={atStart}
          aria-label="Back one step"
          title="Back one step"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn btn-primary w-28"
          onClick={onTogglePlay}
          disabled={makespan === 0}
        >
          <PlayIcon className="h-4 w-4" aria-hidden="true" />
          {playLabel}
        </button>
        <button
          type="button"
          className="btn btn-icon btn-ghost"
          onClick={onStepForward}
          disabled={atEnd}
          aria-label="Forward one step"
          title="Forward one step"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn btn-icon btn-ghost"
          onClick={onJumpToEnd}
          disabled={atEnd}
          aria-label="Jump to the end"
          title="Jump to the end"
        >
          <SkipForward className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-1 items-center gap-3">
        <label htmlFor="time-slider" className="sr-only">
          Simulation time
        </label>
        <input
          id="time-slider"
          name="time"
          type="range"
          min={0}
          max={makespan}
          step={1}
          value={currentTime}
          onChange={(event) => onSeek(Number.parseInt(event.target.value, 10))}
          className="w-full cursor-pointer"
        />
        <output htmlFor="time-slider" className="whitespace-nowrap text-sm tabular-nums text-secondary">
          Time <strong className="text-strong">{currentTime}</strong> of {makespan}
        </output>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="speed-select" className="text-sm text-muted">
          Speed
        </label>
        <select
          id="speed-select"
          name="speed"
          className="input"
          value={String(speed)}
          onChange={(event) => {
            const next = SPEED_BY_VALUE[event.target.value];
            if (next !== undefined) {
              onChangeSpeed(next);
            }
          }}
        >
          {SPEED_OPTIONS.map((option) => (
            <option key={option} value={String(option)}>
              {option}×
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
