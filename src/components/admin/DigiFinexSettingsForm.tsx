'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { formatUSD } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface DigiFinexSettings {
  symbol: string;
  amount: number;
  price: number;
  coupon_issued: number;
  coupon_used: number;
  updated_at: string;
}

interface SettingsFormProps {
  initial: DigiFinexSettings;
  latestV: number | null;
  latestVRecordedAt: string | null;
}

export function DigiFinexSettingsForm({
  initial,
  latestV,
  latestVRecordedAt,
}: SettingsFormProps) {
  const t = useTranslations('admin.cron');
  const router = useRouter();

  const [form, setForm] = useState({
    symbol: initial.symbol,
    amount: String(initial.amount),
    coupon_issued: String(initial.coupon_issued),
    coupon_used: String(initial.coupon_used),
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<
    { kind: 'ok' | 'err'; text: string } | null
  >(null);

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSave = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    const res = await fetch('/api/admin/digifinex-config', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        symbol: form.symbol.trim().toLowerCase(),
        amount: Number(form.amount),
        coupon_issued: Number(form.coupon_issued),
        coupon_used: Number(form.coupon_used),
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setMessage({ kind: 'err', text: body.error ?? t('save_failed') });
      setBusy(false);
      return;
    }
    setMessage({ kind: 'ok', text: t('saved') });
    setBusy(false);
    router.refresh();
  };

  return (
    <div className="rounded-lg border border-bg-elevated bg-bg-card p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-mono text-base font-semibold text-text-primary">
          {t('settings_title')}
        </h2>
        <span
          className="text-[10px] text-text-muted"
          suppressHydrationWarning
        >
          {new Date(initial.updated_at).toUTCString().slice(5, 22)}
        </span>
      </div>

      <p className="mb-4 text-xs text-text-muted">{t('settings_intro')}</p>

      <div className="space-y-3">
        <Field label="symbol">
          <input
            type="text"
            value={form.symbol}
            onChange={(e) => set('symbol')(e.target.value)}
            disabled={busy}
            className={input}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="amount">
            <input
              type="number"
              step="any"
              min={0}
              value={form.amount}
              onChange={(e) => set('amount')(e.target.value)}
              disabled={busy}
              className={input}
            />
          </Field>
          <ReadOnlyField
            label={t('price_auto_label')}
            hint={t('price_auto_hint')}
          >
            {latestV !== null ? (
              <>
                <span className="font-mono text-sm text-text-primary">
                  {formatUSD(latestV)}
                </span>
                {latestVRecordedAt && (
                  <span
                    className="ml-2 text-[10px] text-text-muted"
                    suppressHydrationWarning
                  >
                    {new Date(latestVRecordedAt).toUTCString().slice(5, 22)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-signal-warning">
                {t('price_no_v')}
              </span>
            )}
          </ReadOnlyField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="coupon_issued" hint={t('coupon_issued_hint')}>
            <input
              type="number"
              min={0}
              step={1}
              value={form.coupon_issued}
              onChange={(e) => set('coupon_issued')(e.target.value)}
              disabled={busy}
              className={input}
            />
          </Field>
          <Field label="coupon_used" hint={t('coupon_used_hint')}>
            <input
              type="number"
              min={0}
              step={1}
              value={form.coupon_used}
              onChange={(e) => set('coupon_used')(e.target.value)}
              disabled={busy}
              className={input}
            />
          </Field>
        </div>
      </div>

      {message && (
        <p
          role={message.kind === 'ok' ? 'status' : 'alert'}
          className={cn(
            'mt-3 rounded-md border px-3 py-2 text-xs',
            message.kind === 'ok'
              ? 'border-signal-success/50 bg-signal-success/10 text-signal-success'
              : 'border-signal-danger/50 bg-signal-danger/10 text-signal-danger',
          )}
        >
          {message.text}
        </p>
      )}

      <button
        type="button"
        onClick={() => void onSave()}
        disabled={busy}
        className={cn(
          'mt-4 w-full rounded-md bg-accent-cyan px-3 py-2 text-xs font-semibold text-bg-base transition-opacity',
          'disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90',
        )}
      >
        {busy ? '…' : t('save')}
      </button>
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[10px] uppercase tracking-wide text-text-muted">
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-[10px] text-text-muted">{hint}</span>
      )}
    </label>
  );
}

function ReadOnlyField({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] uppercase tracking-wide text-accent-cyan">
        {label}
      </span>
      <div className="flex min-h-[34px] items-center rounded-md border border-dashed border-bg-elevated bg-bg-base/50 px-2.5 py-1.5">
        {children}
      </div>
      {hint && (
        <span className="block text-[10px] text-text-muted">{hint}</span>
      )}
    </div>
  );
}

const input =
  'w-full rounded-md border border-bg-elevated bg-bg-base px-2.5 py-1.5 font-mono text-sm text-text-primary focus:border-accent-cyan focus:outline-none disabled:opacity-50';
