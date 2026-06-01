import { getTranslations } from 'next-intl/server';
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

      <div className="space-y-8">
        <LatestPointBalanceCard />
        <AuditLogList />
      </div>
    </div>
  );
}
