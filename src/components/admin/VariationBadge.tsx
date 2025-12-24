import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface VariationBadgeProps {
  value: number | null;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export function VariationBadge({ value, showIcon = true, size = 'sm' }: VariationBadgeProps) {
  if (value === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  const isPositive = value > 2;
  const isNegative = value < -2;
  const isStable = !isPositive && !isNegative;

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        size === 'sm' ? 'text-xs' : 'text-sm',
        isPositive && 'text-green-600 dark:text-green-400',
        isNegative && 'text-red-600 dark:text-red-400',
        isStable && 'text-muted-foreground'
      )}
    >
      {showIcon && <Icon className={cn(size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />}
      <span>{value > 0 ? '+' : ''}{value}%</span>
    </span>
  );
}

interface ObjectiveAttainmentBadgeProps {
  value: number | null;
  size?: 'sm' | 'md';
}

export function ObjectiveAttainmentBadge({ value, size = 'sm' }: ObjectiveAttainmentBadgeProps) {
  if (value === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  const isExceeded = value >= 100;
  const isClose = value >= 80 && value < 100;
  const isBehind = value < 80;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        size === 'sm' ? 'text-xs' : 'text-sm',
        isExceeded && 'text-green-600 dark:text-green-400',
        isClose && 'text-yellow-600 dark:text-yellow-400',
        isBehind && 'text-red-600 dark:text-red-400'
      )}
    >
      <span>{value}%</span>
      <span>
        {isExceeded && '🟢'}
        {isClose && '🟡'}
        {isBehind && '🔴'}
      </span>
    </span>
  );
}
