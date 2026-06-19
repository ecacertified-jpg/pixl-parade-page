import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Maximize2, X, Radio, Sparkles, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useCoverVideoPlaylist } from "@/hooks/useCoverVideoPlaylist";
import {
  isSpecialDayPlaylist,
  type CoverVideoContext,
  type CoverVideoItem,
} from "@/utils/coverVideoSchedule";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const MUTE_STORAGE_KEY = "birthday-cover-muted";
const MAX_DURATION_MS = 20_000;

interface Props {
  birthdayPageId: string | null | undefined;
  birthday: string | null | undefined;
  fallbackImageUrl?: string | null;
  className?: string;
  /** Extra absolute-positioned overlay rendered on top (avatar + name + countdown). */
  overlay?: React.ReactNode;
  children?: React.ReactNode;
  /** True when the connected user owns this birthday page (drives view tracking). */
  isOwner?: boolean;
  /** 'birthday' (default) or 'wedding' — switches playlist scheduling kinds. */
  context?: CoverVideoContext;
  /** Optional callback when the "Live / Rooms" icon is tapped. */
  onLiveClick?: () => void;
  /** Optional callback when the "Mes coulisses" icon is tapped. */
  onCoulissesClick?: () => void;
  /** Optional callback when the cover "Partage" icon is tapped. */
  onShareClick?: () => void;
}

