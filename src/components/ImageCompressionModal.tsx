import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Minimize2, ArrowRight, Loader2 } from "lucide-react";
import { ComparisonSlider } from "./ComparisonSlider";
import { 
  compressImage, 
  formatFileSize, 
  getFileSize,
  QUALITY_PRESETS,
  type CompressionResult 
} from "@/utils/compressImage";
import { cn } from "@/lib/utils";

interface ImageItem {
  id: string;
  file?: File;
  url: string;
  isExisting?: boolean;
}

interface ImageCompressionModalProps {
  image: ImageItem | null;
  isOpen: boolean;
  onClose: () => void;
  onCompressionComplete: (compressedUrl: string, compressedFile: File) => void;
}

export function ImageCompressionModal({ 
  image, 
  isOpen, 
  onClose, 
  onCompressionComplete 
}: ImageCompressionModalProps) {
  const [quality, setQuality] = useState(0.75);
  const [selectedPreset, setSelectedPreset] = useState<string>('medium');
  const [originalSize, setOriginalSize] = useState(0);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);

  // Load original size when image changes
  useEffect(() => {
    if (!image || !isOpen) return;
    
    const loadSize = async () => {
      const size = image.file ? image.file.size : await getFileSize(image.url);
      setOriginalSize(size);
    };
    
    loadSize();
  }, [image, isOpen]);

  // Generate preview when quality changes
  useEffect(() => {
    if (!image || !isOpen) return;
    
    const generatePreview = async () => {
      setIsProcessing(true);
      try {
        const preset = QUALITY_PRESETS[selectedPreset];
        const result = await compressImage(image.file || image.url, {
          quality,
          maxWidth: preset?.maxWidth,
          format: 'jpeg'
        });
        
        // Revoke previous preview URL
        if (compressionResult?.url) {
          URL.revokeObjectURL(compressionResult.url);
        }
        
        setCompressionResult(result);
      } catch (error) {
        console.error('Compression preview failed:', error);
      } finally {
        setIsProcessing(false);
      }
    };
    
    const debounce = setTimeout(generatePreview, 300);
    return () => clearTimeout(debounce);
  }, [image, quality, selectedPreset, isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuality(0.75);
      setSelectedPreset('medium');
      setSliderPosition(50);
      setCompressionResult(null);
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (compressionResult?.url) {
        URL.revokeObjectURL(compressionResult.url);
      }
    };
  }, [compressionResult]);

  const handlePresetSelect = useCallback((presetKey: string) => {
    const preset = QUALITY_PRESETS[presetKey];
    if (preset) {
      setSelectedPreset(presetKey);
      setQuality(preset.quality);
    }
  }, []);

  const handleQualityChange = useCallback((value: number[]) => {
    setQuality(value[0] / 100);
    setSelectedPreset('custom');
  }, []);

  const handleApply = useCallback(() => {
    if (!compressionResult) return;
    onCompressionComplete(compressionResult.url, compressionResult.file);
    onClose();
  }, [compressionResult, onCompressionComplete, onClose]);

  const compressionPercentage = compressionResult 
    ? Math.round((1 - compressionResult.compressionRatio) * 100)
    : 0;

  const isGoodCompression = compressionPercentage >= 20;

  if (!image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Minimize2 className="h-5 w-5" />
            Optimiser l'image
          </DialogTitle>
          <DialogDescription>
            Réduisez la taille du fichier avant l'upload
          </DialogDescription>
        </DialogHeader>

        {/* Comparison area */}
        <div className="relative h-[250px] sm:h-[300px] bg-muted rounded-lg overflow-hidden">
          <ComparisonSlider
            originalSrc={image.url}
            compressedSrc={compressionResult?.url || null}
            position={sliderPosition}
            onPositionChange={setSliderPosition}
          />
          
          {isProcessing && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Size indicators */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Original</p>
            <p className="text-base sm:text-lg font-semibold">{formatFileSize(originalSize)}</p>
          </div>
          <div className="flex items-center justify-center">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Compressé</p>
            <p className={cn(
              "text-base sm:text-lg font-semibold",
              isGoodCompression ? "text-green-600" : "text-amber-600"
            )}>
              {compressionResult ? formatFileSize(compressionResult.compressedSize) : '—'}
            </p>
            {compressionResult && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs mt-1",
                  isGoodCompression 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                )}
              >
                -{compressionPercentage}%
              </Badge>
            )}
          </div>
        </div>

        {/* Quality presets */}
        <div className="space-y-3">
          <Label>Niveau de qualité</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(QUALITY_PRESETS).map(([key, preset]) => (
              <Button
                key={key}
                variant={selectedPreset === key ? "default" : "outline"}
                className={cn(
                  "flex flex-col h-auto py-2.5 px-2",
                  selectedPreset === key && "ring-2 ring-primary ring-offset-2"
                )}
                onClick={() => handlePresetSelect(key)}
              >
                <span className="font-medium text-sm">{preset.label}</span>
                <span className="text-[10px] opacity-70 font-normal">{preset.description}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom quality slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Qualité personnalisée</Label>
            <Badge variant="outline" className="font-mono">
              {Math.round(quality * 100)}%
            </Badge>
          </div>
          <Slider
            value={[quality * 100]}
            min={10}
            max={100}
            step={5}
            onValueChange={handleQualityChange}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Fichier léger</span>
            <span>Haute qualité</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={isProcessing || !compressionResult}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <Minimize2 className="h-4 w-4 mr-2" />
                Appliquer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
