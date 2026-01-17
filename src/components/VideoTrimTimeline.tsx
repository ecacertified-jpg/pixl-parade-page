import { useRef, useCallback, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { formatTimeDisplay } from '@/utils/videoTrimmer';
import { VideoTimelineThumbnails } from './VideoTimelineThumbnails';

interface VideoTrimTimelineProps {
  duration: number;
  startTime: number;
  endTime: number;
  currentTime: number;
  maxDuration: number;
  videoUrl?: string;
  zoomLevel?: number;
  visibleStartTime?: number;
  visibleEndTime?: number;
  onStartChange: (time: number) => void;
  onEndChange: (time: number) => void;
  onSeek: (time: number) => void;
  onWheel?: (e: React.WheelEvent, cursorTime: number) => void;
}

export function VideoTrimTimeline({
  duration,
  startTime,
  endTime,
  currentTime,
  maxDuration,
  videoUrl,
  zoomLevel = 1,
  visibleStartTime = 0,
  visibleEndTime,
  onStartChange,
  onEndChange,
  onSeek,
  onWheel,
}: VideoTrimTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'selection' | 'pan' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartValue, setDragStartValue] = useState({ start: 0, end: 0 });

  // Calculate visible range
  const effectiveVisibleEnd = visibleEndTime ?? duration;
  const visibleDuration = effectiveVisibleEnd - visibleStartTime;

  // Convert time to position percent within visible range
  const getPositionPercent = useCallback((time: number): number => {
    const relativeTime = time - visibleStartTime;
    return (relativeTime / visibleDuration) * 100;
  }, [visibleStartTime, visibleDuration]);

  // Convert position to time within visible range
  const getTimeFromPosition = useCallback((clientX: number): number => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    return visibleStartTime + percent * visibleDuration;
  }, [visibleStartTime, visibleDuration]);

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'start' | 'end' | 'selection') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(type);
    setDragStartX(e.clientX);
    setDragStartValue({ start: startTime, end: endTime });
  }, [startTime, endTime]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartX;
    const deltaPercent = deltaX / rect.width;
    const deltaTime = deltaPercent * visibleDuration;

    if (isDragging === 'start') {
      let newStart = dragStartValue.start + deltaTime;
      newStart = Math.max(0, Math.min(newStart, endTime - 1));
      // Enforce max duration
      if (endTime - newStart > maxDuration) {
        newStart = endTime - maxDuration;
      }
      onStartChange(newStart);
    } else if (isDragging === 'end') {
      let newEnd = dragStartValue.end + deltaTime;
      newEnd = Math.max(startTime + 1, Math.min(newEnd, duration));
      // Enforce max duration
      if (newEnd - startTime > maxDuration) {
        newEnd = startTime + maxDuration;
      }
      onEndChange(newEnd);
    } else if (isDragging === 'selection') {
      const selectionDuration = dragStartValue.end - dragStartValue.start;
      let newStart = dragStartValue.start + deltaTime;
      let newEnd = dragStartValue.end + deltaTime;
      
      // Clamp to valid range
      if (newStart < 0) {
        newStart = 0;
        newEnd = selectionDuration;
      }
      if (newEnd > duration) {
        newEnd = duration;
        newStart = duration - selectionDuration;
      }
      
      onStartChange(newStart);
      onEndChange(newEnd);
    }
  }, [isDragging, dragStartX, dragStartValue, duration, visibleDuration, startTime, endTime, maxDuration, onStartChange, onEndChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    // Only handle clicks on the timeline itself, not on handles
    if (isDragging) return;
    const time = getTimeFromPosition(e.clientX);
    onSeek(time);
  }, [isDragging, getTimeFromPosition, onSeek]);

  const handleWheelEvent = useCallback((e: React.WheelEvent) => {
    if (onWheel) {
      const cursorTime = getTimeFromPosition(e.clientX);
      onWheel(e, cursorTime);
    }
  }, [onWheel, getTimeFromPosition]);

  // Check if elements are visible in current zoom
  const isStartVisible = startTime >= visibleStartTime && startTime <= effectiveVisibleEnd;
  const isEndVisible = endTime >= visibleStartTime && endTime <= effectiveVisibleEnd;
  const isSelectionPartiallyVisible = 
    (startTime < effectiveVisibleEnd && endTime > visibleStartTime);
  const isCurrentTimeVisible = currentTime >= visibleStartTime && currentTime <= effectiveVisibleEnd;

  const selectedDuration = endTime - startTime;
  const isOverLimit = selectedDuration > maxDuration;

  // Calculate clamped positions for selection overlay
  const selectionLeftPercent = Math.max(0, getPositionPercent(startTime));
  const selectionRightPercent = Math.min(100, getPositionPercent(endTime));
  const selectionWidth = selectionRightPercent - selectionLeftPercent;

  return (
    <div className="space-y-2">
      {/* Timeline */}
      <div
        ref={containerRef}
        className="relative h-12 bg-muted rounded-lg cursor-pointer select-none overflow-hidden"
        onClick={handleTimelineClick}
        onWheel={handleWheelEvent}
      >
        {/* Video thumbnails background */}
        {videoUrl && (
          <VideoTimelineThumbnails
            videoUrl={videoUrl}
            duration={duration}
            thumbnailCount={Math.round(12 * zoomLevel)}
            height={48}
            className="absolute inset-0"
            visibleStartTime={visibleStartTime}
            visibleEndTime={effectiveVisibleEnd}
          />
        )}
        
        {/* Overlay for non-selected regions (darkens thumbnails) */}
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          {/* Left unselected region overlay */}
          {selectionLeftPercent > 0 && (
            <div 
              className="absolute top-0 bottom-0 left-0 bg-background/70 backdrop-blur-[1px]"
              style={{ width: `${selectionLeftPercent}%` }}
            />
          )}
          {/* Right unselected region overlay */}
          {selectionRightPercent < 100 && (
            <div 
              className="absolute top-0 bottom-0 right-0 bg-background/70 backdrop-blur-[1px]"
              style={{ width: `${100 - selectionRightPercent}%` }}
            />
          )}
        </div>
        
        {/* Selected region border */}
        {isSelectionPartiallyVisible && (
          <div
            className={cn(
              "absolute top-0 bottom-0 cursor-move border-y-2 transition-colors",
              isOverLimit ? "border-destructive bg-destructive/10" : "border-primary bg-primary/10"
            )}
            style={{
              left: `${selectionLeftPercent}%`,
              width: `${selectionWidth}%`,
            }}
            onMouseDown={(e) => handleMouseDown(e, 'selection')}
          />
        )}

        {/* Current time indicator */}
        {isCurrentTimeVisible && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-20 pointer-events-none"
            style={{ left: `${getPositionPercent(currentTime)}%` }}
          />
        )}

        {/* Start handle */}
        {isStartVisible && (
          <div
            className={cn(
              "absolute top-0 bottom-0 w-3 cursor-ew-resize z-30 flex items-center justify-center",
              "group"
            )}
            style={{ left: `calc(${getPositionPercent(startTime)}% - 6px)` }}
            onMouseDown={(e) => handleMouseDown(e, 'start')}
          >
            <div className={cn(
              "w-1.5 h-8 rounded-full transition-colors",
              isOverLimit ? "bg-destructive" : "bg-primary",
              "group-hover:scale-110"
            )} />
          </div>
        )}

        {/* End handle */}
        {isEndVisible && (
          <div
            className={cn(
              "absolute top-0 bottom-0 w-3 cursor-ew-resize z-30 flex items-center justify-center",
              "group"
            )}
            style={{ left: `calc(${getPositionPercent(endTime)}% - 6px)` }}
            onMouseDown={(e) => handleMouseDown(e, 'end')}
          >
            <div className={cn(
              "w-1.5 h-8 rounded-full transition-colors",
              isOverLimit ? "bg-destructive" : "bg-primary",
              "group-hover:scale-110"
            )} />
          </div>
        )}

        {/* Zoom level indicator */}
        {zoomLevel > 1 && (
          <div className="absolute top-1 right-1 bg-background/80 text-[10px] px-1.5 py-0.5 rounded text-muted-foreground pointer-events-none">
            {zoomLevel.toFixed(1)}x
          </div>
        )}
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatTimeDisplay(visibleStartTime)}</span>
        <span className="flex items-center gap-2">
          <span className={cn(
            "font-medium",
            isOverLimit ? "text-destructive" : "text-primary"
          )}>
            {formatTimeDisplay(startTime)} - {formatTimeDisplay(endTime)}
          </span>
          <span className={cn(
            "px-1.5 py-0.5 rounded text-[10px]",
            isOverLimit ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
          )}>
            {formatTimeDisplay(selectedDuration)}
          </span>
        </span>
        <span>{formatTimeDisplay(effectiveVisibleEnd)}</span>
      </div>
    </div>
  );
}
