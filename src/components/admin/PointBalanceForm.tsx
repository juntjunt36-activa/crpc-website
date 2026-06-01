'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { calculateTheoreticalPrice } from '@/lib/pricing';
import { jpyToUsd } from '@/lib/fx';
import { formatNumber, formatUSD } from '@/lib/format';
import { cn } from '@/lib/utils';

interface PointBalanceFormProps {
  params: { a: number; b: number; c: number };
  previousJpy: number | null;
  initialFxRate: number | null;
}

interface FxLatestPayload {
  jpy_per_usd: number;
  source: string;
  stale: boolean;
  recorded_at: string;
}

const LARGE_DELTA_THRESHOLD = 0.1; // 10%
const FX_POLL_INTERVAL_MS = 10 * 60 * 1000;

const fxFetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? (r.json() as Promise<FxLatestPayload>) : null));

export function PointBalanceForm({
  params,
  previousJpy,
  initialFxRate,
}: PointBalanceFormProps) {
  const t = useTranslations('admin.form');
  const router = useRouter();

  const [jpyInput, setJpyInput] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: fxLatest } = useSWR<FxLatestPayload | null>(
    '/api/fx-rate/latest',
    fxFetcher,
    {
      fallbackData: initialFxRate
        ? {
            jpy_per_usd: initialFxRate,
            source: 'preload',
            stale: false,
            recorded_at: new Date().toISOString(),
          }
        : null,
      refreshInterval: FX_POLL_INTERVAL_MS,
    },
  );
  const fxRate = fxLatest?.jpy_per_usd ?? null;

  const jJpy = Number(jpyInput);
  const jpyValid = Number.isFinite(jJpy) && jJpy > 0;
  const jUsd = jpyValid && fxRate ? jpyToUsd(jJpy, fxRate) : 0;
  const formulaInputValid = jpyValid && fxRate !== null && jUsd > params.b;
  const projectedV = formulaInputValid
    ? calculateTheoreticalPrice(jUsd, params)
    : 0;

  const deltaPercent =
    previousJpy && previousJpy > 0
      ? ((jJpy - previousJpy) / previousJpy) * 100
      : null;
  const largeJump =
    deltaPercent !== null && Math.abs(deltaPercent) / 100 > LARGE_DELTA_THRESHOLD;

  const onSubmit = async () => {
    if (busy) return;
    setError(null);
    setSuccess(null);

    if (!jpyValid) {
      setError(t('invalid_jpy'));
      return;
    }
    if (!fxRate) {
      setError(t('no_fx'));
      return;
    }

    if (largeJump) {
      const ok = window.confirm(
        t('confirm_large_jump', { delta: deltaPercent!.toFixed(2) }),
      );
      if (!ok) return;
    }

    setBusy(true);

    const res = await fetch('/api/admin/point-balance', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ j_value_jpy: jJpy, note: note.trim() || null }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? t('server_error'));
      setBusy(false);
      return;
    }

    setSuccess(t('saved'));
    setJpyInput('');
    setNote('');
    setBusy(false);
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-bg-elevated bg-bg-base px-3 py-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-text-muted">{t('fx_label')}</span>
          {fxLatest?.stale && (
            <span className="rounded bg-signal-warning/20 px-1.5 py-0.5 text-[10px] uppercase text-signal-warning">
              {t('fx_stale')}
            </span>
          )}
        </div>
        <div className="mt-1 font-mono text-base text-text-primary">
          {fxRate ? `1 USD = ${fxRate.toFixed(4)} JPY` : '—'}
        </div>
        {fxLatest?.source && (
          <div className="mt-1 text-[10px] text-text-muted">
            {t('fx_source', { source: fxLatest.source })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="j-value-jpy"
          className="block text-xs font-medium text-text-secondary"
        >
          {t('jpy_label')}
        </label>
        <input
          id="j-value-jpy"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={jpyInput}
          onChange={(e) => setJpyInput(e.target.value)}
          disabled={busy}
          className="w-full rounded-md border border-bg-elevated bg-bg-base px-3 py-2 font-mono text-lg text-text-primary focus:border-accent-cyan focus:outline-none disabled:opacity-50"
          placeholder="0"
        />
        <p className="text-xs text-text-muted">
          {t('jpy_help')}{' '}
          <span className="font-mono text-text-secondary">
            a={params.a}, b={params.b}, c={params.c}
          </span>
        </p>
      </div>

      {jpyValid && fxRate && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-bg-elevated bg-bg-base px-3 py-2 text-xs">
            <div className="text-text-muted">{t('converted_usd')}</div>
            <div className="mt-1 font-mono text-base text-text-primary">
              {formatUSD(jUsd, 2)}
            </div>
            <div className="mt-1 text-[10px] text-text-muted">
              {formatNumber(jJpy)} JPY ÷ {fxRate.toFixed(2)}
            </div>
          </div>
          <div className="rounded-md border border-bg-elevated bg-bg-base px-3 py-2 text-xs">
            <div className="text-text-muted">{t('projected_v')}</div>
            <div className="mt-1 font-mono text-base text-text-primary">
              {formatUSD(projectedV)}
            </div>
          </div>
        </div>
      )}

      {largeJump && (
        <div
          role="status"
          className="rounded-md border border-signal-warning/50 bg-signal-warning/10 px-3 py-2 text-xs text-signal-warning"
        >
          {t('large_jump_warning', { delta: deltaPercent!.toFixed(2) })}
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="note"
          className="block text-xs font-medium text-text-secondary"
        >
          {t('note_label')}
        </label>
        <textarea
          id="note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={busy}
          className="w-full rounded-md border border-bg-elevated bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-accent-cyan focus:outline-none disabled:opacity-50"
          placeholder={t('note_placeholder')}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-signal-danger/50 bg-signal-danger/10 px-3 py-2 text-xs text-signal-danger"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="rounded-md border border-signal-success/50 bg-signal-success/10 px-3 py-2 text-xs text-signal-success"
        >
          {success}
        </p>
      )}

      <button
        type="button"
        onClick={() => void onSubmit()}
        disabled={busy || !formulaInputValid}
        className={cn(
          'w-full rounded-md bg-accent-cyan px-4 py-2 text-sm font-semibold text-bg-base transition-opacity',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'hover:opacity-90',
        )}
      >
        {busy ? t('saving') : t('save')}
      </button>
    </div>
  );
}
