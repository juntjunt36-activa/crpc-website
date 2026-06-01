'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { FullChart } from '@/components/charts/FullChart';
import { RangeSelector, type Range } from '@/components/charts/RangeSelector';
import { formatRelativeTime, formatUSD } from '@/lib/format';

type Variant = 'theoretical-price' | 'point-balance' | 'market-price';

interface HistoryViewProps {
  variant: Variant;
}

interface HistoryRow {
  recorded_at: string;
  j_value?: number;
  v_value?: number;
  price_usd?: number;
  source?: string;
  note?: string | null;
}

interface HistoryResponse {
  range: string;
  points: HistoryRow[];
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as HistoryResponse;
};

const ENDPOINTS: Record<Variant, string> = {
  'theoretical-price': '/api/point-balance/history',
  'point-balance': '/api/point-balance/history',
  'market-price': '/api/market-price/history',
};

const COLORS: Record<Variant, string> = {
  'theoretical-price': '#00D9FF',
  'point-balance': '#FFD700',
  'market-price': '#10B981',
};

export function HistoryView({ variant }: HistoryViewProps) {
  const t = useTranslations('history');
  const [range, setRange] = useState<Range>('30d');

  const { data, isLoading } = useSWR<HistoryResponse>(
    `${ENDPOINTS[variant]}?range=${range}`,
    fetcher,
    { refreshInterval: 5 * 60 * 1000 },
  );

  const points = (data?.points ?? []).map((p) => ({
    t: new Date(p.recorded_at).getTime(),
    y: pickValue(p, variant),
  }));

  const yFormatter = (n: number): string => {
    if (variant === 'point-balance') return formatUSD(n, 2);
    return formatUSD(n, variant === 'market-price' ? 4 : 6);
  };

  const recent = [...(data?.points ?? [])].reverse().slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <RangeSelector value={range} onChange={setRange} />
        {isLoading && (
          <span className="text-xs text-text-muted">{t('loading')}</span>
        )}
      </div>

      <div className="rounded-lg border border-bg-elevated bg-bg-card p-4 sm:p-6">
        <FullChart
          points={points}
          color={COLORS[variant]}
          yFormatter={yFormatter}
          yLabel={t(`y_label.${variant}`)}
        />
      </div>

      <div className="rounded-lg border border-bg-elevated bg-bg-card">
        <div className="border-b border-bg-elevated px-4 py-3">
          <h2 className="text-sm font-semibold text-text-secondary">
            {t('recent_title')}
          </h2>
        </div>
        {recent.length === 0 ? (
          <div className="px-4 py-6 text-sm text-text-muted">
            {t('empty')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-base/40 text-text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">{t('col_when')}</th>
                  <th className="px-4 py-2 font-medium text-right">
                    {t(`col_value.${variant}`)}
                  </th>
                  {variant === 'market-price' && (
                    <th className="px-4 py-2 font-medium">{t('col_source')}</th>
                  )}
                  {variant !== 'market-price' && (
                    <th className="px-4 py-2 font-medium">{t('col_note')}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {recent.map((row, i) => {
                  const value = pickValue(row, variant);
                  return (
                    <tr
                      key={`${row.recorded_at}-${i}`}
                      className="border-t border-bg-elevated"
                    >
                      <td
                        className="px-4 py-2 text-text-muted"
                        suppressHydrationWarning
                      >
                        {formatRelativeTime(new Date(row.recorded_at))}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-text-primary">
                        {yFormatter(value)}
                      </td>
                      {variant === 'market-price' && (
                        <td className="px-4 py-2">
                          <span className="rounded bg-bg-elevated px-1.5 py-0.5 text-[10px] uppercase text-text-secondary">
                            {row.source ?? '—'}
                          </span>
                        </td>
                      )}
                      {variant !== 'market-price' && (
                        <td className="px-4 py-2 text-text-muted">
                          {row.note ?? '—'}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function pickValue(row: HistoryRow, variant: Variant): number {
  switch (variant) {
    case 'theoretical-price':
      return Number(row.v_value ?? 0);
    case 'point-balance':
      return Number(row.j_value ?? 0);
    case 'market-price':
      return Number(row.price_usd ?? 0);
  }
}
