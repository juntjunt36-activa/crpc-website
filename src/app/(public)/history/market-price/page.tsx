import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { HistoryView } from '@/components/history/HistoryView';

export const metadata: Metadata = {
  title: 'Market price history',
};

export default async function MarketPriceHistoryPage() {
  const t = await getTranslations('history.market-price');

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6 max-w-2xl">
        <h1 className="font-mono text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          {t('title')}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">{t('subtitle')}</p>
      </header>
      <HistoryView variant="market-price" />
    </div>
  );
}
