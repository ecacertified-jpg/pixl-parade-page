import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Maximize, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LandingVideoPlayerProps {
  videoUrl: string;
}

export function LandingVideoPlayer({ videoUrl }: LandingVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<NodeJS.Timeout>();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const handleContainerClick = () => {
    if (showControls) {
      handlePlayPause();
    }
    setShowControls(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-lg mx-auto rounded-2xl overflow-hidden shadow-lg cursor-pointer group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={handleContainerClick}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        className="w-full aspect-video object-cover"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
      />

      {/* Buffering spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <Loader2 className="h-10 w-10 text-primary-foreground animate-spin" />
        </div>
      )}

      {/* Overlay controls */}
      <div
        className={cn(
          "absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="w-14 h-14 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center">
          {isPlaying ? (
            <Pause className="h-7 w-7 text-primary-foreground" />
          ) : (
            <Play className="h-7 w-7 text-primary-foreground ml-0.5" />
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <button
          onClick={(e) => { e.stopPropagation(); handleMuteToggle(); }}
          className="text-primary-foreground hover:text-primary transition-colors p-1"
          aria-label={isMuted ? "Activer le son" : "Couper le son"}
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleFullscreen(); }}
          className="text-primary-foreground hover:text-primary transition-colors p-1"
          aria-label="Plein écran"
        >
          <Maximize className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