export function CoverVideoCarousel({
  birthdayPageId,
  birthday,
  fallbackImageUrl,
  className,
  overlay,
  children,
  isOwner = false,
  context = "birthday",
  onLiveClick,
  onCoulissesClick,
  onShareClick,
}: Props) {
  const { user } = useAuth();
  const { playlist } = useCoverVideoPlaylist({
    birthdayPageId,
    birthday,
    ownerId: isOwner ? user?.id ?? null : null,
    context,
  });
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem(MUTE_STORAGE_KEY);
    // Default: muted so autoplay works on mobile; user taps to enable sound.
    return stored === null ? true : stored === "1";
  });
  const [expanded, setExpanded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const userOverrodeMuteRef = useRef(false);

  const current: CoverVideoItem | undefined = playlist[index];
  const [showUnmuteHint, setShowUnmuteHint] = useState(true);
  const viewTrackedRef = useRef<Set<string>>(new Set());

  const isSpecialDay = isSpecialDayPlaylist(playlist, birthday ?? null, new Date(), context);

  // Auto-unmute on special days (birthday or active calendar event) unless the
  // user has explicitly chosen muted during this session.
  useEffect(() => {
    if (isSpecialDay && !userOverrodeMuteRef.current && muted) {
      setMuted(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpecialDay]);

  // Auto-hide the unmute hint after 4s; re-show when current video changes while muted.
  useEffect(() => {
    if (!muted) {
      setShowUnmuteHint(false);
      return;
    }
    setShowUnmuteHint(true);
    const t = window.setTimeout(() => setShowUnmuteHint(false), 4000);
    return () => window.clearTimeout(t);
  }, [muted, current?.id]);

  // Keep index in range when playlist changes
  useEffect(() => {
    if (index >= playlist.length) setIndex(0);
  }, [playlist.length, index]);

  // Auto-advance fallback (20s cap even if onEnded never fires)
  useEffect(() => {
    if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
    if (!current || playlist.length <= 1) return;
    fallbackTimerRef.current = window.setTimeout(() => {
      setIndex((i) => (i + 1) % playlist.length);
    }, MAX_DURATION_MS);
    return () => {
      if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
    };
  }, [current?.id, playlist.length]);

  // Try to play with sound whenever user unmutes
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = muted;
    el.play().catch(() => {
      // Autoplay with sound was blocked → fall back to muted so the video still plays.
      if (!muted) {
        el.muted = true;
        setMuted(true);
        el.play().catch(() => {
          /* still blocked; will retry on next user gesture */
        });
      }
    });
  }, [muted, current?.id]);

  const handleEnded = () => {
    if (playlist.length === 0) return;
    setIndex((i) => (i + 1) % playlist.length);
  };

  // Track a "view" for the page owner once they pass 50% of the current video.
  // Only user-uploaded videos are tracked (library videos aren't in the per-page table).
  const handleTimeUpdate: React.ReactEventHandler<HTMLVideoElement> = (e) => {
    if (!isOwner || !current || current.source !== "user") return;
    if (viewTrackedRef.current.has(current.id)) return;
    const el = e.currentTarget;
    if (!el.duration || !isFinite(el.duration)) return;
    if (el.currentTime / el.duration < 0.5) return;
    viewTrackedRef.current.add(current.id);
    (supabase as any).rpc("increment_cover_video_view", { p_video_id: current.id }).then(() => {
      // best-effort, ignore errors
    });
  };

  const toggleMute = () => {
    userOverrodeMuteRef.current = true;
    setMuted((m) => {
      const next = !m;
      try {
        window.localStorage.setItem(MUTE_STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // No video available → fallback image
  if (!current) {
    return (
      <div className={cn("relative w-full overflow-hidden", className)}>
        {fallbackImageUrl ? (
          <img src={fallbackImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/40 flex items-center justify-center">
            <div className="text-6xl md:text-8xl animate-bounce">🎂</div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />
        {overlay}
        {children}
      </div>
    );
  }

  return (
    <>
      <div className={cn("relative w-full overflow-hidden bg-black", className)}>
        <video
          key={current.id}
          ref={videoRef}
          src={current.video_url}
          poster={current.poster_url ?? fallbackImageUrl ?? undefined}
          autoPlay
          playsInline
          muted={muted}
          onEnded={handleEnded}
          onError={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70 pointer-events-none" />

        {/* Story-style progress dots */}
        {playlist.length > 1 && (
          <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
            {playlist.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i === index ? "bg-white" : "bg-white/35",
                )}
              />
            ))}
          </div>
        )}

        {/* Top-right controls */}
        <div className="absolute top-6 right-3 flex flex-col gap-2 z-20">
          <button
            type="button"
            onClick={toggleMute}
            className="h-9 w-9 rounded-full bg-black/45 backdrop-blur text-white flex items-center justify-center hover:bg-black/65 transition-colors"
            aria-label={muted ? "Activer le son" : "Couper le son"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="h-9 w-9 rounded-full bg-black/45 backdrop-blur text-white flex items-center justify-center hover:bg-black/65 transition-colors"
            aria-label="Agrandir la vidéo"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          {onLiveClick && (
            <button
              type="button"
              onClick={onLiveClick}
              className="h-9 w-9 rounded-full bg-black/45 backdrop-blur text-white flex items-center justify-center hover:bg-black/65 transition-colors"
              aria-label="Aller aux rooms"
            >
              <Radio className="h-4 w-4" />
            </button>
          )}
          {onCoulissesClick && (
            <button
              type="button"
              onClick={onCoulissesClick}
              className="h-9 w-9 rounded-full bg-black/45 backdrop-blur text-white flex items-center justify-center hover:bg-black/65 transition-colors"
              aria-label="Mes coulisses"
              title="Mes coulisses"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          )}
          {onShareClick && (
            <button
              type="button"
              onClick={onShareClick}
              className="h-9 w-9 rounded-full bg-black/45 backdrop-blur text-white flex items-center justify-center hover:bg-black/65 transition-colors"
              aria-label="Partager"
              title="Partager"
            >
              <Share2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tap-to-unmute hint (only when muted, auto-hides) */}
        {muted && showUnmuteHint && (
          <button
            type="button"
            onClick={toggleMute}
            className="absolute top-[4.25rem] right-3 z-20 px-3 py-1.5 rounded-full bg-white/90 text-foreground text-xs font-medium shadow-card flex items-center gap-1.5 hover:bg-white animate-in fade-in slide-in-from-top-1"
          >
            <Volume2 className="h-3.5 w-3.5" /> Activer le son
          </button>
        )}

        {overlay}
        {children}
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-3xl p-0 bg-black border-none overflow-hidden">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="absolute top-3 right-3 z-30 h-9 w-9 rounded-full bg-black/50 text-white flex items-center justify-center"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
          <video
            src={current.video_url}
            poster={current.poster_url ?? undefined}
            autoPlay
            controls
            playsInline
            className="w-full h-auto max-h-[80vh] bg-black"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}