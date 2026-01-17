import { Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { CompressionProgress, formatBytes } from '@/utils/videoCompressor';

interface VideoCompressionProgressProps {
  progress: CompressionProgress;
  originalSize?: number;
}

export function VideoCompressionProgress({ 
  progress, 
  originalSize 
}: VideoCompressionProgressProps) {
  const getStageIcon = () => {
    switch (progress.stage) {
      case 'loading':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'compressing':
        return <Zap className="h-5 w-5 text-amber-500" />;
      case 'done':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getStageColor = () => {
    switch (progress.stage) {
      case 'loading':
        return 'text-primary';
      case 'compressing':
        return 'text-amber-600';
      case 'done':
        return 'text-green-600';
      case 'error':
        return 'text-destructive';
    }
  };

  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        {getStageIcon()}
        <span className={`text-sm font-medium ${getStageColor()}`}>
          {progress.stage === 'loading' && 'Chargement du moteur'}
          {progress.stage === 'compressing' && 'Compression en cours'}
          {progress.stage === 'done' && 'Compression terminée !'}
          {progress.stage === 'error' && 'Erreur de compression'}
        </span>
      </div>

      {/* Progress bar */}
      {(progress.stage === 'loading' || progress.stage === 'compressing') && (
        <div className="space-y-1">
          <Progress value={progress.progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {progress.progress}%
          </p>
        </div>
      )}

      {/* Message */}
      <p className="text-xs text-muted-foreground">
        {progress.message}
      </p>

      {/* Size info during compression */}
      {progress.stage === 'compressing' && originalSize && (
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-background/50 rounded px-2 py-1">
          <span>Taille originale :</span>
          <span className="font-medium">{formatBytes(originalSize)}</span>
        </div>
      )}

      {/* Info text */}
      {progress.stage === 'loading' && (
        <p className="text-xs text-muted-foreground/70 italic">
          Le moteur de compression est mis en cache pour les prochains uploads.
        </p>
      )}

      {progress.stage === 'compressing' && (
        <p className="text-xs text-muted-foreground/70 italic">
          La compression peut prendre quelques instants selon la taille de la vidéo.
        </p>
      )}
    </div>
  );
}
