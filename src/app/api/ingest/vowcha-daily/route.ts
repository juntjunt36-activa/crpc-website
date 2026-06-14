import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { fetchJpyUsdRate, jpyToUsd } from '@/lib/fx';
import {
  calculateTheoreticalPrice,
  getCurrentPriceParams,
} from '@/lib/pricing';

export const dynamic = 'force-dynamic';

const VOWCHA_API_BASE = 'https://application.vowcha.jp/api/v1';
const FETCH_TIMEOUT_MS = 10_000;

interface RequestBody {
  date?: string; // 'YYYY-MM-DD'; defaults to yesterday JST
  dry_run?: boolean;
}

// Returns YYYY-MM-DD for the previous JST day.
function jstYesterday(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  jst.setUTCDate(jst.getUTCDate() - 1);
  return jst.toISOString().slice(0, 10);
}

// Extract the cumulative outstanding JPY balance from vowcha's response.
// Confirmed schema (2026-06-14):
//   { data: [ { date: "YYYY-MM-DD", amount: { remaining: <number>, ... }, ... } ] }
// `amount.remaining` is the end-of-day cumulative outstanding balance, which
// is what CRPC's V = a(J - b)^c uses as J.
function extractCouponAmount(
  payload: unknown,
  targetDate: string,
): { amount: number | null; fieldName: string | null } {
  if (!payload || typeof payload !== 'object') {
    return { amount: null, fieldName: null };
  }
  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) {
    return { amount: null, fieldName: null };
  }
  const row = data.find((r) => {
    if (!r || typeof r !== 'object') return false;
    const d = (r as { date?: unknown }).date;
    return typeof d === 'string' && d.slice(0, 10) === targetDate;
  }) as { amount?: { remaining?: unknown } } | undefined;
  if (!row) return { amount: null, fieldName: null };

  const remaining = row.amount?.remaining;
  if (typeof remaining === 'number' && Number.isFinite(remaining) && remaining >= 0) {
    return { amount: remaining, fieldName: 'amount.remaining' };
  }
  if (typeof remaining === 'string') {
    const num = Number(remaining.replace(/,/g, ''));
    if (Number.isFinite(num) && num >= 0) {
      return { amount: num, fieldName: 'amount.remaining' };
    }
  }
  return { amount: null, fieldName: null };
}

