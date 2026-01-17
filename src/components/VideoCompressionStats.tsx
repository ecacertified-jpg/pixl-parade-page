import { CheckCircle2, TrendingDown, Clock, Film } from 'lucide-react';
import { formatBytes } from '@/utils/videoCompressor';
import { cn } from '@/lib/utils';

interface VideoCompressionStatsProps {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  duration: number; // in seconds
  resolution?: { width: number; height: number };
  className?: string;
  compact?: boolean;
}

export function VideoCompressionStats({
  originalSize,
  compressedSize,
  compressionRatio,
  duration,
  resolution,
  className,
  compact = false,
}: VideoCompressionStatsProps) {
  const reductionPercent = Math.round(compressionRatio * 100);
  const isGoodReduction = reductionPercent >= 30;
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}min ${secs > 0 ? secs + 's' : ''}`;
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 text-xs', className)}>
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        <span className="text-muted-foreground">
          {formatBytes(originalSize)} → {formatBytes(compressedSize)}
        </span>
        <span className={cn(
          'font-medium',
          isGoodReduction ? 'text-green-600' : 'text-amber-600'
        )}>
          -{reductionPercent}%
        </span>
      </div>
    );
  }

  return (
    <div className={cn('bg-green-50 dark:bg-green-950/30 rounded-lg p-4 space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <span className="text-sm font-medium text-green-700 dark:text-green-400">
          Compression terminée !
        </span>
      </div>

      {/* Size reduction bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Réduction de taille</span>
          <span className={cn(
            'font-semibold',
            isGoodReduction ? 'text-green-600' : 'text-amber-600'
          )}>
            -{reductionPercent}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isGoodReduction ? 'bg-green-500' : 'bg-amber-500'
            )}
            style={{ width: `${100 - reductionPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="line-through">{formatBytes(originalSize)}</span>
          <TrendingDown className="h-3 w-3" />
          <span className="font-medium text-foreground">{formatBytes(compressedSize)}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-green-200 dark:border-green-800">
        <div className="flex items-center gap-1.5 text-xs">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Durée :</span>
          <span className="font-medium">{formatDuration(duration)}</span>
        </div>
        {resolution && (
          <div className="flex items-center gap-1.5 text-xs">
            <Film className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Résolution :</span>
            <span className="font-medium">{resolution.height}p</span>
          </div>
        )}
      </div>
    </div>
  );
}
