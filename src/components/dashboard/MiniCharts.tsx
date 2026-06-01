import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowUpRight } from 'lucide-react';
import { MiniChart } from '@/components/charts/MiniChart';

export async function MiniCharts() {
  const t = await getTranslations('dashboard');

  return (
    <section
      aria-label="Mini history charts"
      className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3"
    >
      <MiniChartCard
        href="/history/theoretical-price"
        title={t('chart_v')}
        endpoint="/api/point-balance/history?range=30d"
        yKey="v_value"
        color="#00D9FF"
        label="V"
      />
      <MiniChartCard
        href="/history/point-balance"
        title={t('chart_j')}
        endpoint="/api/point-balance/history?range=30d"
        yKey="j_value"
        color="#FFD700"
        label="J"
      />
      <MiniChartCard
        href="/history/market-price"
        title={t('chart_market')}
        endpoint="/api/market-price/history?range=30d"
        yKey="price_usd"
        color="#10B981"
        label="market"
      />
    </section>
  );
}

interface CardProps {
  href: string;
  title: string;
  endpoint: string;
  yKey: 'j_value' | 'v_value' | 'price_usd';
  color: string;
  label: string;
}

function MiniChartCard({ href, title, endpoint, yKey, color, label }: CardProps) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-bg-elevated bg-bg-card p-4 transition-colors hover:border-accent-cyan/40"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {title}
        </span>
        <ArrowUpRight
          className="h-3.5 w-3.5 text-text-muted transition-colors group-hover:text-accent-cyan"
          aria-hidden
        />
      </div>
      <div className="mt-2">
        <MiniChart
          endpoint={endpoint}
          yKey={yKey}
          color={color}
          label={label}
        />
      </div>
    </Link>
  );
}
