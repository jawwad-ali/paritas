import type { SourceKind } from '@paritas/shared';
import { BookOpenText, CreditCard, type LucideIcon } from 'lucide-react';

const SOURCE_KIND_ICONS: Record<SourceKind, LucideIcon> = {
  PAYMENT_GATEWAY: CreditCard,
  INTERNAL_LEDGER: BookOpenText,
};

export const SOURCE_KIND_LABELS: Record<SourceKind, string> = {
  PAYMENT_GATEWAY: 'Payment gateway',
  INTERNAL_LEDGER: 'Internal ledger',
};

interface SourceLabelProps {
  name: string;
  kind: SourceKind;
}

export const SourceLabel = ({ name, kind }: SourceLabelProps) => {
  const Icon = SOURCE_KIND_ICONS[kind];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <Icon aria-hidden="true" className="size-3.5 text-muted-foreground" />
      {name}
    </span>
  );
};
