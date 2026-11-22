import type { ExceptionSeverity } from '@paritas/shared';
import { cn } from '@/lib/utils';
import { SEVERITY_STYLES, SEVERITY_TICKS } from './severity.config';

interface SeverityMeterProps {
  severity: ExceptionSeverity;
  className?: string;
}

/** Four ticks filled up to the level: the severity ladder in miniature. */
export const SeverityMeter = ({ severity, className }: SeverityMeterProps) => {
  const { level, tick } = SEVERITY_STYLES[severity];
  return (
    <span aria-hidden="true" className={cn('inline-flex items-end gap-px', className)}>
      {Array.from({ length: SEVERITY_TICKS }, (_, index) => (
        <span
          key={index}
          className={cn('w-[3px] rounded-[1px]', index < level ? tick : 'bg-current opacity-20')}
          style={{ height: `${5 + index * 2}px` }}
        />
      ))}
    </span>
  );
};

interface SeverityBadgeProps {
  severity: ExceptionSeverity;
  className?: string;
}

export const SeverityBadge = ({ severity, className }: SeverityBadgeProps) => {
  const style = SEVERITY_STYLES[severity];
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1.5 rounded-sm px-1.5 text-xs font-medium',
        style.badge,
        className,
      )}
    >
      <SeverityMeter severity={severity} />
      {style.label}
    </span>
  );
};
