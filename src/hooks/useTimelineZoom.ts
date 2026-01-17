import { useState, useCallback, useMemo } from 'react';

interface UseTimelineZoomOptions {
  duration: number;
  maxZoom?: number;
  initialZoom?: number;
}

interface UseTimelineZoomReturn {
  zoomLevel: number;
  visibleStartTime: number;
  visibleEndTime: number;
  visibleDuration: number;
  setZoomLevel: (level: number) => void;
  setVisibleStartTime: (time: number) => void;
  zoomIn: (centerTime?: number) => void;
  zoomOut: (centerTime?: number) => void;
  resetZoom: () => void;
  zoomToFit: (startTime: number, endTime: number) => void;
  handleWheel: (e: React.WheelEvent, cursorTime: number) => void;
  panBy: (deltaTime: number) => void;
}

export function useTimelineZoom({
  duration,
  maxZoom = 8,
  initialZoom = 1,
}: UseTimelineZoomOptions): UseTimelineZoomReturn {
  const [zoomLevel, setZoomLevelState] = useState(initialZoom);
  const [visibleStartTime, setVisibleStartTimeState] = useState(0);

  const visibleDuration = useMemo(() => {
    return duration / zoomLevel;
  }, [duration, zoomLevel]);

  const visibleEndTime = useMemo(() => {
    return Math.min(visibleStartTime + visibleDuration, duration);
  }, [visibleStartTime, visibleDuration, duration]);

  const clampVisibleStart = useCallback((start: number, currentZoom: number) => {
    const currentVisibleDuration = duration / currentZoom;
    return Math.max(0, Math.min(start, duration - currentVisibleDuration));
  }, [duration]);

  const setZoomLevel = useCallback((level: number) => {
    const clampedLevel = Math.max(1, Math.min(level, maxZoom));
    const newVisibleDuration = duration / clampedLevel;
    
    // Keep zoom centered on current visible area
    const currentCenter = visibleStartTime + visibleDuration / 2;
    let newStart = currentCenter - newVisibleDuration / 2;
    newStart = clampVisibleStart(newStart, clampedLevel);
    
    setZoomLevelState(clampedLevel);
    setVisibleStartTimeState(newStart);
  }, [duration, maxZoom, visibleStartTime, visibleDuration, clampVisibleStart]);

  const setVisibleStartTime = useCallback((time: number) => {
    setVisibleStartTimeState(clampVisibleStart(time, zoomLevel));
  }, [clampVisibleStart, zoomLevel]);

  const zoomIn = useCallback((centerTime?: number) => {
    const newZoom = Math.min(zoomLevel * 1.5, maxZoom);
    const newVisibleDuration = duration / newZoom;
    const center = centerTime ?? (visibleStartTime + visibleDuration / 2);
    
    let newStart = center - newVisibleDuration / 2;
    newStart = clampVisibleStart(newStart, newZoom);
    
    setZoomLevelState(newZoom);
    setVisibleStartTimeState(newStart);
  }, [zoomLevel, maxZoom, duration, visibleStartTime, visibleDuration, clampVisibleStart]);

  const zoomOut = useCallback((centerTime?: number) => {
    const newZoom = Math.max(zoomLevel / 1.5, 1);
    const newVisibleDuration = duration / newZoom;
    const center = centerTime ?? (visibleStartTime + visibleDuration / 2);
    
    let newStart = center - newVisibleDuration / 2;
    newStart = clampVisibleStart(newStart, newZoom);
    
    setZoomLevelState(newZoom);
    setVisibleStartTimeState(newStart);
  }, [zoomLevel, duration, visibleStartTime, visibleDuration, clampVisibleStart]);

  const resetZoom = useCallback(() => {
    setZoomLevelState(1);
    setVisibleStartTimeState(0);
  }, []);

  const zoomToFit = useCallback((startTime: number, endTime: number) => {
    const selectionDuration = endTime - startTime;
    // Add some padding (10%)
    const paddedDuration = selectionDuration * 1.2;
    const newZoom = Math.min(Math.max(duration / paddedDuration, 1), maxZoom);
    const newVisibleDuration = duration / newZoom;
    
    // Center on selection
    const selectionCenter = (startTime + endTime) / 2;
    let newStart = selectionCenter - newVisibleDuration / 2;
    newStart = clampVisibleStart(newStart, newZoom);
    
    setZoomLevelState(newZoom);
    setVisibleStartTimeState(newStart);
  }, [duration, maxZoom, clampVisibleStart]);

  const handleWheel = useCallback((e: React.WheelEvent, cursorTime: number) => {
    // Ctrl + wheel for zoom
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn(cursorTime);
      } else {
        zoomOut(cursorTime);
      }
    } else if (zoomLevel > 1) {
      // Horizontal pan when zoomed
      const panAmount = (e.deltaX || e.deltaY) * 0.01 * visibleDuration;
      setVisibleStartTime(visibleStartTime + panAmount);
    }
  }, [zoomLevel, visibleDuration, visibleStartTime, zoomIn, zoomOut, setVisibleStartTime]);

  const panBy = useCallback((deltaTime: number) => {
    setVisibleStartTime(visibleStartTime + deltaTime);
  }, [visibleStartTime, setVisibleStartTime]);

  return {
    zoomLevel,
    visibleStartTime,
    visibleEndTime,
    visibleDuration,
    setZoomLevel,
    setVisibleStartTime,
    zoomIn,
    zoomOut,
    resetZoom,
    zoomToFit,
    handleWheel,
    panBy,
  };
}
