import * as SliderPrimitive from '@radix-ui/react-slider';
import * as React from 'react';
import { cn } from '@/lib/cn';

export interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  ariaLabel?: string;
}

export function Slider({ className, ariaLabel, ...props }: SliderProps): React.ReactElement {
  return (
    <SliderPrimitive.Root
      className={cn('relative flex w-full touch-none select-none items-center py-2', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-[var(--bg-muted)] border border-[var(--border-default)]">
        <SliderPrimitive.Range className="absolute h-full bg-[var(--accent)]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={ariaLabel}
        className="block h-4 w-4 rounded-full border border-[var(--accent)] bg-[var(--bg-surface)] transition-colors duration-150 hover:bg-[var(--accent-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] cursor-pointer"
      />
    </SliderPrimitive.Root>
  );
}
