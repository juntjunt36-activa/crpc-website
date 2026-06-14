'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Power } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CronMasterToggleProps {
  initialEnabled: boolean;
}

export function CronMasterToggle({ initialEnabled }: CronMasterToggleProps) {
  const t = useTranslations('admin.cron');
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onToggle = async () => {
    if (busy) return;
    const nextState = !enabled;

    // Confirm before flipping ON — that's the "real money" direction.
    if (nextState) {
      const ok = window.confirm(t('toggle_confirm_on'));
      if (!ok) return;
    }

    setBusy(true);
    setError(null);
    const res = await fetch('/api/admin/digifinex-config', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cron_enabled: nextState }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? t('toggle_failed'));
      setBusy(false);
      return;
    }
    setEnabled(nextState);
    setBusy(false);
    router.refresh();
  };

  return (
    <section
      className={cn(
        'rounded-lg border p-5',
        enabled
          ? 'border-signal-success/40 bg-signal-success/5'
          : 'border-signal-warning/40 bg-signal-warning/5',
      )}
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Power
            className={cn(
              'h-6 w-6',
              enabled ? 'text-signal-success' : 'text-signal-warning',
            )}
            aria-hidden
          />
          <div>
            <h2 className="font-mono text-base font-semibold text-text-primary">
              {enabled ? t('toggle_on_title') : t('toggle_off_title')}
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              {enabled ? t('toggle_on_desc') : t('toggle_off_desc')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void onToggle()}
          disabled={busy}
          aria-pressed={enabled}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-opacity',
            enabled
              ? 'bg-signal-warning text-bg-base hover:opacity-90'
              : 'bg-signal-success text-bg-base hover:opacity-90',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {busy ? '…' : enabled ? t('toggle_button_off') : t('toggle_button_on')}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-md border border-signal-danger/50 bg-signal-danger/10 px-3 py-2 text-xs text-signal-danger"
        >
          {error}
        </p>
      )}
    </section>
  );
}
