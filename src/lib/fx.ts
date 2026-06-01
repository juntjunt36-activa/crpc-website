const FRANKFURTER_URL = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=JPY';
const OPEN_ERAPI_URL = 'https://open.er-api.com/v6/latest/USD';
const FETCH_TIMEOUT_MS = 5_000;

export type FxSource = 'frankfurter' | 'open-er-api';

export interface FxRate {
  jpy_per_usd: number;
  source: FxSource;
  rate_date: string | null; // YYYY-MM-DD if the API reports it
  fetchedAt: Date;
  raw: unknown;
}

interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: { JPY: number };
}

interface OpenErApiResponse {
  result: string;
  base_code: string;
  time_last_update_utc?: string;
  rates: Record<string, number>;
}

export async function fetchJpyUsdRate(): Promise<FxRate> {
  // 1. Try Frankfurter (ECB-based, reliable, no key).
  try {
    const res = await fetch(FRANKFURTER_URL, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { accept: 'application/json' },
    });
    if (res.ok) {
      const data = (await res.json()) as FrankfurterResponse;
      if (data.rates?.JPY && Number.isFinite(data.rates.JPY)) {
        return {
          jpy_per_usd: data.rates.JPY,
          source: 'frankfurter',
          rate_date: data.date ?? null,
          fetchedAt: new Date(),
          raw: data,
        };
      }
    }
  } catch (err) {
    console.warn('[fx] frankfurter failed:', err);
  }

  // 2. Fallback to open-er-api (no key, daily update).
  const res = await fetch(OPEN_ERAPI_URL, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`open-er-api HTTP ${res.status}`);
  const data = (await res.json()) as OpenErApiResponse;
  if (data.result !== 'success' || !data.rates?.JPY) {
    throw new Error('open-er-api returned no JPY rate');
  }
  return {
    jpy_per_usd: data.rates.JPY,
    source: 'open-er-api',
    rate_date: data.time_last_update_utc
      ? new Date(data.time_last_update_utc).toISOString().slice(0, 10)
      : null,
    fetchedAt: new Date(),
    raw: data,
  };
}

// Convert a JPY amount to USD using the given rate (JPY per 1 USD).
export function jpyToUsd(jpy: number, jpyPerUsd: number): number {
  if (!Number.isFinite(jpy) || !Number.isFinite(jpyPerUsd) || jpyPerUsd <= 0) {
    return 0;
  }
  return jpy / jpyPerUsd;
}
