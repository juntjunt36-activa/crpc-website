'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export type JobName = 'buy1' | 'buy2' | 'sell1' | 'sell2';

export interface CronConfig {
  name: JobName;
  symbol: string;
  amount: number;
  price: number;
  coupon_issued: number;
  coupon_used: number;
  updated_at: string;
}

interface CronConfigFormProps {
  initial: CronConfig;
}

const side = (name: JobName): 'buy' | 'sell' =>
  name.startsWith('buy') ? 'buy' : 'sell';

const account = (name: JobName): 1 | 2 =>
  name.endsWith('1') ? 1 : 2;

const activeCounter = (name: JobName): 'coupon_issued' | 'coupon_used' =>
  side(name) === 'buy' ? 'coupon_issued' : 'coupon_used';

export function CronConfigForm({ initial }: CronConfigFormProps) {
  const t = useTranslations('admin.cron');
  const router = useRouter();

  const [form, setForm] = useState({
    symbol: initial.symbol,
    amount: String(initial.amount),
    price: String(initial.price),
    coupon_issued: String(initial.coupon_issued),
    coupon_used: String(initial.coupon_used),
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(
    null,
  );
  const [testResult, setTestResult] = useState<string | null>(null);

  const active = activeCounter(initial.name);

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
        name: initial.name,
        symbol: form.symbol.trim().toLowerCase(),
        amount: Number(form.amount),
        price: Number(form.price),
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

  const onTest = async () => {
    if (busy) return;
    setBusy(true);
    setTestResult(null);
    setMessage(null);
    const res = await fetch('/api/admin/digifinex-order', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ job: initial.name, dry_run: true }),
    });
    const text = await res.text();
    setTestResult(`HTTP ${res.status}\n${text}`);
    setBusy(false);
  };

  const sd = side(initial.name);
  const acct = account(initial.name);
  const sideTone = sd === 'buy' ? 'text-signal-success' : 'text-signal-danger';

  return (
    <div className="rounded-lg border border-bg-elevated bg-bg-card p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="font-mono text-lg font-semibold text-text-primary">
            <span className={cn(sideTone, 'uppercase')}>{sd}</span>
            <span className="ml-1 text-text-muted">/ account {acct}</span>
          </h2>
          <p className="mt-0.5 text-[11px] text-text-muted">
            cron name: <span className="font-mono">{initial.name}</span> · counter:{' '}
            <span className="font-mono text-accent-cyan">{active}</span>
          </p>
        </div>
        <span className="text-[10px] text-text-muted" suppressHydrationWarning>
          {new Date(initial.updated_at).toUTCString().slice(5, 22)}
        </span>
      </div>

      <div className="space-y-3">
        <Field label={t('symbol')}>
          <input
            type="text"
            value={form.symbol}
            onChange={(e) => set('symbol')(e.target.value)}
            disabled={busy}
            className={input}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('amount')}>
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
          <Field label={t('price')}>
            <input
              type="number"
              step="any"
              min={0}
              value={form.price}
              onChange={(e) => set('price')(e.target.value)}
              disabled={busy}
              className={input}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="coupon_issued"
            highlight={active === 'coupon_issued'}
          >
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
          <Field
            label="coupon_used"
            highlight={active === 'coupon_used'}
          >
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

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={busy}
          className={cn(
            'flex-1 rounded-md bg-accent-cyan px-3 py-2 text-xs font-semibold text-bg-base transition-opacity',
            'disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90',
          )}
        >
          {busy ? '…' : t('save')}
        </button>
        <button
          type="button"
          onClick={() => void onTest()}
          disabled={busy}
          className={cn(
            'rounded-md border border-bg-elevated px-3 py-2 text-xs text-text-secondary',
            'disabled:cursor-not-allowed disabled:opacity-50 hover:text-text-primary',
          )}
          title={t('test_hint')}
        >
          {t('dry_run')}
        </button>
      </div>

      {testResult && (
        <pre className="mt-3 max-h-48 overflow-auto rounded-md bg-bg-base p-2 text-[10px] leading-snug text-text-muted">
          {testResult}
        </pre>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  highlight,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span
        className={cn(
          'text-[10px] uppercase tracking-wide',
          highlight ? 'text-accent-cyan' : 'text-text-muted',
        )}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const input =
  'w-full rounded-md border border-bg-elevated bg-bg-base px-2.5 py-1.5 font-mono text-sm text-text-primary focus:border-accent-cyan focus:outline-none disabled:opacity-50';
