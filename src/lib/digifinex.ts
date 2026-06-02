import { DIGIFINEX_SYMBOL } from '@/config/constants';

const DIGIFINEX_TICKER_URL = 'https://openapi.digifinex.com/v3/ticker';
const FETCH_TIMEOUT_MS = 5_000;

interface DigiFinexTickerRow {
  vol: number;
  change: number;
  base_vol: number;
  sell: number;
  last: number;
  symbol: string;
  low: number;
  buy: number;
  high: number;
}

interface DigiFinexTickerResponse {
  ticker: DigiFinexTickerRow[];
  date: number; // unix seconds
  code: number; // 0 = success
}

export interface DigiFinexQuote {
  price: number;
  symbol: string;
  fetchedAt: Date;
  source: 'digifinex';
  raw: DigiFinexTickerResponse;
}

export async function fetchDigiFinexQuote(
  symbol: string = DIGIFINEX_SYMBOL,
): Promise<DigiFinexQuote> {
  const url = `${DIGIFINEX_TICKER_URL}?symbol=${encodeURIComponent(symbol)}`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    next: { revalidate: 60, tags: ['market-price'] },
    headers: {
      accept: 'application/json',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    },
  });

  if (res.status === 403 || res.status === 451) {
    throw new Error(
      `DigiFinex blocked the request (HTTP ${res.status}). Vercel IPs may be region-restricted.`,
    );
  }

  if (!res.ok) {
    throw new Error(`DigiFinex HTTP ${res.status}`);
  }

  const data = (await res.json()) as DigiFinexTickerResponse;

  if (data.code !== 0) {
    throw new Error(`DigiFinex error code ${data.code}`);
  }

  const ticker = data.ticker?.[0];
  if (!ticker || !Number.isFinite(ticker.last)) {
    throw new Error('DigiFinex returned no ticker row');
  }

  return {
    price: Number(ticker.last),
    symbol: ticker.symbol,
    fetchedAt: new Date(data.date * 1000),
    source: 'digifinex',
    raw: data,
  };
}
