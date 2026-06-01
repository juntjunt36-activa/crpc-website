'use client';

import { cn } from '@/lib/utils';

export const RANGE_OPTIONS = ['7d', '30d', '90d', 'all'] as const;
export type Range = (typeof RANGE_OPTIONS)[number];

interface RangeSelectorProps {
  value: Range;
  onChange: (v: Range) => void;
}

const LABELS: Record<Range, string> = {
  '7d': '7D',
  '30d': '30D',
  '90d': '90D',
  all: 'ALL',
};

export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Time range"
      className="inline-flex rounded-md border border-bg-elevated bg-bg-card p-0.5"
    >
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          aria-pressed={value === opt}
          className={cn(
            'px-3 py-1 text-xs font-medium transition-colors',
            value === opt
              ? 'rounded bg-accent-cyan text-bg-base'
              : 'text-text-muted hover:text-text-primary',
          )}
        >
          {LABELS[opt]}
        </button>
      ))}
    </div>
  );
}
