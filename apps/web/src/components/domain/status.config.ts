import type { ExceptionStatus, ExceptionType, ReconciliationStatus } from '@paritas/shared';
import {
  ArrowLeftRight,
  CircleCheck,
  Circle,
  CircleDashed,
  CircleSlash,
  Clock,
  Copy,
  CircleHelp,
  Link2,
  type LucideIcon,
  CircleMinus,
  Scale,
  SearchCheck,
  SearchX,
  TriangleAlert,
} from 'lucide-react';

interface StatusStyle {
  label: string;
  icon: LucideIcon;
  className: string;
}

/** Exception workflow states: open work reads strong, closed work recedes. */
export const EXCEPTION_STATUS_STYLES: Record<ExceptionStatus, StatusStyle> = {
  OPEN: { label: 'Open', icon: Circle, className: 'text-foreground' },
  INVESTIGATING: { label: 'Investigating', icon: SearchCheck, className: 'text-primary' },
  RESOLVED: { label: 'Resolved', icon: CircleCheck, className: 'text-matched-fg' },
  IGNORED: { label: 'Ignored', icon: CircleSlash, className: 'text-muted-foreground' },
};

/** Where a single record stands in reconciliation. */
export const RECONCILIATION_STATUS_STYLES: Record<ReconciliationStatus, StatusStyle> = {
  MATCHED: { label: 'Matched', icon: Link2, className: 'bg-matched-bg text-matched-fg' },
  UNMATCHED: {
    label: 'Unmatched',
    icon: CircleDashed,
    className: 'bg-muted text-muted-foreground',
  },
  EXCEPTION: {
    label: 'In exception',
    icon: TriangleAlert,
    className: 'bg-sev-high-bg text-sev-high-fg',
  },
  EXCLUDED: {
    label: 'Excluded',
    icon: CircleMinus,
    className: 'bg-muted text-muted-foreground',
  },
};

export const EXCEPTION_TYPE_ICONS: Record<ExceptionType, LucideIcon> = {
  MISSING: SearchX,
  AMOUNT_MISMATCH: Scale,
  DUPLICATE: Copy,
  STATUS_CONFLICT: ArrowLeftRight,
  DELAYED: Clock,
  LOW_CONFIDENCE_MATCH: CircleHelp,
  OTHER: TriangleAlert,
};
