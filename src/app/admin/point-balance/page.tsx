import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getCurrentPriceParams } from '@/lib/pricing';
import { PointBalanceForm } from '@/components/admin/PointBalanceForm';

export const dynamic = 'force-dynamic';

export default async function AdminPointBalancePage() {
  const t = await getTranslations('admin.form');
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const [{ data: previous }, { data: fxRow }] = await Promise.all([
    supabase
      .from('point_balance_history')
      .select('j_value_jpy')
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('fx_rate_snapshots')
      .select('jpy_per_usd')
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const params = getCurrentPriceParams();
  const previousJpy =
    previous?.j_value_jpy != null ? Number(previous.j_value_jpy) : null;
  const initialFxRate = fxRow ? Number(fxRow.jpy_per_usd) : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {t('back_to_admin')}
      </Link>

      <header className="mb-6">
        <h1 className="font-mono text-2xl font-bold tracking-tight text-text-primary">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-text-muted">{t('subtitle')}</p>
      </header>

      <div className="rounded-lg border border-bg-elevated bg-bg-card p-6">
        <PointBalanceForm
          params={params}
          previousJpy={previousJpy}
          initialFxRate={initialFxRate}
        />
      </div>
    </div>
  );
}
