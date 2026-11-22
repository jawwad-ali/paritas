/** Zero-filled counts keyed by every value of an enum, so clients never see a missing key. */
export const countsBy = <K extends string>(
  keys: readonly K[],
  rows: ReadonlyArray<{ key: K; count: number }>,
): Record<K, number> => {
  const counts = Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;
  rows.forEach(({ key, count }) => {
    counts[key] += count;
  });
  return counts;
};

/** A share in 0..1 rounded to 4 decimals; null when the denominator is 0. */
export const ratio = (part: number, whole: number): number | null =>
  whole === 0 ? null : Math.round((part / whole) * 10_000) / 10_000;
