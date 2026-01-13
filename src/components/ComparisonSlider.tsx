import { useRef, useCallback, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonSliderProps {
  originalSrc: string;
  compressedSrc: string | null;
  position?: number;
  onPositionChange?: (position: number) => void;
  className?: string;
}

export function ComparisonSlider({ 
  originalSrc, 
  compressedSrc, 
  position: controlledPosition,
  onPositionChange,
  className 
}: ComparisonSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalPosition, setInternalPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  
  const position = controlledPosition ?? internalPosition;
  const setPosition = onPositionChange ?? setInternalPosition;

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, x)));
  }, [setPosition]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    updatePosition(e.touches[0].clientX);
  }, [updatePosition]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updatePosition(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      updatePosition(e.touches[0].clientX);
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, updatePosition]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full h-full select-none overflow-hidden bg-muted",
        isDragging ? "cursor-ew-resize" : "cursor-ew-resize",
        className
      )}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Original image (background) */}
      <img 
        src={originalSrc} 
        alt="Original"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
        draggable={false}
      />
      
      {/* Compressed image (clipped overlay) */}
      {compressedSrc && (
        <div 
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <img 
            src={compressedSrc} 
            alt="Compressed"
            className="absolute inset-0 w-full h-full object-contain" 
            draggable={false}
          />
        </div>
      )}
      
      {/* Divider line */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)] pointer-events-none"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 shadow-lg">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      
      {/* Labels */}
      <Badge 
        variant="secondary" 
        className="absolute top-2 left-2 bg-black/60 text-white border-0 text-[10px]"
      >
        Original
      </Badge>
      {compressedSrc && (
        <Badge 
          variant="secondary" 
          className="absolute top-2 right-2 bg-black/60 text-white border-0 text-[10px]"
        >
          Compressé
        </Badge>
      )}
    </div>
  );
}
