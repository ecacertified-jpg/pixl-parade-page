import { useState } from "react";
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
}

function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  
  return (
    <div className="absolute bottom-3 right-3 flex gap-2 z-10">
      <Button 
        size="icon" 
        variant="secondary" 
        className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
        onClick={() => zoomIn()}
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button 
        size="icon" 
        variant="secondary" 
        className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
        onClick={() => zoomOut()}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button 
        size="icon" 
        variant="secondary" 
        className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
        onClick={() => resetTransform()}
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function ZoomableImage({ src, alt, className }: ZoomableImageProps) {
  const isMobile = useIsMobile();
  const [hasZoomed, setHasZoomed] = useState(false);

  return (
    <TransformWrapper
      initialScale={1}
      minScale={1}
      maxScale={4}
      doubleClick={{ mode: "toggle", step: 2 }}
      pinch={{ step: 5 }}
      wheel={{ step: 0.2 }}
      onZoom={() => setHasZoomed(true)}
      onPinching={() => setHasZoomed(true)}
    >
      <div className="relative overflow-hidden">
        {/* Desktop zoom controls */}
        {!isMobile && <ZoomControls />}
        
        {/* Mobile pinch indicator */}
        {isMobile && !hasZoomed && (
          <div 
            className={cn(
              "absolute bottom-3 left-1/2 -translate-x-1/2 z-10",
              "bg-black/60 text-white text-xs px-3 py-1.5 rounded-full",
              "pointer-events-none flex items-center gap-2",
              "animate-pulse"
            )}
          >
            <span>👆👆</span>
            <span>Pincez pour zoomer</span>
          </div>
        )}
        
        <TransformComponent
          wrapperStyle={{ width: "100%" }}
          contentStyle={{ width: "100%" }}
        >
          <img
            src={src}
            alt={alt}
            className={cn(className, "select-none")}
            draggable={false}
          />
        </TransformComponent>
      </div>
    </TransformWrapper>
  );
}
