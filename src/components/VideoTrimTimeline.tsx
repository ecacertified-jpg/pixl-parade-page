import { useRef, useCallback, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { formatTimeDisplay } from '@/utils/videoTrimmer';

interface VideoTrimTimelineProps {
  duration: number;
  startTime: number;
  endTime: number;
  currentTime: number;
  maxDuration: number;
  onStartChange: (time: number) => void;
  onEndChange: (time: number) => void;
  onSeek: (time: number) => void;
}

export function VideoTrimTimeline({
  duration,
  startTime,
  endTime,
  currentTime,
  maxDuration,
  onStartChange,
  onEndChange,
  onSeek,
}: VideoTrimTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'selection' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartValue, setDragStartValue] = useState({ start: 0, end: 0 });

  const getTimeFromPosition = useCallback((clientX: number): number => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    return percent * duration;
  }, [duration]);

  const getPositionPercent = useCallback((time: number): number => {
    return (time / duration) * 100;
  }, [duration]);

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
    const deltaTime = deltaPercent * duration;

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
  }, [isDragging, dragStartX, dragStartValue, duration, startTime, endTime, maxDuration, onStartChange, onEndChange]);

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

  const selectedDuration = endTime - startTime;
  const isOverLimit = selectedDuration > maxDuration;

  return (
    <div className="space-y-2">
      {/* Timeline */}
      <div
        ref={containerRef}
        className="relative h-12 bg-muted rounded-lg cursor-pointer select-none"
        onClick={handleTimelineClick}
      >
        {/* Background progress bar */}
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          {/* Unselected regions */}
          <div 
            className="absolute top-0 bottom-0 left-0 bg-muted-foreground/20"
            style={{ width: `${getPositionPercent(startTime)}%` }}
          />
          <div 
            className="absolute top-0 bottom-0 right-0 bg-muted-foreground/20"
            style={{ width: `${100 - getPositionPercent(endTime)}%` }}
          />
          
          {/* Selected region */}
          <div
            className={cn(
              "absolute top-0 bottom-0 cursor-move transition-colors",
              isOverLimit ? "bg-destructive/30" : "bg-primary/30"
            )}
            style={{
              left: `${getPositionPercent(startTime)}%`,
              width: `${getPositionPercent(endTime - startTime)}%`,
            }}
            onMouseDown={(e) => handleMouseDown(e, 'selection')}
          />
        </div>

        {/* Current time indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-20 pointer-events-none"
          style={{ left: `${getPositionPercent(currentTime)}%` }}
        />

        {/* Start handle */}
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

        {/* End handle */}
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
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0:00</span>
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
        <span>{formatTimeDisplay(duration)}</span>
      </div>
    </div>
  );
}
