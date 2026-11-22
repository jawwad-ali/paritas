import { ArrowLeftRight, Check, FileText } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { SeverityBadge } from '@/components/domain/severity-badge';
import { cn } from '@/lib/utils';
import {
  CLOSE_TIME_SAMPLE,
  DAILY_SAMPLE,
  DECISION_SAMPLE,
  EVENT_SAMPLE,
  EXCEPTION_SAMPLE,
  MATCH_RATE_SAMPLE,
  MATCH_SAMPLE,
  QUEUE_SAMPLE,
  REPORT_SAMPLE,
} from './collage.data';

/** Where a piece sits, in % of the collage, so every set keeps one composition. */
export interface PiecePlacement {
  left: string;
  top: string;
  width?: string;
  right?: string;
  bottom?: string;
}

/** The three slots every set fills: a large card on the field, a middle card, the corner chip. */
export const PLACEMENTS = {
  lead: { left: '6%', top: '6%', width: '68%' },
  middle: { left: '44%', top: '46%', width: '52%' },
  /** Ends at 96% × 96%: the pause control sits on this corner. */
  corner: { left: '20%', top: '77%', right: '4%', bottom: '4%' },
} satisfies Record<string, PiecePlacement>;

const Piece = ({
  placement,
  className,
  children,
}: {
  placement: PiecePlacement;
  className?: string;
  children: ReactNode;
}) => (
  <div
    style={placement as CSSProperties}
    className={cn(
      'absolute rounded-md border border-white/10 bg-card text-sm text-card-foreground shadow-2xl shadow-black/40',
      className,
    )}
  >
    {children}
  </div>
);

const PieceHeader = ({ title, aside }: { title: ReactNode; aside?: ReactNode }) => (
  <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
    <span className="font-medium">{title}</span>
    {aside}
  </div>
);

const Mono = ({ children }: { children: ReactNode }) => (
  <span className="font-mono text-[13px] text-muted-foreground">{children}</span>
);

/* ── Set 1: matching ─────────────────────────────────────── */

const MatchCard = () => (
  <Piece placement={PLACEMENTS.lead}>
    <PieceHeader
      title={
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex size-5 items-center justify-center rounded-sm bg-matched-bg text-matched-fg">
            <Check className="size-3.5" />
          </span>
          Matched
        </span>
      }
      aside={
        <span className="inline-flex items-center gap-1.5">
          <Mono>{MATCH_SAMPLE.gatewayId}</Mono>
          <ArrowLeftRight className="size-3 text-muted-foreground" />
          <Mono>{MATCH_SAMPLE.ledgerId}</Mono>
        </span>
      }
    />
    <dl className="grid grid-cols-[5.5rem_1fr_1fr] gap-x-3 gap-y-2.5 px-4 py-3">
      <span />
      <span className="text-xs tracking-wide text-muted-foreground uppercase">Stripe</span>
      <span className="text-xs tracking-wide text-muted-foreground uppercase">Ledger</span>
      {MATCH_SAMPLE.fields.map((field) => (
        <div key={field.label} className="contents">
          <dt className="text-muted-foreground">{field.label}</dt>
          <dd className="truncate">{field.gateway}</dd>
          <dd className="truncate">{field.ledger}</dd>
        </div>
      ))}
    </dl>
    <div className="flex items-center gap-4 border-t border-white/10 px-4 py-3">
      <span className="font-medium text-matched-fg">Score {MATCH_SAMPLE.score}</span>
      {MATCH_SAMPLE.signals.map((signal) => (
        <span key={signal.label} className="flex flex-1 items-center gap-2 text-muted-foreground">
          {signal.label}
          <span className="h-1 flex-1 rounded-full bg-white/10">
            <span
              className="block h-full rounded-full bg-series-settled"
              style={{ width: `${signal.value * 100}%` }}
            />
          </span>
        </span>
      ))}
    </div>
  </Piece>
);

const EventCard = () => (
  <Piece placement={PLACEMENTS.middle}>
    <PieceHeader title="Stripe webhook" aside={<Mono>200 OK</Mono>} />
    <div className="space-y-3 px-4 py-3">
      <Mono>{EVENT_SAMPLE.type}</Mono>
      <ol className="flex items-center gap-2">
        {EVENT_SAMPLE.steps.map((step, index) => (
          <li key={step} className="flex items-center gap-2">
            {index > 0 && <span className="h-px w-4 bg-white/20" />}
            <span className="inline-flex items-center gap-1 rounded-sm bg-white/5 px-2 py-1">
              <Check className="size-3 text-matched-fg" />
              {step}
            </span>
          </li>
        ))}
      </ol>
    </div>
  </Piece>
);

const sparkPoints = (values: readonly number[], width: number, height: number): string => {
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
};

const MatchRateChip = () => (
  <Piece placement={PLACEMENTS.corner} className="flex items-center justify-between gap-4 px-4">
    <span className="space-y-1">
      <span className="block text-muted-foreground">{MATCH_RATE_SAMPLE.label}</span>
      <span className="block text-3xl font-bold tracking-tight">{MATCH_RATE_SAMPLE.value}</span>
    </span>
    <svg viewBox="0 0 120 40" className="h-10 w-30 overflow-visible">
      <polyline
        points={sparkPoints(MATCH_RATE_SAMPLE.trend, 120, 40)}
        fill="none"
        stroke="var(--series-settled)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  </Piece>
);

