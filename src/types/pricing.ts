export interface PriceParams {
  a: number;
  b: number;
  c: number;
}

export interface TheoreticalPriceResult {
  J: number;
  V: number;
  params: PriceParams;
  computedAt: Date;
}

export interface DeviationResult {
  marketPrice: number;
  theoreticalPrice: number;
  deviationPercent: number;
}
