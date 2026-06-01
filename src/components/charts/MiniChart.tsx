'use client';

import useSWR from 'swr';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface MiniChartProps {
  endpoint: string;
  yKey: 'j_value' | 'v_value' | 'price_usd';
  color?: string;
  label?: string;
}

interface HistoryRow {
  recorded_at: string;
  j_value?: number;
  v_value?: number;
  price_usd?: number;
}

interface HistoryResponse {
  range: string;
  points: HistoryRow[];
}

const fetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? (r.json() as Promise<HistoryResponse>) : null));

export function MiniChart({
  endpoint,
  yKey,
  color = '#00D9FF',
  label,
}: MiniChartProps) {
  const { data, isLoading } = useSWR<HistoryResponse | null>(endpoint, fetcher, {
    refreshInterval: 5 * 60 * 1000,
  });

  const points = (data?.points ?? []).map((p) => ({
    t: new Date(p.recorded_at).getTime(),
    y: p[yKey] ?? 0,
  }));

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-text-muted">
        Loading…
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-text-muted">
        {label ? `No ${label} data yet` : 'No data yet'}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={128}>
      <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <XAxis dataKey="t" hide />
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={{
            background: '#111827',
            border: '1px solid #1F2937',
            fontSize: 11,
          }}
          labelFormatter={(v) => new Date(v as number).toUTCString()}
        />
        <Line
          type="monotone"
          dataKey="y"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
