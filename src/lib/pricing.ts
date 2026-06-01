import {
  PRICE_PARAM_A,
  PRICE_PARAM_B,
  PRICE_PARAM_C,
} from '@/config/constants';
import type { PriceParams } from '@/types/pricing';

export function getCurrentPriceParams(): PriceParams {
  return { a: PRICE_PARAM_A, b: PRICE_PARAM_B, c: PRICE_PARAM_C };
}

// V = a × (J − b)^c
// Returns 0 when J <= b to avoid NaN from negative or zero base raised to a fractional power.
export function calculateTheoreticalPrice(
  J: number,
  params: PriceParams = getCurrentPriceParams(),
): number {
  if (!Number.isFinite(J)) return 0;
  if (J <= params.b) return 0;
  const base = J - params.b;
  const v = params.a * Math.pow(base, params.c);
  return Number.isFinite(v) ? v : 0;
}

// Percent deviation of market price from theoretical.
// Positive = market above theoretical, negative = below.
export function calculateDeviation(
  marketPrice: number,
  theoreticalPrice: number,
): number {
  if (!Number.isFinite(marketPrice) || !Number.isFinite(theoreticalPrice)) return 0;
  if (theoreticalPrice === 0) return 0;
  return ((marketPrice - theoreticalPrice) / theoreticalPrice) * 100;
}
