import { Film, Clock, HardDrive, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatBytes, estimateCompressionTime } from '@/utils/videoCompressor';
import { CompressionSettings, QUALITY_CRF_MAP, RESOLUTION_MAP } from '@/hooks/useCompressionSettings';

interface VideoCompressionPreviewProps {
  file: File;
  settings: CompressionSettings;
  open: boolean;
  onCompress: () => void;
  onSkip: () => void;
  onCancel: () => void;
}

// Estimate output size based on settings and input size
function estimateOutputSize(inputSize: number, quality: CompressionSettings['quality']): number {
  const reductionFactors = {
    low: 0.25,   // ~75% reduction
    medium: 0.40, // ~60% reduction
    high: 0.60,  // ~40% reduction
  };
  return Math.round(inputSize * reductionFactors[quality]);
}

export function VideoCompressionPreview({
  file,
  settings,
  open,
  onCompress,
  onSkip,
  onCancel,
}: VideoCompressionPreviewProps) {
  const estimation = estimateCompressionTime(file.size);
  const estimatedSize = estimateOutputSize(file.size, settings.quality);
  const resolution = RESOLUTION_MAP[settings.maxResolution];

  const qualityLabels = {
    low: { label: 'Basse', color: 'text-amber-600' },
    medium: { label: 'Moyenne', color: 'text-green-600' },
    high: { label: 'Haute', color: 'text-blue-600' },
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            Aperçu de la compression
          </DialogTitle>
          <DialogDescription>
            Vérifiez les paramètres avant de compresser votre vidéo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium truncate flex-1">{file.name}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                {formatBytes(file.size)}
              </span>
            </div>
          </div>

          {/* Compression preview */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Après compression (estimation)
            </h4>

            <div className="grid grid-cols-2 gap-3">
              {/* Quality */}
              <div className="bg-background border rounded-lg p-3 space-y-1">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Qualité
                </span>
                <p className={`text-sm font-semibold ${qualityLabels[settings.quality].color}`}>
                  {qualityLabels[settings.quality].label}
                </p>
              </div>

              {/* Resolution */}
              <div className="bg-background border rounded-lg p-3 space-y-1">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Résolution
                </span>
                <p className="text-sm font-semibold">
                  {settings.maxResolution}p
                </p>
              </div>

              {/* Estimated size */}
              <div className="bg-background border rounded-lg p-3 space-y-1">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Taille estimée
                </span>
                <p className="text-sm font-semibold text-green-600">
                  ~{formatBytes(estimatedSize)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  -{Math.round((1 - estimatedSize / file.size) * 100)}%
                </p>
              </div>

              {/* Estimated time */}
              <div className="bg-background border rounded-lg p-3 space-y-1">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Temps estimé
                </span>
                <p className="text-sm font-semibold flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {estimation.formatted}
                </p>
              </div>
            </div>
          </div>

          {/* Info */}
          <p className="text-xs text-muted-foreground bg-primary/5 rounded-lg p-2">
            💡 La compression s'exécute dans votre navigateur. Aucune donnée n'est envoyée à un serveur externe.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="sm:mr-auto"
          >
            <X className="h-4 w-4 mr-1" />
            Annuler
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
          >
            Sans compression
          </Button>
          <Button
            type="button"
            onClick={onCompress}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            Compresser
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
