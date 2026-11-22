import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FigureProps {
  label: string;
  value: ReactNode;
  /** Superscript key pointing to a footnote that says how the number is computed. */
  footnote?: number;
  /** A short comparison line under the value, e.g. "+12 since Monday". */
  change?: ReactNode;
  tone?: 'default' | 'critical';
  className?: string;
}

/**
 * A headline number, set like a statistical release: label, figure, and a
 * footnote key. Paritas explains every number it shows.
 */
export const Figure = ({
  label,
  value,
  footnote,
  change,
  tone = 'default',
  className,
}: FigureProps) => (
  <div className={cn('flex min-w-0 flex-col gap-1 py-3', className)}>
    <dt className="text-xs font-medium text-muted-foreground">
      {label}
      {footnote !== undefined && (
        <sup className="ml-0.5 font-bold text-primary" aria-label={`note ${footnote}`}>
          {footnote}
        </sup>
      )}
    </dt>
    <dd
      className={cn(
        'text-[1.75rem] leading-none font-medium tabular-nums tracking-tight',
        tone === 'critical' && 'text-sev-critical-fg',
      )}
    >
      {value}
    </dd>
    {change && <dd className="text-xs text-muted-foreground tabular-nums">{change}</dd>}
  </div>
);

interface FootnotesProps {
  notes: string[];
  className?: string;
}

/** The notes a row of figures refers to, numbered from 1. */
export const Footnotes = ({ notes, className }: FootnotesProps) => (
  <ol className={cn('flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground', className)}>
    {notes.map((note, index) => (
      <li key={note}>
        <span className="font-bold text-primary">{index + 1}.</span> {note}
      </li>
    ))}
  </ol>
);
