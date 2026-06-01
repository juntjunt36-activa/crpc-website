'use client';

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface FullChartProps {
  points: { t: number; y: number }[];
  color?: string;
  yFormatter?: (n: number) => string;
  yLabel?: string;
}

export function FullChart({
  points,
  color = '#00D9FF',
  yFormatter,
  yLabel,
}: FullChartProps) {
  if (points.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-text-muted sm:h-[500px]">
        No data in this range.
      </div>
    );
  }

  return (
    <div className="h-[300px] sm:h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={points}
          margin={{ top: 16, right: 24, bottom: 24, left: 16 }}
        >
          <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
          <XAxis
            dataKey="t"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(v) =>
              new Date(v as number).toISOString().slice(5, 10)
            }
            stroke="#9CA3AF"
            tick={{ fontSize: 11 }}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fontSize: 11 }}
            tickFormatter={yFormatter}
            domain={['auto', 'auto']}
            width={80}
            label={
              yLabel
                ? {
                    value: yLabel,
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#9CA3AF',
                    fontSize: 11,
                  }
                : undefined
            }
          />
          <Tooltip
            contentStyle={{
              background: '#111827',
              border: '1px solid #1F2937',
              fontSize: 12,
            }}
            labelStyle={{ color: '#9CA3AF' }}
            labelFormatter={(v) => new Date(v as number).toUTCString()}
            formatter={(value: number) => [
              yFormatter ? yFormatter(value) : value,
              yLabel ?? '',
            ]}
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
    </div>
  );
}
