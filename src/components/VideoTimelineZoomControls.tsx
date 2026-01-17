import { memo } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface VideoTimelineZoomControlsProps {
  zoomLevel: number;
  maxZoom: number;
  visibleStart: number;
  visibleEnd: number;
  duration: number;
  startTime: number;
  endTime: number;
  onZoomChange: (level: number) => void;
  onVisibleStartChange: (start: number) => void;
}

export const VideoTimelineZoomControls = memo(function VideoTimelineZoomControls({
  zoomLevel,
  maxZoom,
  visibleStart,
  visibleEnd,
  duration,
  startTime,
  endTime,
  onZoomChange,
  onVisibleStartChange,
}: VideoTimelineZoomControlsProps) {
  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel * 1.5, maxZoom);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel / 1.5, 1);
    onZoomChange(newZoom);
  };

  const handleResetZoom = () => {
    onZoomChange(1);
    onVisibleStartChange(0);
  };

  const handleSliderChange = (value: number[]) => {
    onZoomChange(value[0]);
  };

  // Mini-map calculations
  const visiblePercent = ((visibleEnd - visibleStart) / duration) * 100;
  const visibleStartPercent = (visibleStart / duration) * 100;
  const selectionStartPercent = (startTime / duration) * 100;
  const selectionWidthPercent = ((endTime - startTime) / duration) * 100;

  // Handle minimap click for navigation
  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPercent = (e.clientX - rect.left) / rect.width;
    const clickTime = clickPercent * duration;
    
    // Center the visible area on the click position
    const visibleDuration = duration / zoomLevel;
    let newStart = clickTime - visibleDuration / 2;
    newStart = Math.max(0, Math.min(newStart, duration - visibleDuration));
    onVisibleStartChange(newStart);
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      {/* Zoom controls */}
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground text-xs">Zoom:</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleZoomOut}
          disabled={zoomLevel <= 1}
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        
        <div className="w-20">
          <Slider
            value={[zoomLevel]}
            min={1}
            max={maxZoom}
            step={0.5}
            onValueChange={handleSliderChange}
            className="h-1"
          />
        </div>
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleZoomIn}
          disabled={zoomLevel >= maxZoom}
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        
        <span className="text-xs font-medium min-w-[2rem] text-center">
          {zoomLevel.toFixed(1)}x
        </span>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 text-xs px-2"
          onClick={handleResetZoom}
          disabled={zoomLevel === 1}
        >
          <Maximize2 className="h-3 w-3 mr-1" />
          Tout
        </Button>
      </div>

      {/* Mini-map (only show when zoomed) */}
      {zoomLevel > 1 && (
        <div 
          className="flex-1 h-4 bg-muted rounded-sm relative cursor-pointer overflow-hidden"
          onClick={handleMinimapClick}
          title="Cliquez pour naviguer"
        >
          {/* Selection indicator */}
          <div
            className="absolute top-0 bottom-0 bg-primary/30 pointer-events-none"
            style={{
              left: `${selectionStartPercent}%`,
              width: `${selectionWidthPercent}%`,
            }}
          />
          
          {/* Visible area indicator */}
          <div
            className={cn(
              "absolute top-0 bottom-0 border-2 border-primary rounded-sm pointer-events-none",
              "bg-primary/10"
            )}
            style={{
              left: `${visibleStartPercent}%`,
              width: `${visiblePercent}%`,
            }}
          />
        </div>
      )}
    </div>
  );
});
