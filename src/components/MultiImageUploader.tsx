import { useState, useRef, useCallback } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, X, GripVertical, Image as ImageIcon, Crop } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageCropModal } from "./ImageCropModal";

export interface ImageItem {
  id: string;
  file?: File;
  url: string;
  isExisting?: boolean;
}

interface MultiImageUploaderProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function MultiImageUploader({ 
  images, 
  onChange, 
  maxImages = 5,
  disabled = false
}: MultiImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [cropModalImage, setCropModalImage] = useState<ImageItem | null>(null);

  const handleFilesSelected = useCallback((files: FileList | null) => {
    if (!files || disabled) return;
    
    const remainingSlots = maxImages - images.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    
    const newImages: ImageItem[] = filesToAdd.map(file => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
      isExisting: false
    }));
    
    onChange([...images, ...newImages]);
  }, [images, maxImages, onChange, disabled]);

  const handleRemove = useCallback((id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove && !imageToRemove.isExisting && imageToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    onChange(images.filter(img => img.id !== id));
  }, [images, onChange]);

  const handleCropComplete = useCallback((croppedUrl: string, croppedFile: File) => {
    if (!cropModalImage) return;
    
    // Revoke old blob URL if needed
    if (cropModalImage.url.startsWith('blob:')) {
      URL.revokeObjectURL(cropModalImage.url);
    }
    
    // Update image with cropped version
    onChange(images.map(img => 
      img.id === cropModalImage.id 
        ? { ...img, url: croppedUrl, file: croppedFile, isExisting: false }
        : img
    ));
    
    setCropModalImage(null);
  }, [cropModalImage, images, onChange]);

  const handleOpenCrop = useCallback((image: ImageItem) => {
    setCropModalImage(image);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesSelected(e.target.files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {canAddMore && (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDraggingOver 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">
            Glissez vos images ici ou cliquez pour sélectionner
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {images.length}/{maxImages} images • JPG, PNG, WebP
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />
        </div>
      )}

      {/* Reorderable images list */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Glissez pour réorganiser • La première image sera l'image principale
          </p>
          <Reorder.Group 
            axis="x" 
            values={images} 
            onReorder={onChange}
            className="flex flex-wrap gap-2"
          >
            {images.map((image, index) => (
              <SortableImageItem
                key={image.id}
                image={image}
                index={index}
                onRemove={() => handleRemove(image.id)}
                onCrop={() => handleOpenCrop(image)}
                disabled={disabled}
              />
            ))}
          </Reorder.Group>
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && !canAddMore && (
        <div className="flex items-center justify-center h-24 bg-muted/30 rounded-lg">
          <div className="text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-50" />
            <p className="text-sm">Aucune image</p>
          </div>
        </div>
      )}

      {/* Crop Modal */}
      <ImageCropModal
        imageSrc={cropModalImage?.url || ''}
        isOpen={!!cropModalImage}
        onClose={() => setCropModalImage(null)}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}

interface SortableImageItemProps {
  image: ImageItem;
  index: number;
  onRemove: () => void;
  onCrop: () => void;
  disabled: boolean;
}

function SortableImageItem({ image, index, onRemove, onCrop, disabled }: SortableImageItemProps) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={image}
      dragListener={false}
      dragControls={controls}
      className="relative"
      whileDrag={{ scale: 1.05, zIndex: 50 }}
    >
      <div 
        className={cn(
          "relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors group",
          index === 0 ? "border-primary" : "border-transparent"
        )}
      >
        <img 
          src={image.url} 
          alt={`Image ${index + 1}`}
          className="w-full h-full object-cover"
        />
        
        {/* Drag handle overlay */}
        <div 
          onPointerDown={(e) => !disabled && controls.start(e)}
          className={cn(
            "absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center",
            !disabled && "cursor-grab active:cursor-grabbing"
          )}
        >
          <GripVertical className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        
        {/* Primary badge */}
        {index === 0 && (
          <Badge 
            className="absolute top-1 left-1 text-[9px] px-1 py-0 bg-primary text-primary-foreground"
          >
            Principale
          </Badge>
        )}
        
        {/* Remove button */}
        {!disabled && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}

        {/* Crop button */}
        {!disabled && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute bottom-1 left-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              onCrop();
            }}
          >
            <Crop className="h-3 w-3" />
          </Button>
        )}
        
        {/* Position indicator */}
        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded">
          {index + 1}
        </div>
      </div>
    </Reorder.Item>
  );
}
