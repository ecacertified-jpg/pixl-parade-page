import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, X } from "lucide-react";
import { getMusicTrack } from "./musicTracks";
import { cn } from "@/lib/utils";

interface Props {
  photos: string[];
  musicTrackId?: string | null;
  caption?: string | null;
  autoPlay?: boolean;
  onClose?: () => void;
  className?: string;
}

const SLIDE_MS = 3200;

export function TributeSlideshow({
  photos,
  musicTrackId,
  caption,
  autoPlay = false,
  onClose,
  className,
}: Props) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const track = getMusicTrack(musicTrackId);

  useEffect(() => {
    if (!playing || photos.length === 0) return;
    const t = setTimeout(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, playing, photos.length]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = muted;
    if (playing) {
      a.play().catch(() => {});
    } else {
      a.pause();
    }
  }, [playing, muted]);

  if (!photos.length) return null;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl bg-black aspect-[4/5]",
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        <motion.img
          key={photos[index] + index}
          src={photos[index]}
          alt=""
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>

      {/* Floating hearts */}
      <AnimatePresence>
        {playing && (
          <motion.div
            key={index}
            initial={{ y: 40, opacity: 0, scale: 0.6 }}
            animate={{ y: -120, opacity: [0, 1, 0], scale: 1.2 }}
            transition={{ duration: 2.6, ease: "easeOut" }}
            className="pointer-events-none absolute bottom-16 right-6 text-4xl"
          >
            💖
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gradient overlay + caption */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 pt-12">
        {caption && (
          <motion.p
            key={index}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="font-poppins text-white text-lg leading-snug drop-shadow line-clamp-3"
          >
            {caption}
          </motion.p>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9 rounded-full bg-white/90 text-black hover:bg-white"
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            {track && (
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full bg-white/20 text-white hover:bg-white/30"
                onClick={() => setMuted((m) => !m)}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            )}
            {track && (
              <span className="text-xs text-white/80">
                {track.emoji} {track.label}
              </span>
            )}
          </div>
          <span className="text-xs text-white/70">
            {index + 1} / {photos.length}
          </span>
        </div>
        {/* progress bar */}
        <div className="mt-2 flex gap-1">
          {photos.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full bg-white/30 overflow-hidden",
                i < index && "bg-white/80"
              )}
            >
              {i === index && playing && (
                <motion.div
                  key={`${index}-bar`}
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: SLIDE_MS / 1000, ease: "linear" }}
                  className="h-full bg-white"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {onClose && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 h-9 w-9 rounded-full bg-black/40 text-white hover:bg-black/60"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {track && (
        <audio
          ref={audioRef}
          src={track.url}
          loop
          preload="auto"
          className="hidden"
        />
      )}
    </div>
  );
}