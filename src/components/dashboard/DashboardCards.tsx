'use client';

import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { calculateDeviation } from '@/lib/pricing';
import { formatNumber, formatPercent, formatUSD } from '@/lib/format';
import { cn } from '@/lib/utils';
import { StatCard } from './StatCard';
import { LastUpdated } from './LastUpdated';
import type {
  FxRatePayload,
  MarketPricePayload,
  PointBalanceLatestPayload,
} from '@/types/dashboard';

interface DashboardCardsProps {
  initialPointBalance: PointBalanceLatestPayload | null;
  initialMarketPrice: MarketPricePayload | null;
  initialFxRate: FxRatePayload | null;
}

const STALE_THRESHOLD_MS = 5 * 60 * 1000;
const POLL_INTERVAL_MS = 60 * 1000;
const FX_POLL_INTERVAL_MS = 10 * 60 * 1000;

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
};

export function DashboardCards({
  initialPointBalance,
  initialMarketPrice,
  initialFxRate,
}: DashboardCardsProps) {
  const t = useTranslations('dashboard');

  const { data: pointBalance } = useSWR<PointBalanceLatestPayload | null>(
    '/api/point-balance/latest',
    fetcher,
    {
      fallbackData: initialPointBalance,
      refreshInterval: POLL_INTERVAL_MS,
    },
  );

  const { data: marketPrice } = useSWR<MarketPricePayload | null>(
    '/api/market-price',
    fetcher,
    {
      fallbackData: initialMarketPrice,
      refreshInterval: POLL_INTERVAL_MS,
    },
  );

  const { data: fxRate } = useSWR<FxRatePayload | null>(
    '/api/fx-rate/latest',
    fetcher,
    {
      fallbackData: initialFxRate,
      refreshInterval: FX_POLL_INTERVAL_MS,
    },
  );

  const v = pointBalance?.v_value ?? null;
  const jUsd = pointBalance?.j_value_usd ?? null;
  const jJpy = pointBalance?.j_value_jpy ?? null;
  const market = marketPrice?.price_usd ?? null;
  const deviation =
    v !== null && market !== null ? calculateDeviation(market, v) : null;

  const marketIsStale =
    marketPrice?.stale ||
    (marketPrice?.recorded_at
      ? Date.now() - new Date(marketPrice.recorded_at).getTime() >
        STALE_THRESHOLD_MS
      : false);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        label={t('v_label')}
        value={v !== null ? formatUSD(v) : '—'}
        footer={<LastUpdated date={pointBalance?.recorded_at ?? null} />}
      />
      <StatCard
        label={t('j_label')}
        value={jUsd !== null ? formatUSD(jUsd, 2) : '—'}
        sublabel={
          jJpy !== null
            ? t('j_jpy_sub', { jpy: formatNumber(jJpy) })
            : undefined
        }
        footer={<LastUpdated date={pointBalance?.recorded_at ?? null} />}
      />
      <StatCard
        label={t('market_label')}
        value={market !== null ? formatUSD(market, 4) : '—'}
        badge={
          marketIsStale ? (
            <span className="rounded bg-signal-warning/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-signal-warning">
              {t('stale')}
            </span>
          ) : null
        }
        footer={<LastUpdated date={marketPrice?.recorded_at ?? null} />}
      />
      <DeviationCard deviation={deviation} />
      <FxCard fxRate={fxRate ?? null} />
    </div>
  );
}

function DeviationCard({ deviation }: { deviation: number | null }) {
  const t = useTranslations('dashboard');

  if (deviation === null) {
    return (
      <StatCard
        label={t('deviation_label')}
        value="—"
        sublabel={t('deviation_pending')}
      />
    );
  }

  const abs = Math.abs(deviation);
  const tone =
    abs < 1
      ? 'text-signal-success'
      : abs < 10
        ? 'text-signal-warning'
        : 'text-signal-danger';

  const direction =
    deviation > 0
      ? t('deviation_above')
      : deviation < 0
        ? t('deviation_below')
        : t('deviation_equal');

  return (
    <StatCard
      label={t('deviation_label')}
      value={formatPercent(deviation)}
      sublabel={direction}
      valueClassName={cn(tone)}
    />
  );
}

function FxCard({ fxRate }: { fxRate: FxRatePayload | null }) {
  const t = useTranslations('dashboard');
  return (
    <StatCard
      label={t('fx_label')}
      value={
        fxRate ? `¥${fxRate.jpy_per_usd.toFixed(2)}` : '—'
      }
      sublabel={fxRate ? t('fx_sub', { source: fxRate.source }) : undefined}
      badge={
        fxRate?.stale ? (
          <span className="rounded bg-signal-warning/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-signal-warning">
            {t('stale')}
          </span>
        ) : null
      }
      footer={<LastUpdated date={fxRate?.recorded_at ?? null} />}
    />
  );
}
