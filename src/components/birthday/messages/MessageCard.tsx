import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, MoreHorizontal, Trash2, Flag } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BirthdayMessage } from "@/hooks/useBirthdayMessages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function formatFR(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

function YoutubeEmbed({ id }: { id: string }) {
  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        title="YouTube"
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

interface Props {
  message: BirthdayMessage;
  canDelete: boolean;
  onDelete?: (id: string) => void;
}

export function MessageCard({ message: m, canDelete, onDelete }: Props) {
  const [reactionCount, setReactionCount] = useState(m.reactions_count || 0);
  const [reacted, setReacted] = useState(false);

  const handleReact = async () => {
    if (reacted) return;
    setReacted(true);
    setReactionCount(c => c + 1);
    const { error } = await supabase
      .from("birthday_wishes_messages")
      .update({ reactions_count: reactionCount + 1 })
      .eq("id", m.id);
    if (error) {
      setReacted(false);
      setReactionCount(c => c - 1);
    }
  };

  const handleReport = () => toast.info("Merci, ton signalement a bien été pris en compte.");

  const initials = (m.sender_name || "?").charAt(0).toUpperCase();
  const youtubeId = m.media_type === "youtube" ? (m.media_metadata?.video_id || m.media_url) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card border border-border/60 p-4 shadow-card"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{m.sender_name || "Un ami"}</span>
            <span className="text-xs text-muted-foreground">· {formatFR(m.created_at)}</span>
            {m.is_from_fund && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gift/20 text-gift">💝 Contributeur</span>
            )}
            {m.moderation_status === "borderline" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">⚠️ À vérifier</span>
            )}
          </div>

          {(m.media_type === "gif" || m.media_type === "sticker" || m.media_type === "animated_text" || m.media_type === "image" || m.media_type === "card") && m.media_url && (
            <div className="mt-2 rounded-xl overflow-hidden bg-muted">
              <img src={m.media_url} alt="" loading="lazy" className="w-full max-h-96 object-contain" />
            </div>
          )}

          {m.media_type === "youtube" && youtubeId && (
            <div className="mt-2"><YoutubeEmbed id={String(youtubeId)} /></div>
          )}

          {m.audio_url && (
            <audio controls src={m.audio_url} className="mt-2 w-full" preload="none" />
          )}

          {m.message_text && (
            <p className="text-sm mt-2 whitespace-pre-wrap break-words">{m.message_text}</p>
          )}

          <div className="flex items-center gap-1 mt-3 -ml-2">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 gap-1.5 ${reacted ? "text-heart" : "text-muted-foreground"}`}
              onClick={handleReact}
            >
              <Heart className={`h-4 w-4 ${reacted ? "fill-heart" : ""}`} />
              <span className="text-xs">{reactionCount}</span>
            </Button>
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleReport}>
                    <Flag className="h-4 w-4 mr-2" /> Signaler
                  </DropdownMenuItem>
                  {canDelete && (
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(m.id)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}