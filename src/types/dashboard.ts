export interface MarketPricePayload {
  price_usd: number;
  source: 'digifinex' | 'stale';
  recorded_at: string;
  stale: boolean;
  symbol?: string;
}

export interface PointBalanceLatestPayload {
  id: string;
  recorded_at: string;
  j_value_usd: number;
  j_value_jpy: number | null;
  fx_rate_jpy_per_usd: number | null;
  v_value: number;
  params: { a: number; b: number; c: number };
  note: string | null;
}

export interface FxRatePayload {
  jpy_per_usd: number;
  source: string;
  rate_date: string | null;
  recorded_at: string;
  stale: boolean;
}

export interface HistoryPoint {
  recorded_at: string;
  j_value: number; // USD value used in formula
  j_value_jpy: number | null;
  v_value: number;
  note: string | null;
}

export interface PointBalanceHistoryPayload {
  range: string;
  points: HistoryPoint[];
}

export interface MarketPriceHistoryPoint {
  recorded_at: string;
  price_usd: number;
  source: string;
}

export interface MarketPriceHistoryPayload {
  range: string;
  points: MarketPriceHistoryPoint[];
}
