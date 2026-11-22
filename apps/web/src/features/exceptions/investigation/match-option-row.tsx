import { Money } from '@/components/domain/money';
import { Identifier } from '@/components/domain/identifier';
import { formatDateTime } from '@/lib/format/time';
import { cn } from '@/lib/utils';
import type { MatchOption } from './match-options';

interface MatchOptionRowProps {
  option: MatchOption;
  selected: boolean;
  onSelect: () => void;
}

const SIGNALS = [
  ['amount', 'Amount'],
  ['customer', 'Customer'],
  ['time', 'Time'],
] as const;

/** One possible counterpart: what it is, how close it is, and why. */
export const MatchOptionRow = ({ option, selected, onSelect }: MatchOptionRowProps) => {
  const { counterpart, breakdown } = option;
  return (
    <label
      className={cn(
        'flex cursor-pointer gap-3 rounded-md border p-3 transition-colors hover:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
        selected && 'border-primary bg-accent',
      )}
    >
      <input
        type="radio"
        name="match-option"
        checked={selected}
        onChange={onSelect}
        className="mt-1 size-4 accent-[var(--primary)]"
      />
      <span className="min-w-0 flex-1 space-y-1.5">
        <span className="flex flex-wrap items-center justify-between gap-2">
          <Identifier value={counterpart.externalId} />
          <Money
            amountMinor={counterpart.amountMinor}
            currency={counterpart.currency}
            className="font-medium"
          />
        </span>
        <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{counterpart.source.name}</span>
          <span>{formatDateTime(counterpart.occurredAt)}</span>
          {counterpart.customerRef && <span className="truncate">{counterpart.customerRef}</span>}
        </span>
        <span className="flex flex-wrap items-center gap-2 text-xs">
          {option.isOwnPair && (
            <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
              The suggested pair
            </span>
          )}
          {option.referenceMatches && (
            <span className="rounded-sm bg-matched-bg px-1.5 py-0.5 font-medium text-matched-fg">
              Same reference
            </span>
          )}
          {breakdown && (
            <>
              <span className="font-medium tabular-nums">Score {breakdown.score.toFixed(2)}</span>
              {SIGNALS.map(([key, label]) => (
                <span key={key} className="flex items-center gap-1 text-muted-foreground">
                  {label}
                  <span
                    className="h-1 w-8 overflow-hidden rounded-full bg-muted"
                    aria-hidden="true"
                  >
                    <span
                      className="block h-full bg-primary"
                      style={{ width: `${breakdown[key] * 100}%` }}
                    />
                  </span>
                  <span className="sr-only">{breakdown[key].toFixed(2)}</span>
                </span>
              ))}
            </>
          )}
        </span>
      </span>
    </label>
  );
};
