import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ZoomIn, ZoomOut, Check, RotateCw, RotateCcw, RefreshCw } from "lucide-react";
import { getCroppedImage, Area } from "@/utils/cropImage";
import { cn } from "@/lib/utils";

const ROTATION_PRESETS = [
  { label: "0°", value: 0 },
  { label: "90°", value: 90 },
  { label: "180°", value: 180 },
  { label: "270°", value: 270 },
];

interface AspectRatioOption {
  label: string;
  value: number | undefined;
}

const DEFAULT_ASPECT_RATIOS: AspectRatioOption[] = [
  { label: "Libre", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:4", value: 3 / 4 },
];

interface ImageCropModalProps {
  imageSrc: string;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedImageUrl: string, croppedFile: File) => void;
  aspectRatios?: AspectRatioOption[];
}

export function ImageCropModal({
  imageSrc,
  isOpen,
  onClose,
  onCropComplete,
  aspectRatios = DEFAULT_ASPECT_RATIOS,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset state when modal opens with new image
  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setAspect(1);
      setPreview(null);
    }
  }, [isOpen, imageSrc]);

  // Update preview when crop or rotation changes (debounced)
  useEffect(() => {
    if (!croppedAreaPixels || !imageSrc) return;

    const timeoutId = setTimeout(async () => {
      try {
        const { url } = await getCroppedImage(imageSrc, croppedAreaPixels, { width: 120, height: 120 }, rotation);
        setPreview(url);
      } catch (error) {
        console.error('Preview generation failed:', error);
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [croppedAreaPixels, imageSrc, rotation]);

  const onCropAreaChange = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleResetRotation = () => {
    setRotation(0);
  };

  const handleApply = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const { url, file } = await getCroppedImage(imageSrc, croppedAreaPixels, undefined, rotation);
      onCropComplete(url, file);
      onClose();
    } catch (error) {
      console.error('Crop failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-poppins">Recadrer l'image</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_140px] gap-4">
          {/* Crop zone */}
          <div className="relative h-[280px] md:h-[320px] bg-black rounded-lg overflow-hidden">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropAreaChange}
                showGrid
                style={{
                  containerStyle: { borderRadius: '0.5rem' },
                }}
              />
            )}
          </div>

          {/* Live preview */}
          <div className="hidden md:flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">Aperçu</p>
            <div className="w-full aspect-square bg-muted rounded-lg overflow-hidden border">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  Sélectionnez une zone
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4 mt-2">
          {/* Zoom slider */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Zoom</Label>
            <div className="flex items-center gap-3">
              <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.05}
                onValueChange={(v) => setZoom(v[0])}
                className="flex-1"
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </div>

          {/* Rotation controls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Rotation</Label>
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {rotation}°
              </span>
            </div>
            
            {/* Rotation presets */}
            <div className="flex gap-2">
              {ROTATION_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  type="button"
                  variant={rotation === preset.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRotation(preset.value)}
                  className="flex-1 text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Free rotation slider */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleRotateLeft}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Slider
                value={[rotation]}
                min={-180}
                max={180}
                step={1}
                onValueChange={(v) => setRotation(v[0] < 0 ? v[0] + 360 : v[0])}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleRotateRight}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleResetRotation}
                disabled={rotation === 0}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Aspect ratio selector */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Ratio</Label>
            <div className="flex gap-2 flex-wrap">
              {aspectRatios.map((ratio) => (
                <Button
                  key={ratio.label}
                  type="button"
                  variant={aspect === ratio.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAspect(ratio.value)}
                  className={cn(
                    "text-xs",
                    aspect === ratio.value && "bg-primary text-primary-foreground"
                  )}
                >
                  {ratio.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            type="button" 
            onClick={handleApply} 
            disabled={isProcessing || !croppedAreaPixels}
          >
            <Check className="h-4 w-4 mr-2" />
            {isProcessing ? "Traitement..." : "Appliquer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
