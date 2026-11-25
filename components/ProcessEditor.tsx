'use client';

import { Plus, Shuffle, X } from 'lucide-react';
import {
  MAX_ARRIVAL_TIME,
  MAX_BURST_TIME,
  MAX_PRIORITY,
  MAX_PROCESS_COUNT,
  MIN_ARRIVAL_TIME,
  MIN_BURST_TIME,
  MIN_PRIORITY,
  getProcessColor,
} from '@/lib/constants';
import { PRESET_SCENARIOS, clampInteger } from '@/lib/presets';
import type { EditableProcessField, ProcessInput } from '@/lib/types';

interface FieldConfig {
  field: EditableProcessField;
  label: string;
  hint: string;
  min: number;
  max: number;
  fallback: number;
}

const FIELDS: FieldConfig[] = [
  {
    field: 'arrivalTime',
    label: 'Arrival time',
    hint: 'When it shows up',
    min: MIN_ARRIVAL_TIME,
    max: MAX_ARRIVAL_TIME,
    fallback: 0,
  },
  {
    field: 'burstTime',
    label: 'Burst time',
    hint: 'CPU time it needs',
    min: MIN_BURST_TIME,
    max: MAX_BURST_TIME,
    fallback: 1,
  },
  {
    field: 'priority',
    label: 'Priority',
    hint: '1 = most urgent',
    min: MIN_PRIORITY,
    max: MAX_PRIORITY,
    fallback: 1,
  },
];

interface ProcessEditorProps {
  processes: ProcessInput[];
  presetId: string;
  onLoadPreset: (presetId: string) => void;
  onRandomize: () => void;
  onAdd: () => void;
  onUpdate: (id: string, field: EditableProcessField, value: number) => void;
  onRemove: (id: string) => void;
}

export function ProcessEditor({
  processes,
  presetId,
  onLoadPreset,
  onRandomize,
  onAdd,
  onUpdate,
  onRemove,
}: ProcessEditorProps) {
  const activePreset = PRESET_SCENARIOS.find((preset) => preset.id === presetId);
  const canAdd = processes.length < MAX_PROCESS_COUNT;
  const canRemove = processes.length > 1;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b px-5 py-4">
        <div className="min-w-0 flex-1">
          <label htmlFor="example-select" className="block text-sm font-medium">
            Example scenario
          </label>
          <p className="mt-0.5 text-sm text-muted">
            {activePreset?.description ?? 'You are using your own custom set of processes.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            id="example-select"
            name="example-scenario"
            className="input"
            value={presetId}
            onChange={(event) => onLoadPreset(event.target.value)}
          >
            <option value="custom" disabled>
              Custom
            </option>
            {PRESET_SCENARIOS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          <button type="button" className="btn" onClick={onRandomize}>
            <Shuffle className="h-4 w-4" aria-hidden="true" />
            Randomize
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col" className="align-top">
                <span className="text-sm text-strong">Process</span>
              </th>
              {FIELDS.map((config) => (
                <th key={config.field} scope="col" className="align-top">
                  <span className="block text-sm text-strong">{config.label}</span>
                  <span className="block font-normal">{config.hint}</span>
                </th>
              ))}
              <th scope="col">
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {processes.map((process) => (
              <tr key={process.id}>
                <td>
                  <span className="inline-flex items-center gap-2 font-medium">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: getProcessColor(process.colorIndex).hex }}
                      aria-hidden="true"
                    />
                    {process.id}
                  </span>
                </td>
                {FIELDS.map((config) => (
                  <td key={config.field}>
                    <input
                      type="number"
                      name={`${process.id}-${config.field}`}
                      aria-label={`${process.id} ${config.label.toLowerCase()}`}
                      min={config.min}
                      max={config.max}
                      value={process[config.field]}
                      onChange={(event) =>
                        onUpdate(
                          process.id,
                          config.field,
                          clampInteger(
                            Number.parseInt(event.target.value, 10),
                            config.min,
                            config.max,
                            config.fallback,
                          ),
                        )
                      }
                      className="input w-24 tabular-nums"
                    />
                  </td>
                ))}
                <td className="text-right">
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost"
                    disabled={!canRemove}
                    onClick={() => onRemove(process.id)}
                    aria-label={`Remove ${process.id}`}
                    title={`Remove ${process.id}`}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t px-5 py-3">
        <button type="button" className="btn" onClick={onAdd} disabled={!canAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add process
        </button>
        <span className="text-xs text-muted">
          {processes.length} of {MAX_PROCESS_COUNT} processes
        </span>
      </div>
    </div>
  );
}
