import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Zap, X, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CompressionProgress, formatBytes, formatDuration } from '@/utils/videoCompressor';

interface VideoCompressionProgressProps {
  progress: CompressionProgress;
  originalSize?: number;
  onCancel?: () => void;
  showStats?: boolean;
}

export function VideoCompressionProgress({ 
  progress, 
  originalSize,
  onCancel,
  showStats = true,
}: VideoCompressionProgressProps) {
  const [startTime] = useState(() => Date.now());
  const [currentElapsed, setCurrentElapsed] = useState(0);

  // Update elapsed time every second
  useEffect(() => {
    if (progress.stage !== 'compressing' && progress.stage !== 'loading') {
      return;
    }

    const interval = setInterval(() => {
      setCurrentElapsed((Date.now() - startTime) / 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, progress.stage]);

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

  const getStageLabel = () => {
    switch (progress.stage) {
      case 'loading':
        return 'Chargement du moteur';
      case 'compressing':
        return 'Compression en cours';
      case 'done':
        return 'Compression terminée !';
      case 'error':
        return 'Erreur de compression';
    }
  };

  const elapsedTime = progress.elapsedTime ?? currentElapsed;
  const estimatedRemaining = progress.estimatedTimeRemaining;

  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStageIcon()}
          <span className={`text-sm font-medium ${getStageColor()}`}>
            {getStageLabel()}
          </span>
        </div>
        
        {/* Cancel button */}
        {onCancel && (progress.stage === 'loading' || progress.stage === 'compressing') && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="h-3 w-3 mr-1" />
            Annuler
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {(progress.stage === 'loading' || progress.stage === 'compressing') && (
        <div className="space-y-1">
          <Progress value={progress.progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress.progress}%</span>
            {progress.stage === 'compressing' && showStats && (
              <div className="flex items-center gap-3">
                {/* Elapsed time */}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(elapsedTime)}
                </span>
                {/* Estimated remaining */}
                {estimatedRemaining !== undefined && estimatedRemaining > 0 && (
                  <span className="text-muted-foreground/70">
                    ~{formatDuration(estimatedRemaining)} restant
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message */}
      <p className="text-xs text-muted-foreground">
        {progress.message}
      </p>

      {/* Size info during compression */}
      {showStats && progress.stage === 'compressing' && originalSize && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground bg-background/50 rounded px-2 py-1">
            <span>Taille originale :</span>
            <span className="font-medium">{formatBytes(originalSize)}</span>
          </div>
          {progress.processedBytes !== undefined && (
            <div className="flex items-center justify-between text-xs text-muted-foreground bg-background/50 rounded px-2 py-1">
              <span>Traité :</span>
              <span className="font-medium">
                {formatBytes(progress.processedBytes)} / {formatBytes(originalSize)}
              </span>
            </div>
          )}
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
