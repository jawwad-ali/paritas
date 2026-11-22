'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/** Radix Select cannot hold an empty value, so "no filter" is this sentinel. */
const ALL = '__all__';

interface SelectFilterProps<T extends string> {
  label: string;
  allLabel: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T | undefined;
  onChange: (value: T | undefined) => void;
}

export const SelectFilter = <T extends string>({
  label,
  allLabel,
  options,
  labels,
  value,
  onChange,
}: SelectFilterProps<T>) => (
  <Select
    value={value ?? ALL}
    onValueChange={(next) =>
      onChange(next === ALL ? undefined : options.find((option) => option === next))
    }
  >
    <SelectTrigger aria-label={label} className="w-full sm:w-44">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value={ALL}>{allLabel}</SelectItem>
      {options.map((option) => (
        <SelectItem key={option} value={option}>
          {labels[option]}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
