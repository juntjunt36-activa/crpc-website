import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Roadmap',
  description: 'CRPC roadmap: transparency MVP, contract v2 migration, and DEX integration.',
};

const PHASES = ['phase_1', 'phase_2', 'phase_3'] as const;
type Phase = (typeof PHASES)[number];

const STATUS_BADGE: Record<Phase, { tone: string; key: string }> = {
  phase_1: { tone: 'bg-signal-success/20 text-signal-success', key: 'status_live' },
  phase_2: { tone: 'bg-signal-warning/20 text-signal-warning', key: 'status_planned' },
  phase_3: { tone: 'bg-bg-elevated text-text-secondary', key: 'status_planned' },
};

export default async function RoadmapPage() {
  const t = await getTranslations('roadmap');

  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 max-w-2xl">
        <h1 className="font-mono text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-3 text-base text-text-secondary">{t('lede')}</p>
      </header>

      <div className="space-y-6">
        {PHASES.map((phase) => {
          const bullets = t.raw(`${phase}.bullets`) as string[];
          const badge = STATUS_BADGE[phase];
          return (
            <section
              key={phase}
              className="rounded-lg border border-bg-elevated bg-bg-card p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-xs uppercase tracking-wide text-text-muted">
                    {t(`${phase}.when`)}
                  </div>
                  <h2 className="mt-1 font-mono text-xl font-semibold text-text-primary">
                    {t(`${phase}.heading`)}
                  </h2>
                </div>
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                    badge.tone,
                  )}
                >
                  {t(badge.key)}
                </span>
              </div>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-text-secondary marker:text-accent-cyan">
                {bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </article>
  );
}
