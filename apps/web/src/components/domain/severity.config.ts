import type { ExceptionSeverity } from '@paritas/shared';

interface SeverityStyle {
  label: string;
  /** 1 (low) to 4 (critical): drawn as filled ticks, so meaning never rests on colour alone. */
  level: number;
  badge: string;
  tick: string;
  /** The 3px leading edge a queue row carries in its severity's colour. */
  edge: string;
}

export const SEVERITY_STYLES: Record<ExceptionSeverity, SeverityStyle> = {
  CRITICAL: {
    label: 'Critical',
    level: 4,
    badge: 'bg-sev-critical-bg text-sev-critical-fg',
    tick: 'bg-sev-critical',
    edge: 'shadow-[inset_3px_0_0_var(--sev-critical)]',
  },
  HIGH: {
    label: 'High',
    level: 3,
    badge: 'bg-sev-high-bg text-sev-high-fg',
    tick: 'bg-sev-high',
    edge: 'shadow-[inset_3px_0_0_var(--sev-high)]',
  },
  MEDIUM: {
    label: 'Medium',
    level: 2,
    badge: 'bg-sev-medium-bg text-sev-medium-fg',
    tick: 'bg-sev-medium',
    edge: 'shadow-[inset_3px_0_0_var(--sev-medium)]',
  },
  LOW: {
    label: 'Low',
    level: 1,
    badge: 'bg-sev-low-bg text-sev-low-fg',
    tick: 'bg-sev-low',
    edge: 'shadow-[inset_3px_0_0_var(--sev-low)]',
  },
};

export const SEVERITY_TICKS = 4;
