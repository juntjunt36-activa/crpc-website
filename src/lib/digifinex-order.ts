import 'server-only';
import { createHmac } from 'node:crypto';

// Ported from order.ts (DigiFinex authenticated order CLI).
// CLI-specific bits (commander, readline, prompts) are removed; the rest is
// the same signing, encoding, and HTTP-post logic, so the wire output matches
// the Python reference implementation we already validated.

const BASE_URL = 'https://openapi.digifinex.com/v3';
const FETCH_TIMEOUT_MS = 10_000;

export const DIGIFINEX_ERROR_MESSAGES: Record<number, string> = {
  10002: 'Invalid ApiKey',
  10003: "Sign doesn't match",
  10004: 'Illegal request parameters',
  10005: 'Request frequency exceeds the limit',
  10006: 'Unauthorized to execute this request',
  10007: 'IP address Unauthorized',
  10008: 'Timestamp invalid (clock drift > 5s)',
  20002: 'Trade suspended for this pair',
  20007: 'Price precision error',
  20008: 'Amount precision error',
  20009: 'Amount below minimum',
  20010: 'Cash amount below minimum',
  20011: 'Insufficient balance',
  20012: 'Invalid trade type',
  20018: 'API trading temporarily banned',
  20019: 'Wrong symbol format (expected e.g. btc_usdt)',
  20042: 'Pair does not support API trading',
};

export function describeErrorCode(code: number): string {
  return DIGIFINEX_ERROR_MESSAGES[code] ?? `Unknown DigiFinex code: ${code}`;
}

// urllib.urlencode-compatible encoding: encode reserved chars and use '+' for space.
function enc(s: string): string {
  return encodeURIComponent(s)
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%20/g, '+');
}

function buildQuery(params: [string, string][]): string {
  return params.map(([k, v]) => `${enc(k)}=${enc(v)}`).join('&');
}

function sign(query: string, secret: string): string {
  return createHmac('sha256', secret).update(query).digest('hex');
}

// Convert a number to a plain decimal string, no exponent and no trailing zeros.
function num(v: number | string): string {
  if (typeof v === 'string') return v;
  const s = v.toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
  return s === '' ? '0' : s;
}

export interface DigiFinexCreds {
  apiKey: string;
  apiSecret: string;
}

export type DigiFinexAccount = 1 | 2;

export function isDigiFinexAccount(n: number): n is DigiFinexAccount {
  return n === 1 || n === 2;
}

// Resolves the env-stored API credentials for the given account.
// Two accounts are supported so buy1/sell1 and buy2/sell2 can use different keys.
export function getDigiFinexCreds(account: DigiFinexAccount): DigiFinexCreds {
  const key = process.env[`DIGIFINEX_API_KEY_${account}`];
  const secret = process.env[`DIGIFINEX_API_SECRET_${account}`];
  if (!key || !secret) {
    throw new Error(
      `DigiFinex credentials missing for account ${account}: ` +
        `set DIGIFINEX_API_KEY_${account} and DIGIFINEX_API_SECRET_${account}`,
    );
  }
  return { apiKey: key, apiSecret: secret };
}

export interface DigiFinexResult {
  code: number;
  order_id?: string;
  order_ids?: string[];
  raw: unknown;
}

export interface DigiFinexCallTrace {
  url: string;
  body: string;
  timestamp: string;
  signature: string;
}

export interface SignedFetchResult {
  trace: DigiFinexCallTrace;
  result: DigiFinexResult | null;
  http_status: number | null;
  duration_ms: number;
  error: string | null;
}

async function postSigned(
  url: string,
  params: [string, string][],
  creds: DigiFinexCreds,
  dryRun: boolean,
): Promise<SignedFetchResult> {
  const body = buildQuery(params);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = sign(body, creds.apiSecret);
  const trace: DigiFinexCallTrace = { url, body, timestamp, signature };

  if (dryRun) {
    return { trace, result: null, http_status: null, duration_ms: 0, error: null };
  }

  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'ACCESS-KEY': creds.apiKey,
        'ACCESS-TIMESTAMP': timestamp,
        'ACCESS-SIGN': signature,
        'User-Agent':
          'Mozilla/5.0 (compatible; CRPC-Dashboard/1.0; +https://crpc-website.vercel.app)',
      },
      body,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const duration = Date.now() - started;
    if (!res.ok) {
      return {
        trace,
        result: null,
        http_status: res.status,
        duration_ms: duration,
        error: `HTTP ${res.status} ${res.statusText}`,
      };
    }
    const json = (await res.json()) as { code: number; order_id?: string; order_ids?: string[] };
    return {
      trace,
      http_status: res.status,
      duration_ms: duration,
      error: null,
      result: {
        code: json.code,
        order_id: json.order_id,
        order_ids: json.order_ids,
        raw: json,
      },
    };
  } catch (err) {
    return {
      trace,
      result: null,
      http_status: null,
      duration_ms: Date.now() - started,
      error: (err as Error).message,
    };
  }
}

// ============== Single order ==============

export type DigiFinexMarket = 'spot' | 'margin';
export type DigiFinexOrderType = 'buy' | 'sell' | 'buy_market' | 'sell_market';

export interface PlaceOrderInput {
  market: DigiFinexMarket;
  symbol: string;
  type: DigiFinexOrderType;
  amount: number;
  price?: number;
  postOnly?: boolean;
}

export function placeOrder(
  input: PlaceOrderInput,
  creds: DigiFinexCreds,
  dryRun: boolean,
): Promise<SignedFetchResult> {
  const isLimit = input.type === 'buy' || input.type === 'sell';
  const params: [string, string][] = [
    ['symbol', input.symbol],
    ['type', input.type],
    ['amount', num(input.amount)],
  ];
  if (isLimit) {
    if (input.price === undefined) {
      throw new Error(`Limit order (${input.type}) requires "price"`);
    }
    params.push(['price', num(input.price)]);
  }
  if (input.postOnly) params.push(['post_only', '1']);
  return postSigned(`${BASE_URL}/${input.market}/order/new`, params, creds, dryRun);
}

// ============== Batch orders (両建て) ==============

export interface BatchOrderItem {
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  post_only?: 0 | 1;
}

export interface PlaceBatchOrdersInput {
  market: DigiFinexMarket;
  symbol: string;
  orders: BatchOrderItem[];
}

export function placeBatchOrders(
  input: PlaceBatchOrdersInput,
  creds: DigiFinexCreds,
  dryRun: boolean,
): Promise<SignedFetchResult> {
  if (input.orders.length === 0 || input.orders.length > 10) {
    throw new Error('Batch orders must have 1..10 items');
  }
  // DigiFinex expects compact JSON (no spaces) — matches Python json.dumps(separators=(",",":")).
  const listJson = JSON.stringify(input.orders);
  const params: [string, string][] = [
    ['symbol', input.symbol],
    ['list', listJson],
  ];
  return postSigned(
    `${BASE_URL}/${input.market}/order/batch_new`,
    params,
    creds,
    dryRun,
  );
}
