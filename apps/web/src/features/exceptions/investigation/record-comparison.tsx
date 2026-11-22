import {
  type ExceptionDetailDto,
  type ExceptionTransactionDto,
  MATCH_METHODS,
} from '@paritas/shared';
import { Check, Equal, X } from 'lucide-react';
import { Identifier } from '@/components/domain/identifier';
import { SourceLabel } from '@/components/domain/source-label';
import { ReconciliationStatusBadge } from '@/components/domain/status-badges';
import { cn } from '@/lib/utils';
import { compareRecords, type FieldState, splitSides } from './comparison';

const METHOD_LABELS: Record<(typeof MATCH_METHODS)[number], string> = {
  EXACT: 'Exact match',
  FUZZY: 'Fuzzy match',
  MANUAL: 'Matched by a person',
};

const roleLabel = (duplicate: boolean, role: ExceptionTransactionDto['role']): string => {
  if (duplicate) {
    return role === 'CONTEXT' ? 'Original' : 'Duplicate';
  }
  return role === 'CONTEXT' ? 'For comparison' : 'Also at issue';
};

const RailMark = ({ state }: { state: FieldState }) => {
  if (state === 'none') {
    return <Equal aria-hidden="true" className="size-3.5 text-muted-foreground/40" />;
  }
  return state === 'agree' ? (
    <span className="flex size-5 items-center justify-center rounded-sm bg-matched-bg text-matched-fg">
      <Check aria-label="Agrees" className="size-3.5" />
    </span>
  ) : (
    <span className="flex size-5 items-center justify-center rounded-sm bg-sev-critical-bg text-sev-critical-fg">
      <X aria-label="Differs" className="size-3.5" />
    </span>
  );
};

const SideHeader = ({ link, side }: { link: ExceptionTransactionDto | undefined; side: string }) =>
  link ? (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <SourceLabel name={link.transaction.source.name} kind={link.transaction.source.kind} />
      <Identifier value={link.transaction.externalId} copyable className="text-muted-foreground" />
      <div className="flex flex-wrap items-center gap-2">
        <ReconciliationStatusBadge status={link.transaction.reconciliationStatus} />
        {link.match && (
          <span className="text-xs text-muted-foreground">
            {METHOD_LABELS[link.match.method]}
            {link.match.method === 'FUZZY' && ` · score ${link.match.confidence.toFixed(2)}`}
          </span>
        )}
      </div>
    </div>
  ) : (
    <div className="space-y-1">
      <span className="text-sm text-muted-foreground">{side}</span>
      <p className="text-sm font-medium text-sev-high-fg">No record on this side</p>
    </div>
  );

/**
 * The two records of the payment set side by side, a rail between them marking
 * each field as agreeing or differing. Further records involved (duplicates,
 * the original of a duplicate) are listed below.
 */
export const RecordComparison = ({ exception }: { exception: ExceptionDetailDto }) => {
  const sides = splitSides(exception);
  const [gateway] = sides.gateway;
  const [ledger] = sides.ledger;
  const fields = compareRecords(gateway?.transaction, ledger?.transaction);
  const others = [...sides.gateway.slice(1), ...sides.ledger.slice(1)];

  return (
    <section aria-labelledby="records-title" className="rounded-md border bg-card">
      <h2 id="records-title" className="border-b px-4 py-3 text-sm font-bold">
        Records side by side
      </h2>
      <div className="grid grid-cols-[64px_minmax(0,1fr)_20px_minmax(0,1fr)] gap-x-3 px-4 py-3 sm:grid-cols-[120px_minmax(0,1fr)_32px_minmax(0,1fr)]">
        <span />
        <SideHeader link={gateway} side="Payment gateway" />
        <span />
        <SideHeader link={ledger} side="Internal ledger" />
      </div>
      <dl>
        {fields.map((field) => (
          <div
            key={field.label}
            className={cn(
              'grid grid-cols-[64px_minmax(0,1fr)_20px_minmax(0,1fr)] items-center gap-x-3 border-t px-4 py-2.5 sm:grid-cols-[120px_minmax(0,1fr)_32px_minmax(0,1fr)]',
              field.state === 'differ' && 'bg-sev-critical-bg/40',
            )}
          >
            <dt className="text-xs text-muted-foreground">
              {field.label}
              {field.note && <span className="block text-foreground">{field.note}</span>}
            </dt>
            <dd className="text-[13px] break-words tabular-nums sm:truncate sm:text-sm">
              {field.gateway ?? '—'}
            </dd>
            <dd className="flex justify-center">
              <RailMark state={field.state} />
            </dd>
            <dd className="text-[13px] break-words tabular-nums sm:truncate sm:text-sm">
              {field.ledger ?? '—'}
            </dd>
          </div>
        ))}
      </dl>
      {others.length > 0 && (
        <div className="space-y-2 border-t px-4 py-3">
          <h3 className="text-xs font-medium text-muted-foreground">Also involved</h3>
          <ul className="space-y-1.5">
            {others.map((link) => (
              <li
                key={link.transaction.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
              >
                <span className="w-24 shrink-0 text-xs text-muted-foreground">
                  {roleLabel(exception.type === 'DUPLICATE', link.role)}
                </span>
                <Identifier value={link.transaction.externalId} copyable />
                <ReconciliationStatusBadge status={link.transaction.reconciliationStatus} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
