import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ObjectiveProgressBarProps {
  label: string;
  actual: number;
  target: number;
  format?: 'number' | 'currency' | 'percent';
  showDetails?: boolean;
  compact?: boolean;
}

export function ObjectiveProgressBar({
  label,
  actual,
  target,
  format = 'number',
  showDetails = true,
  compact = false
}: ObjectiveProgressBarProps) {
  const percentage = target > 0 ? Math.min((actual / target) * 100, 150) : 0;
  const displayPercentage = target > 0 ? Math.round((actual / target) * 100) : 0;
  
  const getStatusColor = (pct: number) => {
    if (pct >= 100) return 'text-green-600 dark:text-green-400';
    if (pct >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return 'bg-green-500';
    if (pct >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatValue = (value: number) => {
    switch (format) {
      case 'currency':
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
          return `${(value / 1000).toFixed(0)}K`;
        }
        return value.toLocaleString('fr-FR');
      case 'percent':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString('fr-FR');
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn('h-full transition-all duration-500', getProgressColor(displayPercentage))}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
        <span className={cn('text-xs font-medium min-w-[40px] text-right', getStatusColor(displayPercentage))}>
          {displayPercentage}%
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className={cn('text-sm font-semibold', getStatusColor(displayPercentage))}>
          {displayPercentage}%
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn('h-full transition-all duration-500', getProgressColor(displayPercentage))}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {showDetails && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatValue(actual)} réalisé</span>
          <span>Objectif: {formatValue(target)}</span>
        </div>
      )}
    </div>
  );
}
