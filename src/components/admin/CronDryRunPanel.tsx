'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type JobName = 'buy1' | 'buy2' | 'sell1' | 'sell2';

const JOBS: { name: JobName; account: 1 | 2; side: 'buy' | 'sell'; counter: string }[] = [
  { name: 'buy1', account: 1, side: 'buy', counter: 'coupon_issued' },
  { name: 'buy2', account: 2, side: 'buy', counter: 'coupon_used' },
  { name: 'sell1', account: 1, side: 'sell', counter: 'coupon_used (−1)' },
  { name: 'sell2', account: 2, side: 'sell', counter: 'coupon_issued (−1)' },
];

export function CronDryRunPanel() {
  const t = useTranslations('admin.cron');
  const [busy, setBusy] = useState<JobName | null>(null);
  const [result, setResult] = useState<{ job: JobName; body: string } | null>(null);

  const runDry = async (job: JobName) => {
    if (busy) return;
    setBusy(job);
    setResult(null);
    try {
      const res = await fetch('/api/admin/digifinex-order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ job, dry_run: true }),
      });
      const text = await res.text();
      setResult({ job, body: `HTTP ${res.status}\n${text}` });
    } catch (err) {
      setResult({ job, body: `Error: ${(err as Error).message}` });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-lg border border-bg-elevated bg-bg-card p-5">
      <h2 className="mb-1 font-mono text-base font-semibold text-text-primary">
        {t('dry_run_title')}
      </h2>
      <p className="mb-4 text-xs text-text-muted">{t('dry_run_hint')}</p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {JOBS.map((j) => (
          <button
            key={j.name}
            type="button"
            onClick={() => void runDry(j.name)}
            disabled={busy !== null}
            className={cn(
              'group flex flex-col items-start gap-0.5 rounded-md border border-bg-elevated bg-bg-base px-3 py-2 text-left text-xs transition-colors',
              'hover:border-accent-cyan/40 disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            <span
              className={cn(
                'font-mono font-semibold',
                j.side === 'buy' ? 'text-signal-success' : 'text-signal-danger',
              )}
            >
              {j.name}
            </span>
            <span className="text-[10px] text-text-muted">acct {j.account}</span>
            <span className="text-[10px] text-text-muted">{j.counter}</span>
          </button>
        ))}
      </div>

      {result && (
        <div className="mt-4">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-text-muted">
            {t('dry_run_result_for', { job: result.job })}
          </div>
          <pre className="max-h-72 overflow-auto rounded-md bg-bg-base p-3 text-[10px] leading-snug text-text-muted">
            {result.body}
          </pre>
        </div>
      )}
    </div>
  );
}
