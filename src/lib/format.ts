import { formatDistanceToNowStrict } from 'date-fns';

export const formatUSD = (n: number, fractionDigits = 6): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);

export const formatNumber = (n: number): string =>
  new Intl.NumberFormat('en-US').format(n);

export const formatPercent = (n: number, fractionDigits = 2): string =>
  `${n >= 0 ? '+' : ''}${n.toFixed(fractionDigits)}%`;

// "32s ago", "5m ago", "2h ago", "3d ago"
export const formatRelativeTime = (date: Date | string | number): string => {
  const d = date instanceof Date ? date : new Date(date);
  return `${formatDistanceToNowStrict(d)} ago`;
};
