import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface GeoNoticeProps {
  variant?: 'banner' | 'inline';
  className?: string;
}

export function GeoNotice({ variant = 'banner', className }: GeoNoticeProps) {
  const t = useTranslations('geo_notice');
  const text = variant === 'banner' ? t('long') : t('short');

  return (
    <div
      role="note"
      aria-label="Geographic restriction notice"
      className={cn(
        'border-y border-signal-warning/40 bg-signal-warning/10 px-4 py-2 text-center text-sm text-signal-warning',
        variant === 'inline' && 'border-0 bg-transparent text-text-muted',
        className,
      )}
    >
      {text}
    </div>
  );
}
