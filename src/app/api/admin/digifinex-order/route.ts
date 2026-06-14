import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  describeErrorCode,
  getDigiFinexCreds,
  isDigiFinexAccount,
  placeBatchOrders,
  placeOrder,
  type BatchOrderItem,
  type DigiFinexAccount,
  type DigiFinexCreds,
  type DigiFinexMarket,
  type DigiFinexOrderType,
} from '@/lib/digifinex-order';

export const dynamic = 'force-dynamic';

// =====================================================
// Body shape (one of four forms):
//
// 1) Cron-job mode  (Supabase pg_cron uses this)
//    { job: "buy1"|"buy2"|"sell1"|"sell2", dry_run?: boolean }
//      - Reads symbol/amount/price + counter from digifinex_cron_config
//      - Uses DigiFinex API key matching the account suffix (1 or 2)
//      - Atomic counter decrement (coupon_issued for buy*, coupon_used for sell*)
//      - If counter is already 0 → skipped, no order placed
//
// 2) Single direct
//    { account: 1|2, market?: "spot", symbol, type, amount, price?, post_only?, dry_run? }
//
// 3) Quote/bracket
//    { account: 1|2, symbol, quote: true,
//      buy_price, buy_amount, sell_price, sell_amount, post_only?, dry_run? }
//
// 4) Raw batch
//    { account: 1|2, symbol, batch: [{type, amount, price, post_only?}, ...], dry_run? }
// =====================================================

type JobName = 'buy1' | 'buy2' | 'sell1' | 'sell2';

interface JobBody {
  job: JobName;
  dry_run?: boolean;
}

interface SingleBody {
  account: DigiFinexAccount;
  market?: DigiFinexMarket;
  symbol: string;
  type: DigiFinexOrderType;
  amount: number;
  price?: number;
  post_only?: boolean;
  dry_run?: boolean;
}

interface QuoteBody {
  account: DigiFinexAccount;
  market?: DigiFinexMarket;
  symbol: string;
  quote: true;
  buy_price: number;
  buy_amount: number;
  sell_price: number;
  sell_amount: number;
  post_only?: boolean;
  dry_run?: boolean;
}

interface BatchBody {
  account: DigiFinexAccount;
  market?: DigiFinexMarket;
  symbol: string;
  batch: BatchOrderItem[];
  dry_run?: boolean;
}

type RequestBody = JobBody | SingleBody | QuoteBody | BatchBody;

const VALID_JOBS: ReadonlyArray<JobName> = ['buy1', 'buy2', 'sell1', 'sell2'];

function isJob(b: RequestBody): b is JobBody {
  return typeof (b as JobBody).job === 'string';
}
function isQuote(b: RequestBody): b is QuoteBody {
  return (b as QuoteBody).quote === true;
}
function isBatch(b: RequestBody): b is BatchBody {
  return Array.isArray((b as BatchBody).batch);
}
function isSingle(b: RequestBody): b is SingleBody {
  return typeof (b as SingleBody).type === 'string';
}

interface SettingsRow {
  symbol: string;
  amount: number;
  price: number;
  coupon_issued: number;
  coupon_used: number;
}

// Which counter each cron *reads*. Sell* additionally decrement; buy* do not.
const COUNTER_FOR_JOB: Record<JobName, 'coupon_issued' | 'coupon_used'> = {
  buy1: 'coupon_issued',
  buy2: 'coupon_used',
  sell1: 'coupon_used',
  sell2: 'coupon_issued',
};

