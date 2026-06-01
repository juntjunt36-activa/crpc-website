import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: React.ReactNode;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  valueClassName?: string;
}

export function StatCard({
  label,
  value,
  sublabel,
  badge,
  footer,
  className,
  valueClassName,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-bg-elevated bg-bg-card p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {label}
        </span>
        {badge}
      </div>
      <div
        className={cn(
          'mt-3 font-mono text-2xl tracking-tight text-text-primary sm:text-3xl',
          valueClassName,
        )}
      >
        {value}
      </div>
      {sublabel && <div className="mt-1 text-xs text-text-muted">{sublabel}</div>}
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}
