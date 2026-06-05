import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { FeatureKey } from './types';
import { useQuota } from './useQuota';

const LABELS: Partial<Record<FeatureKey, string>> = {
  event_pages: 'Pages événement',
  active_funds: 'Cagnottes actives',
  album_photos_per_page: 'Photos / album',
  storage_mb: 'Stockage (Mo)',
  ai_recommendations: 'Suggestions IA / mois',
  co_organizers: 'Co-organisateurs',
};

interface QuotaBarProps {
  feature: FeatureKey;
  label?: string;
  className?: string;
}

export const QuotaBar = ({ feature, label, className }: QuotaBarProps) => {
  const { used, limit, unlimited, percent, isLoading } = useQuota(feature);

  if (isLoading) return null;

  const displayLabel = label ?? LABELS[feature] ?? feature;
  const isWarning = percent >= 75 && percent < 90;
  const isDanger = percent >= 90;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{displayLabel}</span>
        <span
          className={cn(
            'tabular-nums',
            isDanger ? 'text-destructive font-semibold' : isWarning ? 'text-[hsl(45_88%_45%)]' : 'text-muted-foreground'
          )}
        >
          {unlimited ? `${used} / ∞` : `${used} / ${limit}`}
        </span>
      </div>
      {!unlimited && (
        <Progress
          value={percent}
          className={cn(
            'h-1.5',
            isDanger && '[&>div]:bg-destructive',
            isWarning && '[&>div]:bg-[hsl(45_88%_55%)]'
          )}
        />
      )}
    </div>
  );
};