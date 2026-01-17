import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Scissors, X, AlertTriangle, Volume2, VolumeX, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { VideoTrimTimeline } from '@/components/VideoTrimTimeline';
import { VideoTrimProgress } from '@/components/VideoTrimProgress';
import { VideoTimelineZoomControls } from '@/components/VideoTimelineZoomControls';
import { VideoFrameCapture } from '@/components/VideoFrameCapture';
import { useTimelineZoom } from '@/hooks/useTimelineZoom';
import { trimVideo, TrimProgress, formatTimeDisplay } from '@/utils/videoTrimmer';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VideoTrimEditorProps {
  file: File;
  maxDurationSeconds: number;
  videoDuration: number;
  onTrimComplete: (trimmedFile: File) => void;
  onCancel: () => void;
  onFrameCapture?: (blob: Blob, timestamp: number) => void;
  open: boolean;
}

export function VideoTrimEditor({
  file,
  maxDurationSeconds,
  videoDuration,
  onTrimComplete,
  onCancel,
  onFrameCapture,
  open,
}: VideoTrimEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(Math.min(videoDuration, maxDurationSeconds));
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimProgress, setTrimProgress] = useState<TrimProgress | null>(null);

  // Zoom state
  const {
    zoomLevel,
    visibleStartTime,
    visibleEndTime,
    setZoomLevel,
    setVisibleStartTime,
    handleWheel,
    resetZoom,
  } = useTimelineZoom({
    duration: videoDuration,
    maxZoom: 8,
  });

  // Create object URL for video preview
  useEffect(() => {
    if (file && open) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file, open]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setStartTime(0);
      setEndTime(Math.min(videoDuration, maxDurationSeconds));
      setCurrentTime(0);
      setIsPlaying(false);
      setIsTrimming(false);
      setTrimProgress(null);
      resetZoom();
    }
  }, [open, videoDuration, maxDurationSeconds, resetZoom]);

  // Update current time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Loop within selection
      if (video.currentTime >= endTime) {
        video.currentTime = startTime;
        video.pause();
        setIsPlaying(false);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [startTime, endTime]);

  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      // Start from selection start if outside selection
      if (video.currentTime < startTime || video.currentTime >= endTime) {
        video.currentTime = startTime;
      }
      video.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, startTime, endTime]);

  const handleSeek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
  }, []);

  const handleReset = useCallback(() => {
    setStartTime(0);
    setEndTime(Math.min(videoDuration, maxDurationSeconds));
    handleSeek(0);
  }, [videoDuration, maxDurationSeconds, handleSeek]);

  const handleStartChange = useCallback((time: number) => {
    setStartTime(time);
    if (currentTime < time) {
      handleSeek(time);
    }
  }, [currentTime, handleSeek]);

  const handleEndChange = useCallback((time: number) => {
    setEndTime(time);
    if (currentTime > time) {
      handleSeek(time);
    }
  }, [currentTime, handleSeek]);

  const handlePreviewSelection = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = startTime;
    video.play();
    setIsPlaying(true);
  }, [startTime]);

  const handleTrim = async () => {
    setIsTrimming(true);
    setIsPlaying(false);
    videoRef.current?.pause();

    try {
      const result = await trimVideo(file, startTime, endTime, setTrimProgress);
      toast.success(`Vidéo découpée ! Nouvelle durée : ${formatTimeDisplay(result.trimmedDuration)}`);
      onTrimComplete(result.trimmedFile);
    } catch (error) {
      console.error('Trim error:', error);
      toast.error("Erreur lors de la découpe de la vidéo");
      setIsTrimming(false);
    }
  };

  const selectedDuration = endTime - startTime;
  const isOverLimit = selectedDuration > maxDurationSeconds;
  const canTrim = selectedDuration > 0 && selectedDuration <= maxDurationSeconds;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isTrimming && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Découper la vidéo
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Warning banner */}
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg",
            isOverLimit ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"
          )}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div className="text-sm">
              {isOverLimit ? (
                <>
                  La sélection dépasse la durée maximale autorisée de{' '}
                  <strong>{formatTimeDisplay(maxDurationSeconds)}</strong>.
                  Réduisez la zone de sélection.
                </>
              ) : (
                <>
                  Votre vidéo dure <strong>{formatTimeDisplay(videoDuration)}</strong>.
                  Maximum autorisé : <strong>{formatTimeDisplay(maxDurationSeconds)}</strong>.
                  Utilisez les poignées pour définir la zone à conserver.
                </>
              )}
            </div>
          </div>

          {/* Video preview */}
          {videoUrl && !isTrimming && (
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                muted={isMuted}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              {/* Video controls overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4 fill-white" />
                    ) : (
                      <Play className="h-4 w-4 fill-white" />
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Frame capture button */}
                  {onFrameCapture && (
                    <VideoFrameCapture
                      videoRef={videoRef}
                      videoUrl={videoUrl}
                      onCapture={onFrameCapture}
                      variant="compact"
                      className="h-8 w-8 text-white hover:bg-white/20"
                    />
                  )}

                  <span className="text-white text-sm ml-2">
                    {formatTimeDisplay(currentTime)} / {formatTimeDisplay(videoDuration)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Trim progress */}
          {isTrimming && trimProgress && (
            <VideoTrimProgress progress={trimProgress} />
          )}

          {/* Timeline */}
          {!isTrimming && (
            <div className="space-y-3">
              {/* Zoom controls */}
              <VideoTimelineZoomControls
                zoomLevel={zoomLevel}
                maxZoom={8}
                visibleStart={visibleStartTime}
                visibleEnd={visibleEndTime}
                duration={videoDuration}
                startTime={startTime}
                endTime={endTime}
                onZoomChange={setZoomLevel}
                onVisibleStartChange={setVisibleStartTime}
              />

              <VideoTrimTimeline
                duration={videoDuration}
                startTime={startTime}
                endTime={endTime}
                currentTime={currentTime}
                maxDuration={maxDurationSeconds}
                videoUrl={videoUrl}
                zoomLevel={zoomLevel}
                visibleStartTime={visibleStartTime}
                visibleEndTime={visibleEndTime}
                onStartChange={handleStartChange}
                onEndChange={handleEndChange}
                onSeek={handleSeek}
                onWheel={handleWheel}
              />

              {/* Quick actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePreviewSelection}
                    className="gap-1.5"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Prévisualiser
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Réinitialiser
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  Durée finale :{' '}
                  <span className={cn(
                    "font-medium",
                    isOverLimit ? "text-destructive" : "text-primary"
                  )}>
                    {formatTimeDisplay(selectedDuration)}
                  </span>
                  {' / '}
                  <span>{formatTimeDisplay(maxDurationSeconds)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isTrimming}
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleTrim}
            disabled={!canTrim || isTrimming}
            className="gap-2"
          >
            <Scissors className="h-4 w-4" />
            Découper et continuer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
