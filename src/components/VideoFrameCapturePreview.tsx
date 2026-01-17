import { useState, useEffect } from 'react';
import { Check, RotateCcw, X, Loader2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { formatTimeDisplay } from '@/utils/videoTrimmer';

interface VideoFrameCapturePreviewProps {
  imageBlob: Blob | null;
  timestamp: number;
  open: boolean;
  onConfirm: () => void;
  onRetry: () => void;
  onCancel: () => void;
  isUploading: boolean;
}

export function VideoFrameCapturePreview({
  imageBlob,
  timestamp,
  open,
  onConfirm,
  onRetry,
  onCancel,
  isUploading,
}: VideoFrameCapturePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Create preview URL from blob
  useEffect(() => {
    if (imageBlob) {
      const url = URL.createObjectURL(imageBlob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [imageBlob]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isUploading && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Aperçu de la capture
          </DialogTitle>
          <DialogDescription>
            Image extraite à {formatTimeDisplay(timestamp)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image preview */}
          {previewUrl && (
            <div className="relative rounded-lg overflow-hidden border bg-muted aspect-video">
              <img
                src={previewUrl}
                alt="Capture de la vidéo"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Timestamp info */}
          <div className="text-center text-sm text-muted-foreground">
            Cette image sera utilisée comme miniature du produit
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            disabled={isUploading}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reprendre
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isUploading}
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Upload...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Utiliser comme miniature
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
