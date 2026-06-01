import { NextResponse } from 'next/server';
import { fetchJpyUsdRate } from '@/lib/fx';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 600; // 10 min

const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1h — FX is daily-ish, generous window

interface FxPayload {
  jpy_per_usd: number;
  source: string;
  rate_date: string | null;
  recorded_at: string;
  stale: boolean;
}

export async function GET() {
  const admin = createSupabaseAdminClient();

  // 1. Try fresh fetch + store snapshot.
  try {
    const fx = await fetchJpyUsdRate();
    const { data: row } = await admin
      .from('fx_rate_snapshots')
      .insert({
        jpy_per_usd: fx.jpy_per_usd,
        rate_date: fx.rate_date,
        source: fx.source,
        raw_payload: fx.raw,
      })
      .select('recorded_at')
      .single();

    return NextResponse.json<FxPayload>({
      jpy_per_usd: fx.jpy_per_usd,
      source: fx.source,
      rate_date: fx.rate_date,
      recorded_at: row?.recorded_at ?? new Date().toISOString(),
      stale: false,
    });
  } catch (err) {
    console.error('[fx-rate] live fetch failed:', err);
  }

  // 2. Fallback to most recent snapshot.
  const { data: latest } = await admin
    .from('fx_rate_snapshots')
    .select('jpy_per_usd, source, rate_date, recorded_at')
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest) {
    return NextResponse.json(
      { error: 'No FX rate available' },
      { status: 503 },
    );
  }

  const ageMs = Date.now() - new Date(latest.recorded_at).getTime();
  return NextResponse.json<FxPayload>({
    jpy_per_usd: Number(latest.jpy_per_usd),
    source: latest.source,
    rate_date: latest.rate_date,
    recorded_at: latest.recorded_at,
    stale: ageMs > STALE_THRESHOLD_MS,
  });
}