/* ── Set 2: exceptions ───────────────────────────────────── */

const ExceptionCard = () => (
  <Piece placement={PLACEMENTS.lead}>
    <PieceHeader
      title={
        <span>
          <Mono>{EXCEPTION_SAMPLE.number}</Mono>
          <span className="ml-2">{EXCEPTION_SAMPLE.type}</span>
        </span>
      }
      aside={<SeverityBadge severity="HIGH" />}
    />
    <div className="grid grid-cols-2 gap-3 px-4 py-3">
      <span className="space-y-1">
        <span className="block text-xs tracking-wide text-muted-foreground uppercase">Stripe</span>
        <span className="block text-xl font-medium">{EXCEPTION_SAMPLE.gateway}</span>
      </span>
      <span className="space-y-1">
        <span className="block text-xs tracking-wide text-muted-foreground uppercase">Ledger</span>
        <span className="block text-xl font-medium text-sev-high-fg">
          {EXCEPTION_SAMPLE.ledger}
        </span>
      </span>
    </div>
    <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
      <span className="text-muted-foreground">{EXCEPTION_SAMPLE.difference}</span>
    </div>
    <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3 text-muted-foreground">
      <span className="inline-flex size-6 items-center justify-center rounded-sm bg-white/10 text-[11px] font-bold text-foreground">
        CR
      </span>
      Assigned to {EXCEPTION_SAMPLE.assignee}
    </div>
  </Piece>
);

const DecisionCard = () => (
  <Piece placement={PLACEMENTS.middle}>
    <PieceHeader title={DECISION_SAMPLE.title} />
    <div className="space-y-3 px-4 py-3">
      <span className="block text-xs text-muted-foreground">Reason</span>
      <span className="block rounded-sm border border-white/15 bg-white/5 px-3 py-2 leading-snug">
        {DECISION_SAMPLE.reason}
      </span>
      <span className="flex justify-end">
        <span className="rounded-sm bg-primary px-3 py-1.5 font-medium text-primary-foreground">
          Resolve
        </span>
      </span>
    </div>
  </Piece>
);

const QueueChip = () => (
  <Piece placement={PLACEMENTS.corner} className="flex items-center justify-around gap-4 px-4">
    {QUEUE_SAMPLE.map((count) => (
      <span key={count.label} className="space-y-1 text-center">
        <span className="block text-3xl font-bold tracking-tight">{count.value}</span>
        <span className="block text-muted-foreground">{count.label}</span>
      </span>
    ))}
  </Piece>
);

/* ── Set 3: reports ──────────────────────────────────────── */

const CHART_HEIGHT = 120;

const DailyChartCard = () => {
  const max = Math.max(...DAILY_SAMPLE.map((day) => day.settled + day.attention));
  return (
    <Piece placement={PLACEMENTS.lead}>
      <PieceHeader
        title="Records per day"
        aside={
          <span className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-[2px] bg-series-settled" />
              Matched
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-[2px] bg-series-attention" />
              Needs review
            </span>
          </span>
        }
      />
      <div className="flex items-end gap-3 px-4 pt-4 pb-3" style={{ height: CHART_HEIGHT + 44 }}>
        {DAILY_SAMPLE.map((day) => (
          <span key={day.day} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className="flex w-full flex-col justify-end gap-0.5"
              style={{ height: CHART_HEIGHT }}
            >
              <span
                className="rounded-t-[3px] bg-series-attention"
                style={{ height: (day.attention / max) * CHART_HEIGHT }}
              />
              <span
                className="bg-series-settled"
                style={{ height: (day.settled / max) * CHART_HEIGHT }}
              />
            </span>
            <span className="text-xs text-muted-foreground">{day.day}</span>
          </span>
        ))}
      </div>
    </Piece>
  );
};

const ReportCard = () => (
  <Piece placement={PLACEMENTS.middle}>
    <PieceHeader
      title={
        <span className="inline-flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          {REPORT_SAMPLE.title}
        </span>
      }
    />
    <div className="space-y-3 px-4 py-3">
      <span className="block">
        {REPORT_SAMPLE.period}
        <span className="text-muted-foreground"> · {REPORT_SAMPLE.timeZone}</span>
      </span>
      <span className="flex gap-2">
        <span className="rounded-sm bg-primary px-3 py-1.5 font-medium text-primary-foreground">
          PDF
        </span>
        <span className="rounded-sm border border-white/15 px-3 py-1.5 font-medium">CSV</span>
      </span>
    </div>
  </Piece>
);

const CloseTimeChip = () => (
  <Piece placement={PLACEMENTS.corner} className="flex items-center justify-between gap-4 px-4">
    <span className="space-y-1">
      <span className="block text-muted-foreground">{CLOSE_TIME_SAMPLE.label}</span>
      <span className="block text-3xl font-bold tracking-tight">{CLOSE_TIME_SAMPLE.value}</span>
    </span>
    <span className="text-muted-foreground">{CLOSE_TIME_SAMPLE.closed}</span>
  </Piece>
);

/** Matching, then exceptions, then reports: what Paritas does, in the order it happens. */
export const COLLAGE_SETS = [
  { id: 'matching', pieces: [MatchCard, EventCard, MatchRateChip] },
  { id: 'exceptions', pieces: [ExceptionCard, DecisionCard, QueueChip] },
  { id: 'reports', pieces: [DailyChartCard, ReportCard, CloseTimeChip] },
] as const;
