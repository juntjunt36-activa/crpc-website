import { describe, it, expect } from 'vitest';
import { calculateDeviation, calculateTheoreticalPrice } from './pricing';

const DEFAULTS = { a: 0.006300788, b: 0, c: 0.366768 };

describe('calculateTheoreticalPrice', () => {
  it('returns 0 when J <= b', () => {
    expect(calculateTheoreticalPrice(0, DEFAULTS)).toBe(0);
    expect(calculateTheoreticalPrice(-1, DEFAULTS)).toBe(0);
    expect(calculateTheoreticalPrice(5, { a: 1, b: 5, c: 1 })).toBe(0);
  });

  it('returns a when J = 1 with b = 0 (since 1^c = 1)', () => {
    expect(calculateTheoreticalPrice(1, DEFAULTS)).toBeCloseTo(DEFAULTS.a, 10);
  });

  it('matches the spec formula V = a(J-b)^c', () => {
    // J = 1,000,000 → 0.006300788 * 1e6^0.366768 ≈ 1.000...
    const J = 1_000_000;
    const expected = DEFAULTS.a * Math.pow(J - DEFAULTS.b, DEFAULTS.c);
    expect(calculateTheoreticalPrice(J, DEFAULTS)).toBeCloseTo(expected, 12);
  });

  it('handles large J (10 billion) without overflow', () => {
    const J = 10_000_000_000;
    const v = calculateTheoreticalPrice(J, DEFAULTS);
    expect(v).toBeGreaterThan(0);
    expect(Number.isFinite(v)).toBe(true);
  });

  it('returns 0 for non-finite J', () => {
    expect(calculateTheoreticalPrice(NaN, DEFAULTS)).toBe(0);
    expect(calculateTheoreticalPrice(Infinity, DEFAULTS)).toBe(0);
  });

  it('respects custom params over current defaults', () => {
    // V = 2 × (10 - 0)^1 = 20
    expect(calculateTheoreticalPrice(10, { a: 2, b: 0, c: 1 })).toBe(20);
  });
});

describe('calculateDeviation', () => {
  it('returns positive percent when market > theoretical', () => {
    expect(calculateDeviation(1.1, 1.0)).toBeCloseTo(10, 10);
  });

  it('returns negative percent when market < theoretical', () => {
    expect(calculateDeviation(0.9, 1.0)).toBeCloseTo(-10, 10);
  });

  it('returns 0 when prices are equal', () => {
    expect(calculateDeviation(1.0, 1.0)).toBe(0);
  });

  it('returns 0 when theoretical = 0 (guard)', () => {
    expect(calculateDeviation(1.0, 0)).toBe(0);
  });

  it('returns 0 for non-finite inputs', () => {
    expect(calculateDeviation(NaN, 1.0)).toBe(0);
    expect(calculateDeviation(1.0, NaN)).toBe(0);
    expect(calculateDeviation(Infinity, 1.0)).toBe(0);
  });
});
