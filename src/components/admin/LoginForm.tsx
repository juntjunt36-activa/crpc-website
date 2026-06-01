'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export function LoginForm() {
  const t = useTranslations('admin.login');
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSignIn = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setBusy(false);
      return;
    }

    const next = searchParams.get('next') ?? '/admin';
    router.push(next);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="admin-email"
          className="block text-xs font-medium text-text-secondary"
        >
          {t('email_label')}
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
          className="w-full rounded-md border border-bg-elevated bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan focus:outline-none disabled:opacity-50"
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="admin-password"
          className="block text-xs font-medium text-text-secondary"
        >
          {t('password_label')}
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void onSignIn();
          }}
          disabled={busy}
          className="w-full rounded-md border border-bg-elevated bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-accent-cyan focus:outline-none disabled:opacity-50"
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

      <button
        type="button"
        onClick={() => void onSignIn()}
        disabled={busy || !email || !password}
        className={cn(
          'w-full rounded-md bg-accent-cyan px-4 py-2 text-sm font-semibold text-bg-base transition-opacity',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'hover:opacity-90',
        )}
      >
        {busy ? t('signing_in') : t('sign_in')}
      </button>
    </div>
  );
}
