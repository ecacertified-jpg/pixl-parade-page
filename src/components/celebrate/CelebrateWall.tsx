import { useState } from "react";
import { useCelebrationWall } from "@/hooks/useCelebrationWall";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircleHeart, Send } from "lucide-react";

interface Props {
  postId?: string | null;
  pageType?: "birthday" | "event" | "standalone";
  pageId?: string | null;
  title?: string;
}

export function MessageWall({ postId, pageType, pageId, title = "Mur de messages" }: Props) {
  const { user } = useAuth();
  const { messages, send } = useCelebrationWall({ postId, pageType, pageId });
  const [draft, setDraft] = useState("");

  const handleSend = async () => {
    if (!draft.trim()) return;
    await send(draft);
    setDraft("");
  };

  return (
    <section className="rounded-2xl border border-border bg-card/50 p-4 backdrop-blur">
      <header className="mb-3 flex items-center gap-2">
        <MessageCircleHeart className="h-5 w-5 text-heart" />
        <h3 className="font-poppins text-lg font-semibold">{title}</h3>
        <span className="ml-auto text-xs text-muted-foreground">{messages.length}</span>
      </header>

      <div className="mb-4 flex gap-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={user ? "Écris un message qui touche…" : "Connecte-toi pour écrire"}
          disabled={!user}
          rows={2}
          className="resize-none"
          maxLength={500}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!user || !draft.trim()}
          className="self-end shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <ul className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <li className="text-center text-sm text-muted-foreground py-6">
            Sois le premier à laisser un mot doux 💌
          </li>
        )}
        {messages.map((m) => {
          const name = m.author_display_name || m.author?.first_name || "Un proche";
          const initial = (name?.[0] || "?").toUpperCase();
          return (
            <li key={m.id} className="flex gap-3 animate-fade-in">
              <Avatar className="h-9 w-9 shrink-0">
                {m.author?.avatar_url && <AvatarImage src={m.author.avatar_url} alt={name} />}
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>
              <div className="flex-1 rounded-xl bg-secondary/50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {name}
                    {m.is_vip && <span className="ml-1 text-gratitude">✨</span>}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                  {m.content}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}