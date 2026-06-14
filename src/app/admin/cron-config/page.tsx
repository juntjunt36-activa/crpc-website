import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  DigiFinexSettingsForm,
  type DigiFinexSettings,
} from '@/components/admin/DigiFinexSettingsForm';
import { CronDryRunPanel } from '@/components/admin/CronDryRunPanel';
import { CronMasterToggle } from '@/components/admin/CronMasterToggle';

export const dynamic = 'force-dynamic';

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

interface SettingsRow extends DigiFinexSettings {
  cron_enabled: boolean;
}

export default async function CronConfigPage() {
  const t = await getTranslations('admin.cron');
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const [{ data: settings }, { data: logRows }] = await Promise.all([
    supabase
      .from('digifinex_settings')
      .select(
        'symbol, amount, price, coupon_issued, coupon_used, cron_enabled, updated_at',
      )
      .eq('id', 1)
      .maybeSingle(),
    admin
      .from('digifinex_order_log')
      .select(
        'id, occurred_at, job_name, account, mode, response_code, order_id, error, coupon_remaining',
      )
      .order('occurred_at', { ascending: false })
      .limit(20),
  ]);

  const row = settings ? (settings as SettingsRow) : null;
  const logs = (logRows ?? []) as RecentLogRow[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
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

      <div className="space-y-6">
        {row ? (
          <>
            <CronMasterToggle initialEnabled={row.cron_enabled} />
            <DigiFinexSettingsForm initial={row} />
          </>
        ) : (
          <div
            role="alert"
            className="rounded-md border border-signal-warning/40 bg-signal-warning/10 p-4 text-xs text-signal-warning"
          >
            {t('not_initialized')}
          </div>
        )}

        <CronDryRunPanel />

        <section className="rounded-lg border border-bg-elevated bg-bg-card">
          <div className="border-b border-bg-elevated px-4 py-3">
            <h2 className="text-sm font-semibold text-text-secondary">
              {t('recent_runs')}
            </h2>
          </div>
          {logs.length === 0 ? (
            <p className="px-4 py-6 text-sm text-text-muted">{t('no_runs')}</p>
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
                  {logs.map((r) => (
                    <tr key={r.id} className="border-t border-bg-elevated">
                      <td className="px-4 py-2 font-mono text-text-muted">
                        {r.occurred_at.slice(0, 19).replace('T', ' ')}
                      </td>
                      <td className="px-4 py-2 font-mono">{r.job_name ?? '—'}</td>
                      <td className="px-4 py-2 font-mono">{r.account ?? '—'}</td>
                      <td className="px-4 py-2 font-mono text-text-muted">
                        {r.mode}
                      </td>
                      <td
                        className={`px-4 py-2 font-mono ${
                          r.response_code === 0
                            ? 'text-signal-success'
                            : r.response_code === null
                              ? 'text-text-muted'
                              : 'text-signal-danger'
                        }`}
                      >
                        {r.response_code ?? '—'}
                      </td>
                      <td className="px-4 py-2 font-mono text-text-muted">
                        {r.coupon_remaining ?? '—'}
                      </td>
                      <td className="px-4 py-2 font-mono text-text-muted">
                        {r.order_id ?? r.error ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
