'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { formatRelativeTime } from '@/lib/format';

interface LastUpdatedProps {
  date: Date | string | null;
}

export function LastUpdated({ date }: LastUpdatedProps) {
  const t = useTranslations('common');
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!date) return;
    const id = setInterval(() => setTick((n) => n + 1), 10_000);
    return () => clearInterval(id);
  }, [date]);

  if (!date) {
    return <span className="text-xs text-text-muted">—</span>;
  }
  const d = date instanceof Date ? date : new Date(date);
  return (
    <span className="text-xs text-text-muted" suppressHydrationWarning>
      {t('last_updated')} · {formatRelativeTime(d)}
    </span>
  );
}
