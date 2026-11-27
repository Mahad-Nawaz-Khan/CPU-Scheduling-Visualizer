'use client';

import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import type { PlaybackSpeed } from '@/lib/types';

interface PlaybackBarProps {
  currentTime: number;
  makespan: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  onTogglePlay: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onSeek: (time: number) => void;
  onChangeSpeed: (speed: PlaybackSpeed) => void;
}

const NEXT_SPEED: Record<PlaybackSpeed, PlaybackSpeed> = { 0.5: 1, 1: 2, 2: 4, 4: 0.5 };

export function PlaybackBar({
  currentTime,
  makespan,
  isPlaying,
  speed,
  onTogglePlay,
  onStepBack,
  onStepForward,
  onSeek,
  onChangeSpeed,
}: Readonly<PlaybackBarProps>) {
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
    <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="btn btn-icon"
          onClick={onStepBack}
          disabled={atStart}
          aria-label="Back one step"
          title="Back one step"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn btn-primary min-w-[7.5rem]"
          onClick={onTogglePlay}
          disabled={makespan === 0}
        >
          <PlayIcon className="h-4 w-4" aria-hidden="true" />
          {playLabel}
        </button>
        <button
          type="button"
          className="btn btn-icon"
          onClick={onStepForward}
          disabled={atEnd}
          aria-label="Forward one step"
          title="Forward one step"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-1 items-center gap-3.5">
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
          className="scrubber w-full"
        />
        <output
          htmlFor="time-slider"
          className="font-mono-num whitespace-nowrap text-sm text-secondary"
        >
          {String(currentTime).padStart(2, '0')} / {String(makespan).padStart(2, '0')}
        </output>
        <button
          type="button"
          className="btn font-mono-num h-9 px-3 text-xs"
          onClick={() => onChangeSpeed(NEXT_SPEED[speed])}
          aria-label={`Playback speed ${speed} times. Click to change.`}
          title="Change playback speed"
        >
          {speed}×
        </button>
      </div>
    </div>
  );
}
