import { formatMoney } from '@paritas/shared';
import { cn } from '@/lib/utils';

interface MoneyProps {
  amountMinor: number;
  currency: string;
  className?: string;
}

/**
 * Amounts in minor units, formatted with the currency's own exponent. The
 * font's figures are tabular, so a right-aligned column lines up digit for digit.
 */
export const Money = ({ amountMinor, currency, className }: MoneyProps) => (
  <span className={cn('tabular-nums', className)}>{formatMoney(amountMinor, currency)}</span>
);
