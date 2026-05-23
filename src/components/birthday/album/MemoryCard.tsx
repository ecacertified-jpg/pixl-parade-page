import { useRef, useState } from "react";
import { Play, Pause, Star, MessageCircle, Share2, Quote, Mic, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MemoryCardItem {
  id: string;
  uploader_name: string | null;
  memory_text: string | null;
  memory_audio_url: string | null;
  memory_audio_duration: number | null;
  created_at: string;
}

interface Props {
  item: MemoryCardItem;
  favCount: number;
  isFav: boolean;
  reactionsTotal: number;
  commentsCount?: number;
  canDelete?: boolean;
  onOpen: () => void;
  onToggleFav: () => void;
  onShare: () => void;
  onComment: () => void;
  onDelete?: () => void;
}

function fmtDur(sec: number | null) {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function MemoryCard({
  item, favCount, isFav, reactionsTotal, commentsCount = 0, canDelete,
  onOpen, onToggleFav, onShare, onComment, onDelete,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play().catch(() => {}); setPlaying(true); }
  };

  const isAudio = !!item.memory_audio_url;

  return (
    <div
      onClick={onOpen}
      className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/30 rounded-xl p-4 cursor-pointer hover:shadow-card transition-shadow"
    >
      {isAudio ? (
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={togglePlay}
            className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft shrink-0"
            aria-label={playing ? "Pause" : "Lecture"}
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mic className="h-3.5 w-3.5" /> Souvenir audio
              {item.memory_audio_duration ? <span>· {fmtDur(item.memory_audio_duration)}</span> : null}
            </div>
            <div className="h-1.5 rounded-full bg-muted mt-1.5 overflow-hidden">
              <div className={cn("h-full bg-primary/50 transition-all", playing ? "w-full" : "w-1/4")} />
            </div>
          </div>
          <audio
            ref={audioRef}
            src={item.memory_audio_url!}
            preload="none"
            onEnded={() => setPlaying(false)}
            onPause={() => setPlaying(false)}
            hidden
          />
        </div>
      ) : (
        <>
          <Quote className="h-5 w-5 text-primary/50 mb-2" />
          <p className="text-sm italic font-nunito line-clamp-4">"{item.memory_text}"</p>
        </>
      )}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
        <span className="text-xs text-muted-foreground truncate flex-1">— {item.uploader_name || "Un ami"}</span>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={onToggleFav} className="flex items-center gap-0.5 text-xs hover:text-foreground px-1.5 py-1 rounded">
            <Star className={cn("h-3.5 w-3.5", isFav ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
            <span className="text-muted-foreground">{favCount}</span>
          </button>
          <button onClick={onComment} className="flex items-center gap-0.5 text-xs hover:text-foreground px-1.5 py-1 rounded">
            <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{commentsCount || reactionsTotal}</span>
          </button>
          <button onClick={onShare} className="p-1.5 hover:bg-muted rounded" aria-label="Partager">
            <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {canDelete && onDelete && (
            <button onClick={onDelete} className="p-1.5 hover:bg-muted rounded" aria-label="Supprimer">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}