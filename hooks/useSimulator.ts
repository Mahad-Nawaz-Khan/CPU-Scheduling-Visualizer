'use client';

import { useEffect, useMemo, useState } from 'react';
import { runAlgorithm, runAllAlgorithms } from '@/lib/algorithms';
import {
  DEFAULT_QUANTUM,
  MAX_PROCESS_COUNT,
  PLAYBACK_SPEED_INTERVAL_MS,
  PROCESS_PALETTE,
} from '@/lib/constants';
import { exportComparisonCsv, exportSingleSimulationCsv } from '@/lib/csvExport';
import {
  PRESET_SCENARIOS,
  cloneProcesses,
  generateRandomProcesses,
  getDefaultProcesses,
} from '@/lib/presets';
import type {
  AlgorithmId,
  EditableProcessField,
  PlaybackSpeed,
  ProcessInput,
} from '@/lib/types';

const SHOW_FINAL_STATE = Number.POSITIVE_INFINITY;

export function useSimulator() {
  const [processes, setProcesses] = useState<ProcessInput[]>(getDefaultProcesses);
  const [presetId, setPresetId] = useState<string>(PRESET_SCENARIOS[0].id);
  const [algorithmId, setAlgorithmId] = useState<AlgorithmId>('fcfs');
  const [timeQuantum, setTimeQuantum] = useState<number>(DEFAULT_QUANTUM);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [requestedTime, setRequestedTime] = useState<number>(SHOW_FINAL_STATE);

  const result = useMemo(
    () => runAlgorithm(algorithmId, processes, timeQuantum),
    [algorithmId, processes, timeQuantum],
  );
  const comparison = useMemo(
    () => runAllAlgorithms(processes, timeQuantum),
    [processes, timeQuantum],
  );

  const makespan = result.summary.makespan;
  const currentTime = Math.min(requestedTime, makespan);

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }
    if (currentTime >= makespan) {
      setIsPlaying(false);
      return undefined;
    }
    const timer = window.setTimeout(
      () => setRequestedTime(currentTime + 1),
      PLAYBACK_SPEED_INTERVAL_MS[speed],
    );
    return () => window.clearTimeout(timer);
  }, [isPlaying, currentTime, makespan, speed]);

  function showFinalState() {
    setIsPlaying(false);
    setRequestedTime(SHOW_FINAL_STATE);
  }

  function seek(time: number) {
    setIsPlaying(false);
    setRequestedTime(Math.min(Math.max(time, 0), makespan));
  }

  function replaceProcesses(next: ProcessInput[], nextPresetId: string) {
    setProcesses(next);
    setPresetId(nextPresetId);
    showFinalState();
  }

  function selectAlgorithm(id: AlgorithmId) {
    setAlgorithmId(id);
    showFinalState();
  }

  function changeQuantum(quantum: number) {
    setTimeQuantum(quantum);
    showFinalState();
  }

  function loadPreset(id: string) {
    const preset = PRESET_SCENARIOS.find((item) => item.id === id);
    if (preset) {
      replaceProcesses(cloneProcesses(preset.processes), preset.id);
    }
  }

  function addProcess() {
    if (processes.length >= MAX_PROCESS_COUNT) {
      return;
    }
    const nextOrder = processes.reduce((highest, item) => Math.max(highest, item.pidOrder), 0) + 1;
    const latestArrival = processes.reduce((latest, item) => Math.max(latest, item.arrivalTime), 0);
    const nextProcess: ProcessInput = {
      id: `P${nextOrder}`,
      pidOrder: nextOrder,
      arrivalTime: latestArrival,
      burstTime: 3,
      priority: 2,
      colorIndex: (nextOrder - 1) % PROCESS_PALETTE.length,
    };
    replaceProcesses([...processes, nextProcess], 'custom');
  }

  function updateProcess(id: string, field: EditableProcessField, value: number) {
    const next = processes.map((item) => (item.id === id ? { ...item, [field]: value } : item));
    replaceProcesses(next, 'custom');
  }

  function removeProcess(id: string) {
    if (processes.length > 1) {
      replaceProcesses(processes.filter((item) => item.id !== id), 'custom');
    }
  }

  function randomize() {
    replaceProcesses(generateRandomProcesses(5), 'custom');
  }

  function togglePlay() {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (makespan === 0) {
      return;
    }
    if (currentTime >= makespan) {
      setRequestedTime(0);
    }
    setIsPlaying(true);
  }

  return {
    processes,
    presetId,
    algorithmId,
    timeQuantum,
    speed,
    isPlaying,
    currentTime,
    makespan,
    result,
    comparison,
    selectAlgorithm,
    changeQuantum,
    loadPreset,
    addProcess,
    updateProcess,
    removeProcess,
    randomize,
    togglePlay,
    seek,
    setSpeed,
    stepBack: () => seek(currentTime - 1),
    stepForward: () => seek(currentTime + 1),
    restart: () => seek(0),
    jumpToEnd: () => seek(makespan),
    exportResults: () => exportSingleSimulationCsv(result),
    exportComparison: () => exportComparisonCsv(comparison, timeQuantum),
  };
}

export type SimulatorState = ReturnType<typeof useSimulator>;
