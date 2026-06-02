import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'About CRPC',
  description:
    'How CRPC (CryptPointToken) derives its value from loyalty-point liability and how convergence between theoretical and market price is maintained.',
};

const SECTIONS = [
  'what_it_is',
  'what_backs',
  'how_value_grows',
  'convergence',
  'reserve_structure',
  'limits',
] as const;

export default async function AboutPage() {
  const t = await getTranslations('about');

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-12 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8">
        <Image
          src="/logo-crpc-vertical.svg"
          alt="CryptPoint"
          width={116}
          height={119}
          priority
          className="h-24 w-auto sm:h-28"
        />
        <div>
          <h1 className="font-mono text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-3 text-base text-text-secondary">{t('lede')}</p>
        </div>
      </header>

      <div className="space-y-10">
        {SECTIONS.map((key, idx) => (
          <section key={key} className="scroll-mt-24" id={key}>
            <h2 className="font-mono text-lg font-semibold text-text-primary">
              <span className="mr-2 text-accent-cyan">{idx + 1}.</span>
              {t(`sections.${key}.heading`)}
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-text-secondary">
              {(t.raw(`sections.${key}.paragraphs`) as string[]).map(
                (p, i) => (
                  <p key={i}>{p}</p>
                ),
              )}
            </div>
          </section>
        ))}
      </div>

      <aside className="mt-12 rounded-lg border border-signal-warning/40 bg-signal-warning/10 p-4 text-xs text-signal-warning">
        {t('risk_callout')}
      </aside>
    </article>
  );
}
