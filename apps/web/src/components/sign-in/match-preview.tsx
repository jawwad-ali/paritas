import { Check } from 'lucide-react';
import { PREVIEW_FIELDS, PREVIEW_SCORE, PREVIEW_TOTAL_SCORE } from './match-preview.data';

/**
 * The product at work: a Stripe payment and a ledger entry compared field by
 * field, each agreement ticked in turn, then the match and its score. Plays
 * once; with reduced motion everything is shown at rest.
 */
export const MatchPreview = () => (
  <figure
    aria-label="A Stripe payment and a ledger entry matched by Paritas"
    className="overflow-hidden rounded-md border border-white/10 bg-sidebar-accent text-[13px] shadow-2xl shadow-black/40"
  >
    <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
      <span className="font-medium text-sidebar-accent-foreground">Comparing records</span>
      <span className="font-mono text-xs text-sidebar-muted">pi_3QgT8aLk2</span>
    </div>
    <div className="grid grid-cols-[88px_1fr_28px_1fr] items-center gap-x-2 px-4 pt-3 pb-1 text-[11px] font-medium tracking-wide text-sidebar-muted uppercase">
      <span />
      <span>Stripe</span>
      <span />
      <span>Internal ledger</span>
    </div>
    <ul>
      {PREVIEW_FIELDS.map((field, index) => (
        <li
          key={field.label}
          className="grid grid-cols-[88px_1fr_28px_1fr] items-center gap-x-2 border-t border-white/5 px-4 py-2"
        >
          <span className="text-sidebar-muted">{field.label}</span>
          <span className="truncate text-sidebar-accent-foreground tabular-nums">
            {field.gateway}
          </span>
          <span
            className="flex size-5 items-center justify-center rounded-sm bg-sidebar-primary/15 text-sidebar-primary motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-50"
            style={{
              animationDelay: `${600 + index * 220}ms`,
              animationDuration: '300ms',
              animationFillMode: 'both',
            }}
          >
            <Check className="size-3.5" aria-hidden="true" />
          </span>
          <span className="truncate text-sidebar-accent-foreground tabular-nums">
            {field.ledger}
          </span>
        </li>
      ))}
    </ul>
    <figcaption
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 bg-sidebar-primary/10 px-4 py-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1"
      style={{
        animationDelay: `${600 + PREVIEW_FIELDS.length * 220 + 150}ms`,
        animationDuration: '400ms',
        animationFillMode: 'both',
      }}
    >
      <span className="font-medium text-sidebar-primary">
        Matched · score {PREVIEW_TOTAL_SCORE}
      </span>
      {PREVIEW_SCORE.map((signal) => (
        <span key={signal.label} className="flex items-center gap-1.5 text-xs text-sidebar-muted">
          {signal.label}
          <span className="h-1 w-10 overflow-hidden rounded-full bg-white/10">
            <span
              className="block h-full bg-sidebar-primary"
              style={{ width: `${signal.value * 100}%` }}
            />
          </span>
        </span>
      ))}
    </figcaption>
  </figure>
);
