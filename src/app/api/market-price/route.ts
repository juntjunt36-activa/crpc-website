import { NextResponse } from 'next/server';
import { fetchDigiFinexQuote } from '@/lib/digifinex';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

interface MarketPricePayload {
  price_usd: number;
  source: 'digifinex' | 'stale';
  recorded_at: string;
  stale: boolean;
  symbol?: string;
}

export async function GET() {
  const admin = createSupabaseAdminClient();

  // 1. Try DigiFinex (primary).
  try {
    const quote = await fetchDigiFinexQuote();

    const { data: row, error } = await admin
      .from('market_price_snapshots')
      .insert({
        price_usd: quote.price,
        source: 'digifinex',
        raw_payload: quote.raw,
      })
      .select('id, recorded_at')
      .single();

    if (error) throw error;

    return NextResponse.json<MarketPricePayload>({
      price_usd: quote.price,
      source: 'digifinex',
      recorded_at: row.recorded_at,
      stale: false,
      symbol: quote.symbol,
    });
  } catch (digifinexError) {
    console.error('[market-price] DigiFinex fetch failed:', digifinexError);
  }

  // 2. Fallback: serve most recent stored snapshot with stale flag.
  const { data: latest, error: latestError } = await admin
    .from('market_price_snapshots')
    .select('price_usd, source, recorded_at')
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError || !latest) {
    return NextResponse.json(
      { error: 'No market price available' },
      { status: 503 },
    );
  }

  return NextResponse.json<MarketPricePayload>({
    price_usd: Number(latest.price_usd),
    source: 'stale',
    recorded_at: latest.recorded_at,
    stale: true,
  });
}
