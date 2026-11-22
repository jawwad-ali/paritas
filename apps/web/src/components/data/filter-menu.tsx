'use client';

import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface FilterMenuProps<T extends string> {
  label: string;
  options: readonly T[];
  labels: Record<T, string>;
  selected: T[] | undefined;
  onChange: (next: T[] | undefined) => void;
}

/** A multi-select filter: the button shows how many values are on, the menu toggles them. */
export const FilterMenu = <T extends string>({
  label,
  options,
  labels,
  selected = [],
  onChange,
}: FilterMenuProps<T>) => {
  const toggle = (option: T, checked: boolean): void => {
    const next = checked ? [...selected, option] : selected.filter((value) => value !== option);
    onChange(next.length > 0 ? next : undefined);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(selected.length > 0 && 'border-primary text-primary')}
        >
          {label}
          {selected.length > 0 && (
            <span className="rounded-sm bg-primary px-1 text-xs text-primary-foreground tabular-nums">
              {selected.length}
            </span>
          )}
          <ChevronDown data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{label}</DropdownMenuLabel>
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={selected.includes(option)}
            onCheckedChange={(checked) => toggle(option, checked === true)}
            onSelect={(event) => event.preventDefault()}
          >
            {labels[option]}
          </DropdownMenuCheckboxItem>
        ))}
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange(undefined)}>
              Clear {label.toLowerCase()}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
