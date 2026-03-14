import { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Maximize, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface LandingVideoPlayerProps {
  videoUrl: string;
}

export function LandingVideoPlayer({ videoUrl }: LandingVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const isMobile = useIsMobile();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const hideControlsAfterDelay = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const handleTap = useCallback(() => {
    if (!isMobile) return;
    setShowControls(prev => {
      const next = !prev;
      if (next) hideControlsAfterDelay();
      return next;
    });
  }, [isMobile, hideControlsAfterDelay]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
    if (isMobile) hideControlsAfterDelay();
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
    if (isMobile) hideControlsAfterDelay();
  };

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const controlsVisible = isMobile ? showControls : showControls;
  // On mobile, bottom bar is always visible for accessibility
  const bottomBarVisible = isMobile || showControls;

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-lg mx-auto rounded-2xl overflow-hidden shadow-lg cursor-pointer bg-black"
      onMouseEnter={() => !isMobile && setShowControls(true)}
      onMouseLeave={() => !isMobile && setShowControls(false)}
      onClick={isMobile ? handleTap : handlePlayPause}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="w-full aspect-video object-contain"
        onPlay={() => { setIsPlaying(true); setIsBuffering(false); }}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
      />

      {/* Buffering indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="h-10 w-10 text-primary-foreground animate-spin" />
        </div>
      )}

      {/* Center play/pause overlay (tap/hover) */}
      <div
        className={cn(
          "absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300 pointer-events-none",
          controlsVisible ? "opacity-100" : "opacity-0"
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

      {/* Desktop: click overlay for play/pause */}
      {!isMobile && (
        <div className="absolute inset-0" onClick={handlePlayPause} />
      )}

      {/* Bottom bar — always visible on mobile */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300 z-10",
          bottomBarVisible ? "opacity-100" : "opacity-0"
        )}
      >
        <button
          onClick={handleMuteToggle}
          className="text-primary-foreground hover:text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={isMuted ? "Activer le son" : "Couper le son"}
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>

        {/* Mobile play/pause button */}
        {isMobile && (
          <button
            onClick={(e) => { e.stopPropagation(); handlePlayPause(); hideControlsAfterDelay(); }}
            className="text-primary-foreground hover:text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={isPlaying ? "Pause" : "Lecture"}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
        )}

        <button
          onClick={handleFullscreen}
          className="text-primary-foreground hover:text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Plein écran"
        >
          <Maximize className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
