import {
  EXCEPTION_TYPE_LABELS,
  type ExceptionStatus,
  type ExceptionType,
  type ReconciliationStatus,
} from '@paritas/shared';
import { cn } from '@/lib/utils';
import {
  EXCEPTION_STATUS_STYLES,
  EXCEPTION_TYPE_ICONS,
  RECONCILIATION_STATUS_STYLES,
} from './status.config';

export const ExceptionStatusLabel = ({ status }: { status: ExceptionStatus }) => {
  const { label, icon: Icon, className } = EXCEPTION_STATUS_STYLES[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm', className)}>
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
};

export const ReconciliationStatusBadge = ({ status }: { status: ReconciliationStatus }) => {
  const { label, icon: Icon, className } = RECONCILIATION_STATUS_STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1 rounded-sm px-1.5 text-xs font-medium',
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3" />
      {label}
    </span>
  );
};

export const ExceptionTypeLabel = ({ type }: { type: ExceptionType }) => {
  const Icon = EXCEPTION_TYPE_ICONS[type];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <Icon aria-hidden="true" className="size-3.5 text-muted-foreground" />
      {EXCEPTION_TYPE_LABELS[type]}
    </span>
  );
};
