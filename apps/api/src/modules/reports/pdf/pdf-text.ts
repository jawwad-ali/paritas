import { formatMoney } from '@paritas/shared';

/**
 * The built-in PDF fonts only cover the Windows-1252 (WinAnsi) character set.
 * Text outside it is transliterated where a sensible equivalent exists.
 */
const WIN_ANSI_EXTRAS = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');
const REPLACEMENTS: Record<string, string> = {
  '↔': '<->',
  '→': '->',
  '←': '<-',
  '≥': '>=',
  '≤': '<=',
};

const isWinAnsiChar = (char: string): boolean => {
  const code = char.codePointAt(0) ?? 0;
  return (
    (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || WIN_ANSI_EXTRAS.has(char)
  );
};

export const pdfText = (text: string): string =>
  Array.from(text, (char) => (isWinAnsiChar(char) ? char : (REPLACEMENTS[char] ?? '?'))).join('');

/** "$1,234.56", or "INR 1,234.56" when the symbol cannot be printed. */
export const pdfMoney = (amountMinor: number, currency: string): string => {
  const formatted = formatMoney(amountMinor, currency);
  if (Array.from(formatted).every(isWinAnsiChar)) {
    return formatted;
  }
  return `${currency} ${formatMoney(amountMinor, currency).replace(/[^\d.,-]/g, '')}`;
};

export const pdfPercent = (value: number | null): string =>
  value === null ? '—' : `${(value * 100).toFixed(1)}%`;

export const pdfNumber = (value: number): string => value.toLocaleString('en-US');
