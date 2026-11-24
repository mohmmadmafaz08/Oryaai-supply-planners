import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/cn';
import { MAX_COMBOBOX_RESULTS } from '@/lib/constants';
import { formatCount } from '@/lib/format';

export interface ComboboxOption {
  value: string;
  label: string;
  keywords?: string;
}

export interface SearchableComboboxProps {
  id: string;
  ariaLabel: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText?: string;
  className?: string;
}

/**
 * Searchable combobox backed by shadcn Command + Popover that renders at most 50 matches
 * so 3,000+ SKU or location datasets stay responsive without unbounded DOM lists.
 */
export function SearchableCombobox({
  id,
  ariaLabel,
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText = 'No matches found.',
  className,
}: SearchableComboboxProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const selectedOption = options.find((opt) => opt.value === value);

  const { visibleOptions, totalMatches } = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    const matched =
      query.length === 0
        ? options
        : options.filter((opt) => {
            const haystack = `${opt.value} ${opt.label} ${opt.keywords ?? ''}`.toLowerCase();
            return haystack.includes(query);
          });
    return {
      visibleOptions: matched.slice(0, MAX_COMBOBOX_RESULTS),
      totalMatches: matched.length,
    };
  }, [options, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          className={cn('h-9 w-full justify-between px-3 font-normal', className)}
        >
          <span className="truncate text-[13px] text-[var(--text-primary)]">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown
            className="ml-2 h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[260px]">
        <Command shouldFilter={false}>
          <CommandInput value={search} onValueChange={setSearch} placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {visibleOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <Check
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 text-[var(--accent)]',
                      value === option.value ? 'opacity-100' : 'opacity-0',
                    )}
                    aria-hidden="true"
                  />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {totalMatches > MAX_COMBOBOX_RESULTS ? (
            <div className="border-t border-[var(--border-default)] px-2.5 py-1.5 text-[11px] text-[var(--text-muted)] tabular-nums">
              Showing {formatCount(MAX_COMBOBOX_RESULTS)} of {formatCount(totalMatches)} matches.
              Refine search.
            </div>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
