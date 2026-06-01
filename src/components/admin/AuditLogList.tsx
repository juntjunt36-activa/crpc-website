import { getTranslations } from 'next-intl/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { formatRelativeTime } from '@/lib/format';

export async function AuditLogList({ limit = 20 }: { limit?: number }) {
  const t = await getTranslations('admin.audit');
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('audit_log')
    .select('*')
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-signal-danger/50 bg-signal-danger/10 p-4 text-xs text-signal-danger"
      >
        {t('error', { message: error.message })}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-bg-elevated bg-bg-card p-4 text-sm text-text-muted">
        {t('empty')}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-bg-elevated bg-bg-card">
      <div className="border-b border-bg-elevated px-4 py-3">
        <h2 className="text-sm font-semibold text-text-secondary">
          {t('title')}
        </h2>
      </div>
      <ul className="divide-y divide-bg-elevated">
        {data.map((row) => {
          const occurredAt = new Date(row.occurred_at);
          return (
            <li key={row.id} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-xs text-text-primary">
                  {row.action}
                </span>
                <span
                  className="text-xs text-text-muted"
                  suppressHydrationWarning
                >
                  {formatRelativeTime(occurredAt)}
                </span>
              </div>
              {row.payload != null && (
                <pre className="mt-2 overflow-x-auto rounded bg-bg-base p-2 text-[10px] leading-snug text-text-muted">
                  {JSON.stringify(row.payload, null, 2)}
                </pre>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