export async function POST(req: Request) {
  // 1. Auth — Bearer secret shared with Supabase pg_cron.
  const expected = process.env.VOWCHA_INGEST_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: 'VOWCHA_INGEST_SECRET not configured on server' },
      { status: 500 },
    );
  }
  const auth = req.headers.get('authorization') ?? '';
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const vowchaToken = process.env.VOWCHA_API_TOKEN;
  if (!vowchaToken) {
    return NextResponse.json(
      { error: 'VOWCHA_API_TOKEN not configured' },
      { status: 500 },
    );
  }

  // 2. Parse body.
  let body: RequestBody = {};
  try {
    const parsed = await req.json();
    if (parsed && typeof parsed === 'object') body = parsed as RequestBody;
  } catch {
    // Allow empty body (cron sends no payload).
  }

  const targetDate =
    body.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : jstYesterday();
  const dryRun = body.dry_run === true;

  const url = `${VOWCHA_API_BASE}/reports/summary?from=${targetDate}&to=${targetDate}`;
  const admin = createSupabaseAdminClient();

  // 3. Fetch vowcha.
  let httpStatus: number | null = null;
  let responseBody: unknown = null;
  let fetchError: string | null = null;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${vowchaToken}`,
        Accept: 'application/json',
        'User-Agent':
          'CRPC-Ingest/1.0 (+https://crpc-website.vercel.app)',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    httpStatus = res.status;
    try {
      responseBody = await res.json();
    } catch {
      responseBody = await res.text().catch(() => null);
    }
  } catch (err) {
    fetchError = (err as Error).message;
  }

  // 4. Try to extract the amount.
  const { amount, fieldName } = extractCouponAmount(responseBody, targetDate);

  // 5. Dry-run path: log + return everything; never insert into point_balance.
  if (dryRun) {
    const { data: logRow } = await admin
      .from('vowcha_ingest_log')
      .insert({
        target_date: targetDate,
        fetched_from: url,
        http_status: httpStatus,
        response_body: responseBody,
        parsed_j_jpy: amount,
        parsed_field_name: fieldName,
        error: fetchError ?? (amount == null ? 'parse_failed' : null),
      })
      .select('id')
      .single();

    return NextResponse.json(
      {
        ok: amount != null && !fetchError,
        dry_run: true,
        target_date: targetDate,
        url,
        http_status: httpStatus,
        parsed: { amount, field_name: fieldName },
        fetch_error: fetchError,
        parse_error: amount == null && !fetchError ? 'parse_failed' : null,
        response: responseBody,
        log_id: logRow?.id ?? null,
      },
      { status: 200 },
    );
  }

  // 6. Live path: bail (and log) if anything went wrong, then insert.
  if (fetchError || amount == null) {
    await admin.from('vowcha_ingest_log').insert({
      target_date: targetDate,
      fetched_from: url,
      http_status: httpStatus,
      response_body: responseBody,
      parsed_j_jpy: amount,
      parsed_field_name: fieldName,
      error: fetchError ?? 'parse_failed',
    });
    return NextResponse.json(
      {
        ok: false,
        target_date: targetDate,
        http_status: httpStatus,
        error: fetchError ?? 'parse_failed',
        hint:
          'Call with dry_run:true to inspect the raw response and tune the parser.',
      },
      { status: 502 },
    );
  }

  // 7. Fetch / fallback FX, compute J_USD and V.
  let fxRate: number | null = null;
  let fxSource = 'unknown';
  try {
    const fx = await fetchJpyUsdRate();
    fxRate = fx.jpy_per_usd;
    fxSource = fx.source;
    await admin.from('fx_rate_snapshots').insert({
      jpy_per_usd: fx.jpy_per_usd,
      rate_date: fx.rate_date,
      source: fx.source,
      raw_payload: fx.raw,
    });
  } catch {
    const { data: lastFx } = await admin
      .from('fx_rate_snapshots')
      .select('jpy_per_usd, source')
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastFx) {
      fxRate = Number(lastFx.jpy_per_usd);
      fxSource = `${String(lastFx.source)} (cached)`;
    }
  }
  if (!fxRate || fxRate <= 0) {
    await admin.from('vowcha_ingest_log').insert({
      target_date: targetDate,
      fetched_from: url,
      http_status: httpStatus,
      response_body: responseBody,
      parsed_j_jpy: amount,
      parsed_field_name: fieldName,
      error: 'fx_unavailable',
    });
    return NextResponse.json(
      { ok: false, error: 'FX rate unavailable' },
      { status: 503 },
    );
  }

  const jUsd = jpyToUsd(amount, fxRate);
  const params = getCurrentPriceParams();
  if (jUsd <= params.b) {
    await admin.from('vowcha_ingest_log').insert({
      target_date: targetDate,
      fetched_from: url,
      http_status: httpStatus,
      response_body: responseBody,
      parsed_j_jpy: amount,
      parsed_field_name: fieldName,
      error: `j_usd_below_b (${jUsd} <= ${params.b})`,
    });
    return NextResponse.json(
      { ok: false, error: `J_USD ${jUsd} is not greater than b ${params.b}` },
      { status: 400 },
    );
  }
  const v = calculateTheoreticalPrice(jUsd, params);

  // 8. Insert the point balance row.
  const { data: pbRow, error: insertErr } = await admin
    .from('point_balance_history')
    .insert({
      j_value: jUsd,
      j_value_jpy: amount,
      fx_rate_jpy_per_usd: fxRate,
      v_value: v,
      param_a: params.a,
      param_b: params.b,
      param_c: params.c,
      inserted_by: null,
      source: 'vowcha-api',
      note: `vowcha-api ${targetDate} (field=${fieldName})`,
    })
    .select('id, recorded_at')
    .single();

  if (insertErr) {
    await admin.from('vowcha_ingest_log').insert({
      target_date: targetDate,
      fetched_from: url,
      http_status: httpStatus,
      response_body: responseBody,
      parsed_j_jpy: amount,
      parsed_field_name: fieldName,
      error: insertErr.message,
    });
    return NextResponse.json(
      { ok: false, error: insertErr.message },
      { status: 500 },
    );
  }

  await admin.from('vowcha_ingest_log').insert({
    target_date: targetDate,
    fetched_from: url,
    http_status: httpStatus,
    response_body: responseBody,
    parsed_j_jpy: amount,
    parsed_field_name: fieldName,
    point_balance_id: pbRow.id,
  });

  return NextResponse.json({
    ok: true,
    target_date: targetDate,
    http_status: httpStatus,
    parsed: { amount, field_name: fieldName },
    j_jpy: amount,
    j_usd: jUsd,
    fx_rate_jpy_per_usd: fxRate,
    fx_source: fxSource,
    v_value: v,
    point_balance_id: pbRow.id,
    recorded_at: pbRow.recorded_at,
  });
}
