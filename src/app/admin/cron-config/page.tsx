import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  CronConfigForm,
  type CronConfig,
  type JobName,
} from '@/components/admin/CronConfigForm';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const JOB_ORDER: JobName[] = ['buy1', 'sell1', 'buy2', 'sell2'];

interface RecentLogRow {
  id: string;
  occurred_at: string;
  job_name: string | null;
  account: number | null;
  mode: string;
  response_code: number | null;
  order_id: string | null;
  error: string | null;
  coupon_remaining: number | null;
}

export default async function CronConfigPage() {
  const t = await getTranslations('admin.cron');
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const [{ data: configRows }, { data: logRows }] = await Promise.all([
    supabase.from('digifinex_cron_config').select('*'),
    admin
      .from('digifinex_order_log')
      .select(
        'id, occurred_at, job_name, account, mode, response_code, order_id, error, coupon_remaining',
      )
      .order('occurred_at', { ascending: false })
      .limit(20),
  ]);

  const configMap = new Map<JobName, CronConfig>();
  for (const row of (configRows ?? []) as CronConfig[]) {
    configMap.set(row.name, row);
  }
  const ordered = JOB_ORDER.map((name) => configMap.get(name)).filter(
    Boolean,
  ) as CronConfig[];

  const logs = (logRows ?? []) as RecentLogRow[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {t('back_to_admin')}
      </Link>

      <header className="mb-6 max-w-2xl">
        <h1 className="font-mono text-2xl font-bold tracking-tight text-text-primary">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-text-muted">{t('subtitle')}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {ordered.map((cfg) => (
          <CronConfigForm key={cfg.name} initial={cfg} />
        ))}
      </div>

      <section className="mt-10 rounded-lg border border-bg-elevated bg-bg-card">
        <div className="border-b border-bg-elevated px-4 py-3">
          <h2 className="text-sm font-semibold text-text-secondary">
            {t('recent_runs')}
          </h2>
        </div>
        {logs.length === 0 ? (
          <p className="px-4 py-6 text-sm text-text-muted">
            {t('no_runs')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-base/40 text-text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">When (UTC)</th>
                  <th className="px-4 py-2 font-medium">Job</th>
                  <th className="px-4 py-2 font-medium">Acct</th>
                  <th className="px-4 py-2 font-medium">Mode</th>
                  <th className="px-4 py-2 font-medium">Code</th>
                  <th className="px-4 py-2 font-medium">Counter</th>
                  <th className="px-4 py-2 font-medium">Order / Error</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((row) => (
                  <tr key={row.id} className="border-t border-bg-elevated">
                    <td className="px-4 py-2 font-mono text-text-muted">
                      {row.occurred_at.slice(0, 19).replace('T', ' ')}
                    </td>
                    <td className="px-4 py-2 font-mono">
                      {row.job_name ?? '—'}
                    </td>
                    <td className="px-4 py-2 font-mono">
                      {row.account ?? '—'}
                    </td>
                    <td className="px-4 py-2 font-mono text-text-muted">
                      {row.mode}
                    </td>
                    <td
                      className={`px-4 py-2 font-mono ${
                        row.response_code === 0
                          ? 'text-signal-success'
                          : row.response_code === null
                            ? 'text-text-muted'
                            : 'text-signal-danger'
                      }`}
                    >
                      {row.response_code ?? '—'}
                    </td>
                    <td className="px-4 py-2 font-mono text-text-muted">
                      {row.coupon_remaining ?? '—'}
                    </td>
                    <td className="px-4 py-2 font-mono text-text-muted">
                      {row.order_id ?? row.error ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
