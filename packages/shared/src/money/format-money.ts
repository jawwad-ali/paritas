const formatters = new Map<string, Intl.NumberFormat>();

const formatterFor = (currency: string): Intl.NumberFormat => {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency });
    formatters.set(currency, formatter);
  }
  return formatter;
};

/**
 * Formats integer minor units for display, e.g. (4999, 'USD') → "$49.99".
 * Uses the currency's own exponent (JPY has none, USD has two).
 */
export const formatMoney = (amountMinor: number, currency: string): string => {
  const formatter = formatterFor(currency);
  const exponent = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amountMinor / 10 ** exponent);
};
