import { cn } from '@/lib/utils';

interface ParitasMarkProps {
  className?: string;
}

/**
 * Two equal bars: an equals sign, and two records of one payment set level
 * with each other. Paritas is Latin for parity.
 */
export const ParitasMark = ({ className }: ParitasMarkProps) => (
  <span
    aria-hidden="true"
    className={cn(
      'inline-flex size-7 shrink-0 items-center justify-center rounded-sm bg-sidebar-primary',
      className,
    )}
  >
    <svg viewBox="0 0 24 24" className="size-5" fill="none">
      <rect x="4" y="7" width="16" height="3.25" rx="0.75" fill="#001219" />
      <rect x="4" y="13.75" width="16" height="3.25" rx="0.75" fill="#005f73" />
    </svg>
  </span>
);
