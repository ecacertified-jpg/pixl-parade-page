import { useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Play, Pause, Star, Share2, Trash2, Mic, Quote, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";
import { AlbumItemReactions, type ReactionCounts, type UserReactions } from "@/components/AlbumItemReactions";
import { PhotoCommentsPanel } from "./PhotoCommentsPanel";
import { cn } from "@/lib/utils";

export interface MemoryDetailItem {
  id: string;
  uploader_name: string | null;
  uploader_id?: string | null;
  memory_text: string | null;
  memory_audio_url: string | null;
  memory_audio_duration: number | null;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MemoryDetailItem | null;
  user: User | null;
  pageOwnerUserId?: string | null;
  favCount: number;
  isFav: boolean;
  reactionCounts: ReactionCounts;
  userReactions: UserReactions;
  canDelete: boolean;
  onToggleFav: () => void;
  onShare: () => void;
  onDelete: () => void;
  onReactionToggle: (photoId: string, type: string, added: boolean) => void;
  onRequireAuth: () => void;
}

export function MemoryDetailDialog({
  open, onOpenChange, item, user, pageOwnerUserId,
  favCount, isFav, reactionCounts, userReactions, canDelete,
  onToggleFav, onShare, onDelete, onReactionToggle, onRequireAuth,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  if (!item) return null;
  const isAudio = !!item.memory_audio_url;

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play().catch(() => {}); setPlaying(true); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/15 via-accent/15 to-secondary/40 p-6 relative">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>

          {isAudio ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <Mic className="h-8 w-8 text-primary" />
              <button
                onClick={togglePlay}
                className={cn(
                  "h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft",
                  playing && "ring-4 ring-primary/30 animate-pulse",
                )}
              >
                {playing ? <Pause className="h-9 w-9" /> : <Play className="h-9 w-9 ml-1" />}
              </button>
              <audio ref={audioRef} src={item.memory_audio_url!}
                onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} controls className="w-full" />
            </div>
          ) : (
            <div className="py-4">
              <Quote className="h-8 w-8 text-primary/60 mb-3" />
              <p className="text-lg italic font-nunito leading-relaxed">"{item.memory_text}"</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-4">— {item.uploader_name || "Un ami"}</p>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={onToggleFav} className="flex items-center gap-1 text-sm">
              <Star className={cn("h-5 w-5", isFav ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
              <span>{favCount}</span>
            </button>
            <button onClick={onShare} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <Share2 className="h-5 w-5" />
            </button>
            {canDelete && (
              <Button variant="ghost" size="sm" className="ml-auto text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-1" /> Supprimer
              </Button>
            )}
          </div>

          <AlbumItemReactions
            photoId={item.id}
            userId={user?.id || null}
            counts={reactionCounts}
            userReactions={userReactions}
            onToggle={onReactionToggle}
          />

          <div className="border-t pt-3">
            <PhotoCommentsPanel
              photoId={item.id}
              user={user}
              pageOwnerUserId={pageOwnerUserId}
              authorName={null}
              onRequireAuth={onRequireAuth}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}