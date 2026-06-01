import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatNumber, formatRelativeTime, formatUSD } from '@/lib/format';

export async function LatestPointBalanceCard() {
  const t = await getTranslations('admin.latest');
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('point_balance_history')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return (
      <div className="rounded-lg border border-bg-elevated bg-bg-card p-6">
        <h2 className="text-sm font-semibold text-text-secondary">
          {t('title')}
        </h2>
        <p className="mt-2 text-sm text-text-muted">{t('empty')}</p>
        <Link
          href="/admin/point-balance"
          className="mt-4 inline-flex items-center gap-1 text-sm text-accent-cyan hover:underline"
        >
          {t('insert_first')} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    );
  }

  const jUsd = Number(data.j_value);
  const jJpy = data.j_value_jpy != null ? Number(data.j_value_jpy) : null;
  const fxRate =
    data.fx_rate_jpy_per_usd != null
      ? Number(data.fx_rate_jpy_per_usd)
      : null;
  const v = Number(data.v_value);
  const recordedAt = new Date(data.recorded_at);
  const isLegacy = jJpy === null;

  return (
    <div className="rounded-lg border border-bg-elevated bg-bg-card p-6">
      <div className="flex items-start justify-between">
        <h2 className="text-sm font-semibold text-text-secondary">
          {t('title')}
        </h2>
        <span className="text-xs text-text-muted" suppressHydrationWarning>
          {formatRelativeTime(recordedAt)}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <dt className="text-xs text-text-muted">{t('j_label_usd')}</dt>
          <dd className="mt-1 font-mono text-xl text-text-primary">
            {formatUSD(jUsd, 2)}
          </dd>
          {jJpy !== null && (
            <dd className="mt-0.5 text-[11px] text-text-muted">
              {formatNumber(jJpy)} JPY @ {fxRate?.toFixed(2)}
            </dd>
          )}
          {isLegacy && (
            <dd className="mt-0.5 text-[11px] text-signal-warning">
              {t('legacy')}
            </dd>
          )}
        </div>
        <div>
          <dt className="text-xs text-text-muted">{t('v_label')}</dt>
          <dd className="mt-1 font-mono text-xl text-text-primary">
            {formatUSD(v)}
          </dd>
        </div>
      </dl>

      {data.note && (
        <p className="mt-4 border-l-2 border-bg-elevated pl-3 text-xs text-text-muted">
          {data.note}
        </p>
      )}

      <Link
        href="/admin/point-balance"
        className="mt-4 inline-flex items-center gap-1 text-sm text-accent-cyan hover:underline"
      >
        {t('insert_next')} <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
