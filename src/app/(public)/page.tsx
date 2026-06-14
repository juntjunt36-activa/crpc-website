import { getTranslations } from 'next-intl/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { fetchDigiFinexQuote } from '@/lib/digifinex';
import { fetchJpyUsdRate } from '@/lib/fx';
import { getCurrentPriceParams } from '@/lib/pricing';
import { DashboardCards } from '@/components/dashboard/DashboardCards';
import { MiniCharts } from '@/components/dashboard/MiniCharts';
import { FitNumber } from '@/components/dashboard/FitNumber';
import type {
  FxRatePayload,
  MarketPricePayload,
  PointBalanceLatestPayload,
} from '@/types/dashboard';

export const dynamic = 'force-dynamic';

async function loadInitialPointBalance(): Promise<PointBalanceLatestPayload | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('point_balance_history')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    recorded_at: data.recorded_at,
    j_value_usd: Number(data.j_value),
    j_value_jpy:
      data.j_value_jpy != null ? Number(data.j_value_jpy) : null,
    fx_rate_jpy_per_usd:
      data.fx_rate_jpy_per_usd != null
        ? Number(data.fx_rate_jpy_per_usd)
        : null,
    v_value: Number(data.v_value),
    params: {
      a: Number(data.param_a),
      b: Number(data.param_b),
      c: Number(data.param_c),
    },
    note: data.note,
  };
}

async function loadInitialMarketPrice(): Promise<MarketPricePayload | null> {
  const admin = createSupabaseAdminClient();

  try {
    const quote = await fetchDigiFinexQuote();
    const { data: row } = await admin
      .from('market_price_snapshots')
      .insert({
        price_usd: quote.price,
        source: 'digifinex',
        raw_payload: quote.raw,
      })
      .select('recorded_at')
      .single();

    return {
      price_usd: quote.price,
      source: 'digifinex',
      recorded_at: row?.recorded_at ?? new Date().toISOString(),
      stale: false,
      symbol: quote.symbol,
    };
  } catch (err) {
    console.warn(
      '[dashboard SSR] DigiFinex fetch failed, falling back to last snapshot:',
      err,
    );
  }

  const { data: latest } = await admin
    .from('market_price_snapshots')
    .select('price_usd, recorded_at')
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest) return null;
  return {
    price_usd: Number(latest.price_usd),
    source: 'stale',
    recorded_at: latest.recorded_at,
    stale: true,
  };
}

async function loadInitialFxRate(): Promise<FxRatePayload | null> {
  const admin = createSupabaseAdminClient();
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
    return {
      jpy_per_usd: fx.jpy_per_usd,
      source: fx.source,
      rate_date: fx.rate_date,
      recorded_at: row?.recorded_at ?? new Date().toISOString(),
      stale: false,
    };
  } catch (err) {
    console.warn('[dashboard SSR] FX live fetch failed:', err);
  }
  const { data: latest } = await admin
    .from('fx_rate_snapshots')
    .select('jpy_per_usd, source, rate_date, recorded_at')
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!latest) return null;
  return {
    jpy_per_usd: Number(latest.jpy_per_usd),
    source: latest.source,
    rate_date: latest.rate_date,
    recorded_at: latest.recorded_at,
    stale:
      Date.now() - new Date(latest.recorded_at).getTime() > 60 * 60 * 1000,
  };
}

export default async function HomePage() {
  const t = await getTranslations('home');
  const tFormula = await getTranslations('dashboard');

  const [pointBalance, marketPrice, fxRate] = await Promise.all([
    loadInitialPointBalance(),
    loadInitialMarketPrice(),
    loadInitialFxRate(),
  ]);

  const params = getCurrentPriceParams();

  const fullTitle = t('hero_title');
  const splitIdx = fullTitle.indexOf(': ');
  const titleHead =
    splitIdx >= 0 ? fullTitle.slice(0, splitIdx + 1) : fullTitle;
  const titleTail = splitIdx >= 0 ? fullTitle.slice(splitIdx + 2) : '';

  // Mobile-only 3-line breakdown of the tail, derived from punctuation:
  //   "A Reserve-Backed," / "Self-Adjusting" / "Utility Token"
  // Falls back to a single line if the structure changes unexpectedly.
  const mobileLines: string[] = (() => {
    if (!titleTail) return [];
    const commaIdx = titleTail.indexOf(', ');
    if (commaIdx < 0) return [titleTail];
    const first = titleTail.slice(0, commaIdx + 1); // keep the comma
    const rest = titleTail.slice(commaIdx + 2);
    const spaceIdx = rest.indexOf(' ');
    if (spaceIdx < 0) return [first, rest];
    return [first, rest.slice(0, spaceIdx), rest.slice(spaceIdx + 1)];
  })();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-10">
        <h1 className="font-mono font-bold tracking-tight text-text-primary">
          <span className="block text-3xl sm:text-4xl lg:text-5xl">
            {titleHead}
          </span>

          {/* Mobile: stack the tail as multiple lines */}
          {mobileLines.length > 0 && (
            <span className="mt-1 block text-2xl leading-tight sm:hidden">
              {mobileLines.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </span>
          )}

          {/* sm and above: single-line tail with auto-fit shrinking */}
          {titleTail && (
            <span className="hidden sm:block">
              <FitNumber
                maxFontSize={56}
                minFontSize={14}
                className="mt-1 font-mono"
              >
                {titleTail}
              </FitNumber>
            </span>
          )}
        </h1>
        <p className="mt-4 max-w-3xl text-base text-text-secondary sm:text-lg">
          {t('hero_subtitle')}
        </p>
      </section>

      <DashboardCards
        initialPointBalance={pointBalance}
        initialMarketPrice={marketPrice}
        initialFxRate={fxRate}
      />

      <section
        aria-label="Pricing formula"
        className="mt-8 rounded-lg border border-bg-elevated bg-bg-card p-5"
      >
        <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {tFormula('formula_label')}
        </div>
        <div className="mt-2 font-mono text-xl text-text-primary">
          V = a × (J<sub className="text-accent-cyan">USD</sub> − b)
          <sup className="text-accent-cyan">c</sup>
        </div>
        <div className="mt-2 font-mono text-xs text-text-secondary">
          a = {params.a} · b = {params.b} · c = {params.c}
        </div>
        <p className="mt-2 text-xs text-text-muted">{tFormula('formula_note')}</p>
      </section>

      <MiniCharts />
    </div>
  );
}
