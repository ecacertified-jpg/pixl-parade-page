import { useState } from "react";
import { Send, Trash2, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { User } from "@supabase/supabase-js";
import { useAlbumPhotoComments } from "@/hooks/useAlbumPhotoComments";
import { cn } from "@/lib/utils";

interface Props {
  photoId: string;
  user: User | null;
  pageOwnerUserId?: string | null;
  authorName?: string | null;
  onRequireAuth?: () => void;
  /** "dark" for lightbox over black background */
  variant?: "light" | "dark";
  autoFocus?: boolean;
}

export function PhotoCommentsPanel({
  photoId,
  user,
  pageOwnerUserId,
  authorName,
  onRequireAuth,
  variant = "light",
  autoFocus,
}: Props) {
  const { comments, loading, sending, addComment, deleteComment } = useAlbumPhotoComments(photoId);
  const [text, setText] = useState("");

  const isDark = variant === "dark";

  const handleSend = async () => {
    if (!text.trim()) return;
    if (!user) {
      onRequireAuth?.();
      return;
    }
    await addComment(text, authorName ?? null, user.id);
    setText("");
  };

  return (
    <div className={cn("space-y-3", isDark ? "text-white" : "text-foreground")}>
      <div className={cn("flex items-center gap-2 text-sm font-medium", isDark ? "text-white/90" : "")}>
        <MessageCircle className="h-4 w-4" />
        Commentaires {comments.length > 0 && <span className="opacity-70">({comments.length})</span>}
      </div>

      <div className={cn(
        "max-h-56 overflow-y-auto space-y-2 pr-1",
        comments.length === 0 && !loading ? "py-2" : "",
      )}>
        {loading && comments.length === 0 ? (
          <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin opacity-60" /></div>
        ) : comments.length === 0 ? (
          <p className={cn("text-xs italic", isDark ? "text-white/60" : "text-muted-foreground")}>
            Sois le premier à commenter ✨
          </p>
        ) : (
          comments.map((c) => {
            const canDelete = !!user && (c.user_id === user.id || pageOwnerUserId === user.id);
            return (
              <div key={c.id} className={cn(
                "rounded-lg px-3 py-2 text-sm flex items-start gap-2",
                isDark ? "bg-white/10" : "bg-muted/60",
              )}>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[11px] font-medium", isDark ? "text-white/80" : "text-muted-foreground")}>
                    {c.author_name || "Un ami"}
                  </p>
                  <p className="whitespace-pre-wrap break-words">{c.content}</p>
                </div>
                {canDelete && (
                  <button onClick={() => deleteComment(c.id)} aria-label="Supprimer"
                    className={cn("opacity-60 hover:opacity-100 mt-0.5", isDark ? "text-white" : "")}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={text}
          autoFocus={autoFocus}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={user ? "Écrire un commentaire..." : "Connecte-toi pour commenter"}
          className={cn(
            "h-9 text-sm",
            isDark ? "bg-white/10 border-white/20 text-white placeholder:text-white/50" : "",
          )}
          maxLength={2000}
        />
        <Button size="sm" onClick={handleSend} disabled={sending || !text.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}