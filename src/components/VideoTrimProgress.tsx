import { Loader2, CheckCircle2, AlertCircle, Scissors } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { TrimProgress } from '@/utils/videoTrimmer';
import { cn } from '@/lib/utils';

interface VideoTrimProgressProps {
  progress: TrimProgress;
  className?: string;
}

export function VideoTrimProgress({ progress, className }: VideoTrimProgressProps) {
  const getIcon = () => {
    switch (progress.stage) {
      case 'loading':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'trimming':
        return <Scissors className="h-5 w-5 text-primary animate-pulse" />;
      case 'done':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getStageLabel = () => {
    switch (progress.stage) {
      case 'loading':
        return 'Chargement';
      case 'trimming':
        return 'Découpe';
      case 'done':
        return 'Terminé';
      case 'error':
        return 'Erreur';
    }
  };

  return (
    <div className={cn("space-y-3 p-4 bg-muted/50 rounded-lg", className)}>
      <div className="flex items-center gap-3">
        {getIcon()}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{getStageLabel()}</span>
            {progress.stage !== 'error' && (
              <span className="text-xs text-muted-foreground">{progress.progress}%</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{progress.message}</p>
        </div>
      </div>
      
      {progress.stage !== 'error' && (
        <Progress 
          value={progress.progress} 
          className={cn(
            "h-2",
            progress.stage === 'done' && "[&>div]:bg-green-500"
          )}
        />
      )}
    </div>
  );
}
