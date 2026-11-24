import { RotateCcw } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export interface SimulatorControlRowProps {
  id: string;
  label: string;
  formattedValue: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  onChange: (nextValue: number) => void;
}

/**
 * Keyboard-operable parameter slider row with label, formatted value readout, and reset button.
 */
export function SimulatorControlRow({
  id,
  label,
  formattedValue,
  value,
  defaultValue,
  min,
  max,
  step,
  onChange,
}: SimulatorControlRowProps): React.ReactElement {
  const isModified = value !== defaultValue;

  return (
    <div className="space-y-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-subtle)] p-3">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-[var(--text-primary)]">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold tabular-nums text-[var(--text-primary)]">
            {formattedValue}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={!isModified}
            onClick={() => {
              onChange(defaultValue);
            }}
            aria-label={`Reset ${label}`}
            className="h-6 px-1.5 text-[11px]"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      <Slider
        id={id}
        ariaLabel={label}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(values) => {
          const next = values[0];
          if (next !== undefined) {
            onChange(next);
          }
        }}
      />
    </div>
  );
}