export async function POST(req: Request) {
  // 1. Parse body first so we know whether dry_run is requested.
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const wantsDryRun =
    (body as { dry_run?: boolean }).dry_run === true;

  // 2. Auth — either bearer secret (cron / curl) or a Supabase admin session
  //    (browser). Session-only auth is restricted to dry-run requests so the
  //    admin UI can preview without being able to fire real money.
  const expected = process.env.DIGIFINEX_CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: 'DIGIFINEX_CRON_SECRET not configured on server' },
      { status: 500 },
    );
  }
  const authHeader = req.headers.get('authorization') ?? '';
  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const bearerOk = provided !== '' && provided === expected;

  if (!bearerOk) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!wantsDryRun) {
      return NextResponse.json(
        {
          error:
            'Session auth allows dry_run only. Use the bearer secret for real orders.',
        },
        { status: 403 },
      );
    }
  }

  const admin = createSupabaseAdminClient();

  // 3. Resolve mode + config (job mode reads from DB; direct modes use body).
  let mode: 'single' | 'quote' | 'batch';
  let creds: DigiFinexCreds;
  let market: DigiFinexMarket;
  let symbol: string;
  let dryRun: boolean;
  let jobName: JobName | null = null;
  let accountNumber: DigiFinexAccount | null = null;
  let couponRemaining: number | null = null;
  let executionInput: SingleBody | QuoteBody | BatchBody;

  if (isJob(body)) {
    // ---- Cron-job mode ----
    if (!VALID_JOBS.includes(body.job)) {
      return NextResponse.json(
        { error: `Invalid job name; expected one of ${VALID_JOBS.join(', ')}` },
        { status: 400 },
      );
    }
    jobName = body.job;
    dryRun = body.dry_run === true;
    const side = jobName.startsWith('buy') ? 'buy' : 'sell';
    accountNumber = jobName.endsWith('1') ? 1 : 2;
    const counterField = COUNTER_FOR_JOB[jobName];
    market = 'spot';
    mode = 'single';

    // Singleton settings. On dry-run we read directly (no mutation).
    // On real runs we call the RPC, which decrements only for sell*.
    let settings: SettingsRow | null = null;
    if (dryRun) {
      const { data, error } = await admin
        .from('digifinex_settings')
        .select('symbol, amount, price, coupon_issued, coupon_used')
        .eq('id', 1)
        .maybeSingle();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!data) {
        return NextResponse.json(
          { error: 'digifinex_settings row missing (apply migration 0005)' },
          { status: 500 },
        );
      }
      settings = data as SettingsRow;
      // On dry run, still respect the counter gate (so the operator can see
      // when a cron would skip), but do not mutate.
      if ((settings[counterField] ?? 0) <= 0) {
        return NextResponse.json(
          {
            job: jobName,
            skipped: true,
            reason: 'counter_at_zero',
            counter: counterField,
            dry_run: true,
          },
          { status: 200 },
        );
      }
    } else {
      const { data, error } = await admin.rpc('dfx_consume_cron_counter', {
        _job: jobName,
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      const rows = (data ?? []) as SettingsRow[];
      if (rows.length === 0) {
        // Counter was already 0 — log a skip and exit early.
        await admin.from('digifinex_order_log').insert({
          mode: 'skipped',
          request_body: body,
          digifinex_url: 'n/a',
          response_status: null,
          response_code: null,
          response_body: null,
          duration_ms: 0,
          error: 'counter_at_zero',
          job_name: jobName,
          account: accountNumber,
          coupon_remaining: 0,
        });
        return NextResponse.json(
          {
            job: jobName,
            skipped: true,
            reason: 'counter_at_zero',
            counter: counterField,
          },
          { status: 200 },
        );
      }
      settings = rows[0];
    }

    couponRemaining = settings[counterField];
    symbol = settings.symbol;
    try {
      creds = getDigiFinexCreds(accountNumber);
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 500 },
      );
    }
    executionInput = {
      account: accountNumber,
      market,
      symbol,
      type: side,
      amount: Number(settings.amount),
      price: Number(settings.price),
      post_only: false,
      dry_run: dryRun,
    };
  } else {
    // ---- Direct modes ----
    const bodyAcct = (body as SingleBody | QuoteBody | BatchBody).account;
    if (typeof bodyAcct !== 'number' || !isDigiFinexAccount(bodyAcct)) {
      return NextResponse.json(
        { error: 'account is required and must be 1 or 2' },
        { status: 400 },
      );
    }
    accountNumber = bodyAcct;
    try {
      creds = getDigiFinexCreds(accountNumber);
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 500 },
      );
    }

    if (typeof body.symbol !== 'string') {
      return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
    }
    symbol = body.symbol.toLowerCase();
    market = body.market ?? 'spot';
    dryRun = body.dry_run === true;

    if (isQuote(body)) mode = 'quote';
    else if (isBatch(body)) mode = 'batch';
    else if (isSingle(body)) mode = 'single';
    else {
      return NextResponse.json(
        {
          error:
            'Body must include `job`, or `type` (single), `quote: true`, or `batch: [...]`',
        },
        { status: 400 },
      );
    }
    executionInput = body as SingleBody | QuoteBody | BatchBody;
  }

  // 4. Dispatch to DigiFinex.
  let result;
  try {
    if (mode === 'quote') {
      const q = executionInput as QuoteBody;
      const orders: BatchOrderItem[] = [
        {
          type: 'buy',
          amount: Number(q.buy_amount),
          price: Number(q.buy_price),
          ...(q.post_only ? { post_only: 1 as const } : {}),
        },
        {
          type: 'sell',
          amount: Number(q.sell_amount),
          price: Number(q.sell_price),
          ...(q.post_only ? { post_only: 1 as const } : {}),
        },
      ];
      result = await placeBatchOrders({ market, symbol, orders }, creds, dryRun);
    } else if (mode === 'batch') {
      const b = executionInput as BatchBody;
      result = await placeBatchOrders(
        { market, symbol, orders: b.batch },
        creds,
        dryRun,
      );
    } else {
      const s = executionInput as SingleBody;
      result = await placeOrder(
        {
          market,
          symbol,
          type: s.type,
          amount: Number(s.amount),
          price: s.price !== undefined ? Number(s.price) : undefined,
          postOnly: s.post_only === true,
        },
        creds,
        dryRun,
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }

  // 5. Log the attempt.
  const code = result.result?.code ?? null;
  const success = code === 0;
  const { error: logError } = await admin.from('digifinex_order_log').insert({
    mode: dryRun ? 'dry_run' : mode,
    request_body: body,
    digifinex_url: result.trace.url,
    response_status: result.http_status,
    response_code: code,
    response_body: result.result?.raw ?? null,
    order_id: result.result?.order_id ?? null,
    order_ids: result.result?.order_ids ?? null,
    duration_ms: result.duration_ms,
    error: result.error,
    job_name: jobName,
    account: accountNumber,
    coupon_remaining: couponRemaining,
  });
  if (logError) {
    console.error('[digifinex-order] failed to log:', logError);
  }

  return NextResponse.json(
    {
      mode: dryRun ? 'dry_run' : mode,
      job: jobName,
      account: accountNumber,
      coupon_remaining: couponRemaining,
      symbol,
      market,
      http_status: result.http_status,
      duration_ms: result.duration_ms,
      digifinex: result.result
        ? {
            code: result.result.code,
            ok: success,
            error_hint: success ? null : describeErrorCode(result.result.code),
            order_id: result.result.order_id,
            order_ids: result.result.order_ids,
          }
        : null,
      trace: dryRun
        ? {
            url: result.trace.url,
            body: result.trace.body,
            timestamp: result.trace.timestamp,
            signature: result.trace.signature,
          }
        : { url: result.trace.url, timestamp: result.trace.timestamp },
      transport_error: result.error,
    },
    { status: result.error ? 502 : 200 },
  );
}
