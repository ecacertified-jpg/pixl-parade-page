import { useEffect, useRef, useState } from 'react';
import { X, Volume2, VolumeX, Maximize, Pause, Play, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { 
  getVideoSource, 
  extractYouTubeId, 
  extractVimeoId,
  getYouTubeEmbedUrl,
  getVimeoEmbedUrl
} from '@/utils/videoHelpers';

interface VideoPlayerProps {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function VideoPlayer({ videoUrl, isOpen, onClose, title }: VideoPlayerProps) {
  const videoSource = getVideoSource(videoUrl);

  // For YouTube/Vimeo, use embed player
  if (videoSource === 'youtube' || videoSource === 'vimeo') {
    return (
      <EmbedVideoPlayer
        videoUrl={videoUrl}
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        source={videoSource}
      />
    );
  }

  // For direct videos, use HTML5 player
  return (
    <DirectVideoPlayer
      videoUrl={videoUrl}
      isOpen={isOpen}
      onClose={onClose}
      title={title}
    />
  );
}

// Embed player for YouTube and Vimeo
interface EmbedVideoPlayerProps {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  source: 'youtube' | 'vimeo';
}

function EmbedVideoPlayer({ videoUrl, isOpen, onClose, title, source }: EmbedVideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);

  const getEmbedUrl = () => {
    if (source === 'youtube') {
      const videoId = extractYouTubeId(videoUrl);
      return videoId ? getYouTubeEmbedUrl(videoId) : '';
    }
    if (source === 'vimeo') {
      const videoId = extractVimeoId(videoUrl);
      return videoId ? getVimeoEmbedUrl(videoId) : '';
    }
    return '';
  };

  const embedUrl = getEmbedUrl();

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
    }
  }, [isOpen, videoUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-4xl w-full p-0 bg-black border-none overflow-hidden"
        onPointerDownOutside={onClose}
      >
        <VisuallyHidden>
          <DialogTitle>{title || 'Lecteur vidéo'}</DialogTitle>
        </VisuallyHidden>
        
        <div className="relative w-full aspect-video">
          {/* Loading spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <Loader2 className="h-10 w-10 text-white animate-spin" />
            </div>
          )}

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-white hover:bg-white/20 z-20"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Platform badge */}
          <div className={cn(
            "absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium text-white z-20",
            source === 'youtube' ? "bg-red-600" : "bg-[#1AB7EA]"
          )}>
            {source === 'youtube' ? 'YouTube' : 'Vimeo'}
          </div>

          {/* Embed iframe */}
          {embedUrl && (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={() => setIsLoading(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Direct HTML5 video player (existing implementation)
interface DirectVideoPlayerProps {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

function DirectVideoPlayer({ videoUrl, isOpen, onClose, title }: DirectVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay might be blocked
      });
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [isOpen]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / dur) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      const newTime = (value[0] / 100) * duration;
      videoRef.current.currentTime = newTime;
      setProgress(value[0]);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-4xl w-full p-0 bg-black border-none overflow-hidden"
        onPointerDownOutside={onClose}
      >
        <VisuallyHidden>
          <DialogTitle>{title || 'Lecteur vidéo'}</DialogTitle>
        </VisuallyHidden>
        
        <div 
          ref={containerRef}
          className="relative w-full aspect-video"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          {/* Loading spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <Loader2 className="h-10 w-10 text-white animate-spin" />
            </div>
          )}

          {/* Video element */}
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onWaiting={() => setIsLoading(true)}
            onCanPlay={() => setIsLoading(false)}
            onClick={handlePlayPause}
            playsInline
          />

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-white hover:bg-white/20 z-10"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Play/Pause overlay */}
          {!isPlaying && !isLoading && (
            <div 
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={handlePlayPause}
            >
              <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                <Play className="h-8 w-8 text-white fill-white ml-1" />
              </div>
            </div>
          )}

          {/* Controls bar */}
          <div 
            className={cn(
              "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            {/* Progress bar */}
            <div className="mb-3">
              <Slider
                value={[progress]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="cursor-pointer"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-8 w-8"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-8 w-8"
                  onClick={handleMuteToggle}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>

                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-8 w-8"
                onClick={handleFullscreen}
              >
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
