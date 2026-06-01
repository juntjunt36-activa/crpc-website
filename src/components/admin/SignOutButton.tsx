'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function SignOutButton() {
  const t = useTranslations('admin');
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onSignOut = async () => {
    if (busy) return;
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={() => void onSignOut()}
      disabled={busy}
      className="inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-primary disabled:opacity-50"
    >
      <LogOut className="h-3.5 w-3.5" aria-hidden />
      {busy ? t('signing_out') : t('sign_out')}
    </button>
  );
}
