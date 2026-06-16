import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Trash2, Sparkles } from "lucide-react";
import { ReactionBar } from "./ReactionBar";
import { CelebrateWall } from "./CelebrateWall";
import { useAuth } from "@/contexts/AuthContext";
import type { CelebrationPost } from "@/hooks/useCelebrationFeed";
import { cn } from "@/lib/utils";

interface Props {
  post: CelebrationPost;
  onDelete?: (id: string) => void;
}

export function CelebrationCard({ post, onDelete }: Props) {
  const { user } = useAuth();
  const [showWall, setShowWall] = useState(false);
  const isAuthor = user?.id === post.author_id;
  const name =
    `${post.author?.first_name || ""} ${post.author?.last_name || ""}`.trim() ||
    "Un proche";
  const initial = (post.author?.first_name?.[0] || "?").toUpperCase();

  return (
    <article
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-soft transition-all",
        post.is_boosted && "border-celebration ring-2 ring-celebration/30",
        post.is_pinned && "border-primary"
      )}
    >
      <header className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {post.author?.avatar_url && <AvatarImage src={post.author.avatar_url} alt={name} />}
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{name}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(post.created_at).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        {post.is_boosted && (
          <Badge className="bg-celebration text-white gap-1">
            <Sparkles className="h-3 w-3" /> À la une
          </Badge>
        )}
        {isAuthor && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(post.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </header>

      {post.content && (
        <p className="mt-3 whitespace-pre-wrap break-words text-foreground/90">
          {post.content}
        </p>
      )}

      {post.kind === "photo" && post.media_urls?.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {post.media_urls.slice(0, 4).map((url) => (
            <img
              key={url}
              src={url}
              alt=""
              loading="lazy"
              className="aspect-square w-full rounded-xl object-cover"
            />
          ))}
        </div>
      )}

      {post.kind === "video" && post.media_urls?.[0] && (
        <video
          src={post.media_urls[0]}
          controls
          muted
          playsInline
          className="mt-3 w-full rounded-xl"
        />
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <ReactionBar postId={post.id} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowWall((s) => !s)}
          className="gap-1 text-muted-foreground hover:text-primary"
        >
          <MessageCircle className="h-4 w-4" />
          {post.messages_count}
        </Button>
      </div>

      {showWall && (
        <div className="mt-3 border-t border-border pt-3">
          <CelebrateWall postId={post.id} title="Messages" />
        </div>
      )}
    </article>
  );
}