import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Settings } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { LatestPointBalanceCard } from '@/components/admin/LatestPointBalanceCard';
import { AuditLogList } from '@/components/admin/AuditLogList';
import { SignOutButton } from '@/components/admin/SignOutButton';

export const dynamic = 'force-dynamic';

export default async function AdminHomePage() {
  const t = await getTranslations('admin.home');
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-text-primary">
            {t('title')}
          </h1>
          {user?.email && (
            <p className="mt-1 text-sm text-text-muted">
              {t('signed_in_as', { email: user.email })}
            </p>
          )}
        </div>
        <SignOutButton />
      </header>

      <nav className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Admin sections">
        <Link
          href="/admin/point-balance"
          className="group rounded-lg border border-bg-elevated bg-bg-card p-4 transition-colors hover:border-accent-cyan/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text-primary">
              {t('link_point_balance')}
            </span>
            <ArrowRight
              className="h-4 w-4 text-text-muted transition-colors group-hover:text-accent-cyan"
              aria-hidden
            />
          </div>
          <p className="mt-1 text-xs text-text-muted">
            {t('link_point_balance_hint')}
          </p>
        </Link>
        <Link
          href="/admin/cron-config"
          className="group rounded-lg border border-bg-elevated bg-bg-card p-4 transition-colors hover:border-accent-cyan/40"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
              <Settings className="h-4 w-4 text-text-muted" aria-hidden />
              {t('link_cron')}
            </span>
            <ArrowRight
              className="h-4 w-4 text-text-muted transition-colors group-hover:text-accent-cyan"
              aria-hidden
            />
          </div>
          <p className="mt-1 text-xs text-text-muted">{t('link_cron_hint')}</p>
        </Link>
      </nav>

      <div className="space-y-8">
        <LatestPointBalanceCard />
        <AuditLogList />
      </div>
    </div>
  );
}
