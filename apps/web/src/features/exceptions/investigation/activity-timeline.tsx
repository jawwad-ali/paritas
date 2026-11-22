import type { ExceptionActivityDto, ExceptionActivityType } from '@paritas/shared';
import {
  CircleDot,
  Link2,
  type LucideIcon,
  MessageSquare,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { formatDateTime } from '@/lib/format/time';
import { ACTIVITY_LABELS, MATCHING_ENGINE } from './exception-copy';

const ICONS: Record<ExceptionActivityType, LucideIcon> = {
  CREATED: Sparkles,
  STATUS_CHANGED: CircleDot,
  SEVERITY_CHANGED: ShieldAlert,
  ASSIGNED: UserRound,
  NOTE_ADDED: MessageSquare,
  MANUALLY_MATCHED: Link2,
  REOPENED: RotateCcw,
};

const STATE_WORDS: Record<string, string> = {
  OPEN: 'Open',
  INVESTIGATING: 'Investigating',
  RESOLVED: 'Resolved',
  IGNORED: 'Ignored',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

/** "Open → Resolved" for state changes recorded as { from, to }. */
const transition = (data: unknown): string | null => {
  if (typeof data !== 'object' || data === null || !('from' in data) || !('to' in data)) {
    return null;
  }
  const { from, to } = data as { from: unknown; to: unknown };
  if (typeof from !== 'string' || typeof to !== 'string') {
    return null;
  }
  return `${STATE_WORDS[from] ?? from} → ${STATE_WORDS[to] ?? to}`;
};

/** The investigation's full history, oldest first: who did what, when, and why. */
export const ActivityTimeline = ({ activities }: { activities: ExceptionActivityDto[] }) => (
  <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-px before:bg-border">
    {activities.map((activity) => {
      const Icon = ICONS[activity.type];
      const change =
        activity.type === 'STATUS_CHANGED' || activity.type === 'SEVERITY_CHANGED'
          ? transition(activity.data)
          : null;
      return (
        <li key={activity.id} className="relative flex gap-3">
          <span className="z-10 flex size-6 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground">
            <Icon aria-hidden="true" className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1 space-y-0.5 pt-0.5">
            <p className="text-sm">
              <span className="font-medium">{activity.actor?.name ?? MATCHING_ENGINE}</span>
              <span className="text-muted-foreground">
                {' · '}
                {ACTIVITY_LABELS[activity.type]}
                {change && ` · ${change}`}
              </span>
            </p>
            {activity.message && (
              <p
                className={
                  activity.type === 'NOTE_ADDED'
                    ? 'rounded-md bg-muted px-3 py-2 whitespace-pre-wrap'
                    : 'text-muted-foreground'
                }
              >
                {activity.message}
              </p>
            )}
            <time dateTime={activity.createdAt} className="block text-xs text-muted-foreground">
              {formatDateTime(activity.createdAt)}
            </time>
          </div>
        </li>
      );
    })}
  </ol>
);
