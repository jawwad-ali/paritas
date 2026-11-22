'use client';

import { Input } from '@/components/ui/input';

interface DateRangeFilterProps {
  from: string | undefined;
  to: string | undefined;
  onChange: (range: { from?: string; to?: string }) => void;
}

/** Two native date inputs: keyboard-friendly, localised by the browser, no extra widget. */
export const DateRangeFilter = ({ from, to, onChange }: DateRangeFilterProps) => (
  <div className="flex items-center gap-1.5">
    <Input
      type="date"
      aria-label="From date"
      value={from ?? ''}
      max={to}
      onChange={(event) => onChange({ from: event.target.value || undefined, to })}
      className="w-[9.5rem]"
    />
    <span className="text-muted-foreground" aria-hidden="true">
      –
    </span>
    <Input
      type="date"
      aria-label="To date"
      value={to ?? ''}
      min={from}
      onChange={(event) => onChange({ from, to: event.target.value || undefined })}
      className="w-[9.5rem]"
    />
  </div>
);

/** A calendar day in the viewer's zone as the instant range the API filters on. */
export const dayRangeToInstants = (from?: string, to?: string): { from?: string; to?: string } => ({
  from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
  to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
});
