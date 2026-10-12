/** Zamienia wejście z query stringa na liczbę całkowitą z przedziału [min, max]. */
export function clampInt(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

export const MAX_TAKE = 50;
export const safeSkip = (v: unknown) => clampInt(v, 0, 0, 100000);
export const safeTake = (v: unknown, fallback = 20) =>
  clampInt(v, fallback, 1, MAX_TAKE);
