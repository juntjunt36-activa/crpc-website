import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { calculateTheoreticalPrice, getCurrentPriceParams } from '@/lib/pricing';
import { fetchJpyUsdRate, jpyToUsd } from '@/lib/fx';

interface InsertBody {
  j_value_jpy: number;
  note: string | null;
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: InsertBody;
  try {
    body = (await req.json()) as InsertBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const jJpy = Number(body.j_value_jpy);
  if (!Number.isFinite(jJpy) || jJpy <= 0) {
    return NextResponse.json(
      { error: 'j_value_jpy must be a positive number' },
      { status: 400 },
    );
  }

  // Fetch the current FX rate (fresh from API + store snapshot, or fallback to latest DB row).
  const adminClient = createSupabaseAdminClient();
  let jpyPerUsd: number | null = null;
  let fxSource = 'unknown';
  try {
    const fx = await fetchJpyUsdRate();
    jpyPerUsd = fx.jpy_per_usd;
    fxSource = fx.source;
    await adminClient.from('fx_rate_snapshots').insert({
      jpy_per_usd: fx.jpy_per_usd,
      rate_date: fx.rate_date,
      source: fx.source,
      raw_payload: fx.raw,
    });
  } catch (err) {
    console.warn('[admin/point-balance] live FX fetch failed:', err);
    const { data: latest } = await adminClient
      .from('fx_rate_snapshots')
      .select('jpy_per_usd, source')
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest) {
      jpyPerUsd = Number(latest.jpy_per_usd);
      fxSource = String(latest.source) + ' (cached)';
    }
  }

  if (!jpyPerUsd || !Number.isFinite(jpyPerUsd) || jpyPerUsd <= 0) {
    return NextResponse.json(
      { error: 'FX rate unavailable; cannot convert JPY → USD' },
      { status: 503 },
    );
  }

  const jUsd = jpyToUsd(jJpy, jpyPerUsd);
  const params = getCurrentPriceParams();

  if (jUsd <= params.b) {
    return NextResponse.json(
      {
        error: `Converted J (USD ${jUsd.toFixed(2)}) is not greater than b (${params.b})`,
      },
      { status: 400 },
    );
  }

  const v = calculateTheoreticalPrice(jUsd, params);
  if (!Number.isFinite(v) || v <= 0) {
    return NextResponse.json(
      { error: 'Computed theoretical price is invalid' },
      { status: 500 },
    );
  }

  const note = body.note?.trim() || null;

  const { data, error } = await supabase
    .from('point_balance_history')
    .insert({
      j_value: jUsd, // formula input (USD)
      j_value_jpy: jJpy, // original admin input
      fx_rate_jpy_per_usd: jpyPerUsd,
      v_value: v,
      param_a: params.a,
      param_b: params.b,
      param_c: params.c,
      inserted_by: user.id,
      note,
    })
    .select('id, recorded_at, j_value, j_value_jpy, fx_rate_jpy_per_usd, v_value')
    .single();

  if (error) {
    console.error('[admin/point-balance] insert failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag('point-balance');

  return NextResponse.json(
    {
      id: data.id,
      recorded_at: data.recorded_at,
      j_value_usd: Number(data.j_value),
      j_value_jpy: Number(data.j_value_jpy),
      fx_rate_jpy_per_usd: Number(data.fx_rate_jpy_per_usd),
      fx_source: fxSource,
      v_value: Number(data.v_value),
    },
    { status: 201 },
  );
}
