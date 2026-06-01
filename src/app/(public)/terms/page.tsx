import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Terms of Service',
  robots: { index: false, follow: true },
};

const SECTIONS = [
  'eligibility',
  'no_advice',
  'no_warranty',
  'no_solicitation',
  'governing_law',
] as const;

export default async function TermsPage() {
  const t = await getTranslations('terms');

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="font-mono text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            {t('title')}
          </h1>
          <span className="rounded bg-signal-warning/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-signal-warning">
            {t('draft_badge')}
          </span>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          {t('last_updated')}: {t('last_updated_value')}
        </p>
      </header>

      <div className="mb-8 rounded-lg border border-signal-warning/40 bg-signal-warning/10 p-4 text-xs text-signal-warning">
        {t('draft_disclaimer')}
      </div>

      <div className="space-y-8">
        {SECTIONS.map((key) => (
          <section key={key}>
            <h2 className="font-mono text-base font-semibold text-text-primary">
              {t(`sections.${key}.heading`)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {t(`sections.${key}.body`)}
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}
