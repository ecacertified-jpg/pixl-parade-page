import { useState, useEffect, memo } from 'react';
import { extractVideoThumbnails } from '@/utils/videoThumbnails';
import { cn } from '@/lib/utils';

interface VideoTimelineThumbnailsProps {
  videoUrl: string;
  duration: number;
  thumbnailCount?: number;
  height?: number;
  className?: string;
  visibleStartTime?: number;
  visibleEndTime?: number;
}

export const VideoTimelineThumbnails = memo(function VideoTimelineThumbnails({
  videoUrl,
  duration,
  thumbnailCount = 10,
  height = 48,
  className,
  visibleStartTime = 0,
  visibleEndTime,
}: VideoTimelineThumbnailsProps) {
  const effectiveVisibleEnd = visibleEndTime ?? duration;
  const visibleDuration = effectiveVisibleEnd - visibleStartTime;
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoUrl || visibleDuration <= 0) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    // Extract thumbnails for the visible range only
    extractVideoThumbnails(videoUrl, duration, thumbnailCount, 120, visibleStartTime, effectiveVisibleEnd)
      .then((result) => {
        if (!cancelled) {
          setThumbnails(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Error extracting thumbnails:', err);
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [videoUrl, duration, thumbnailCount, visibleStartTime, effectiveVisibleEnd, visibleDuration]);

  if (error) {
    // Fallback to simple gradient on error
    return (
      <div 
        className={cn("w-full bg-gradient-to-r from-muted to-muted-foreground/20 rounded-lg", className)}
        style={{ height }}
      />
    );
  }

  if (loading) {
    // Skeleton loading state
    return (
      <div 
        className={cn("w-full flex gap-0.5 rounded-lg overflow-hidden", className)}
        style={{ height }}
      >
        {Array.from({ length: thumbnailCount }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-muted animate-pulse"
            style={{ 
              animationDelay: `${i * 50}ms`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div 
      className={cn("w-full flex rounded-lg overflow-hidden", className)}
      style={{ height }}
    >
      {thumbnails.map((thumbnail, i) => (
        <div
          key={i}
          className="flex-1 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${thumbnail})`,
          }}
        />
      ))}
    </div>
  );
});
