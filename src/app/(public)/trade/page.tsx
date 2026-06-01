import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ExternalLink } from 'lucide-react';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'How to trade CRPC',
  description:
    'CRPC is listed on DigiFinex. This page explains how to deposit, buy, and what to expect on the order book.',
};

export default async function TradePage() {
  const t = await getTranslations('trade');
  const steps = t.raw('steps.items') as string[];
  const restricted = t.raw('restrictions.countries') as string[];

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="font-mono text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-3 text-base text-text-secondary">{t('lede')}</p>
      </header>

      <section className="mb-10">
        <h2 className="font-mono text-lg font-semibold text-text-primary">
          {t('where.heading')}
        </h2>
        <p className="mt-2 text-sm text-text-secondary">{t('where.body')}</p>
      </section>

      <section className="mb-10">
        <h2 className="font-mono text-lg font-semibold text-text-primary">
          {t('steps.heading')}
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-text-secondary marker:text-accent-cyan">
          {steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="font-mono text-lg font-semibold text-text-primary">
          {t('price.heading')}
        </h2>
        <p className="mt-2 text-sm text-text-secondary">{t('price.body')}</p>
      </section>

      <section className="mb-10 rounded-lg border border-signal-warning/40 bg-signal-warning/10 p-4 text-sm text-signal-warning">
        <h2 className="font-mono text-base font-semibold">
          {t('restrictions.heading')}
        </h2>
        <p className="mt-2 text-xs">{t('restrictions.intro')}</p>
        <ul className="mt-2 list-disc pl-5 text-xs">
          {restricted.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <a
        href={siteConfig.digifinexTradeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-md bg-accent-cyan px-5 py-3 font-mono text-sm font-semibold text-bg-base transition-opacity hover:opacity-90"
      >
        {t('cta')} <ExternalLink className="h-4 w-4" aria-hidden />
      </a>

      <p className="mt-6 text-xs text-text-muted">{t('disclaimer')}</p>
    </article>
  );
}
