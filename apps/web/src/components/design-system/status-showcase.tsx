import type { ReactNode } from 'react';
import {
  EXCEPTION_SEVERITIES,
  EXCEPTION_STATUSES,
  EXCEPTION_TYPES,
  RECONCILIATION_STATUSES,
} from '@paritas/shared';
import { SeverityBadge } from '@/components/domain/severity-badge';
import { SourceLabel } from '@/components/domain/source-label';
import {
  ExceptionStatusLabel,
  ExceptionTypeLabel,
  ReconciliationStatusBadge,
} from '@/components/domain/status-badges';

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="grid gap-2 p-3 sm:grid-cols-[160px_1fr] sm:items-center">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">{children}</div>
  </div>
);

/** Every state word the product uses, each with an icon or a level so colour is never alone. */
export const StatusShowcase = () => (
  <div className="divide-y rounded-md border bg-card">
    <Row label="Severity ladder">
      {[...EXCEPTION_SEVERITIES].reverse().map((severity) => (
        <SeverityBadge key={severity} severity={severity} />
      ))}
    </Row>
    <Row label="Exception status">
      {EXCEPTION_STATUSES.map((status) => (
        <ExceptionStatusLabel key={status} status={status} />
      ))}
    </Row>
    <Row label="Record status">
      {RECONCILIATION_STATUSES.map((status) => (
        <ReconciliationStatusBadge key={status} status={status} />
      ))}
    </Row>
    <Row label="Exception type">
      {EXCEPTION_TYPES.map((type) => (
        <ExceptionTypeLabel key={type} type={type} />
      ))}
    </Row>
    <Row label="Source">
      <SourceLabel name="Stripe" kind="PAYMENT_GATEWAY" />
      <SourceLabel name="Internal ledger" kind="INTERNAL_LEDGER" />
    </Row>
  </div>
);
