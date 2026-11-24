import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/cn';

export function Command({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive>): React.ReactElement {
  return (
    <CommandPrimitive
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-md bg-[var(--bg-surface)] text-[var(--text-primary)]',
        className,
      )}
      {...props}
    />
  );
}

export function CommandInput({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>): React.ReactElement {
  return (
    <div className="flex items-center border-b border-[var(--border-default)] px-2.5">
      <Search className="mr-2 h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
      <CommandPrimitive.Input
        className={cn(
          'flex h-8 w-full bg-transparent py-1.5 text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function CommandList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>): React.ReactElement {
  return (
    <CommandPrimitive.List
      className={cn('max-h-60 overflow-y-auto overflow-x-hidden p-1', className)}
      {...props}
    />
  );
}

export function CommandEmpty(
  props: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>,
): React.ReactElement {
  return (
    <CommandPrimitive.Empty
      className="py-4 text-center text-xs text-[var(--text-muted)]"
      {...props}
    />
  );
}

export function CommandGroup({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>): React.ReactElement {
  return (
    <CommandPrimitive.Group
      className={cn('overflow-hidden text-[var(--text-primary)]', className)}
      {...props}
    />
  );
}

export function CommandItem({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>): React.ReactElement {
  return (
    <CommandPrimitive.Item
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded px-2 py-1.5 text-[13px] text-[var(--text-primary)] outline-none data-[selected=true]:bg-[var(--bg-hover)] data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
