import { getProcessColor } from '@/lib/constants';

interface ProcessChipProps {
  id: string;
  colorIndex: number;
  prefix?: string;
}

export function ProcessChip({ id, colorIndex, prefix }: Readonly<ProcessChipProps>) {
  const color = getProcessColor(colorIndex);

  return (
    <span className="process-chip">
      {prefix && <span className="text-xs text-muted">{prefix}</span>}
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color.hex }}
        aria-hidden="true"
      />
      <span>{id}</span>
    </span>
  );
}
