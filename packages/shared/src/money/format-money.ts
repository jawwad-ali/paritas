const formatters = new Map<string, Intl.NumberFormat>();

const formatterFor = (currency: string): Intl.NumberFormat => {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency });
    formatters.set(currency, formatter);
  }
  return formatter;
};

/** Digits after the decimal point for a currency: USD 2, JPY 0. */
export const currencyExponent = (currency: string): number =>
  formatterFor(currency).resolvedOptions().maximumFractionDigits ?? 2;

/**
 * Formats integer minor units for display, e.g. (4999, 'USD') → "$49.99".
 * Uses the currency's own exponent (JPY has none, USD has two).
 */
export const formatMoney = (amountMinor: number, currency: string): string =>
  formatterFor(currency).format(amountMinor / 10 ** currencyExponent(currency));

/**
 * Minor units as a plain decimal string for exports, e.g. (4999, 'USD') → "49.99".
 * Integer arithmetic only, so no floating-point rounding can creep in.
 */
export const toDecimalAmount = (amountMinor: number, currency: string): string => {
  const exponent = currencyExponent(currency);
  if (exponent === 0) {
    return String(amountMinor);
  }
  const digits = String(Math.abs(amountMinor)).padStart(exponent + 1, '0');
  const sign = amountMinor < 0 ? '-' : '';
  return `${sign}${digits.slice(0, -exponent)}.${digits.slice(-exponent)}`;
};
