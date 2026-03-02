import { useState } from "react";
import { UserPlus, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { AnimatedSkeleton } from "@/components/AnimatedSkeleton";
import { isValidImageUrl } from "@/lib/utils";
import { type SearchResult } from "@/hooks/useFriendRequests";

interface InlineUserSearchResultsProps {
  results: SearchResult[];
  searching: boolean;
  query: string;
  pendingSentIds: Set<string>;
  sendRequest: (targetId: string, message?: string) => Promise<boolean>;
}

export function InlineUserSearchResults({
  results,
  searching,
  query,
  pendingSentIds,
  sendRequest,
}: InlineUserSearchResultsProps) {
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [messageFor, setMessageFor] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  const handleSend = async (userId: string) => {
    setSendingTo(userId);
    const msg = messageFor === userId ? messageText.trim() || undefined : undefined;
    const ok = await sendRequest(userId, msg);
    if (ok) {
      setSentIds(prev => new Set(prev).add(userId));
      setMessageFor(null);
      setMessageText("");
    }
    setSendingTo(null);
  };

  const isAlreadySent = (userId: string) =>
    pendingSentIds.has(userId) || sentIds.has(userId);

  if (searching) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card">
            <AnimatedSkeleton variant="circular" className="w-10 h-10" delay={i * 0.15} />
            <div className="flex-1 space-y-1.5">
              <AnimatedSkeleton variant="text" className="h-3.5 w-28" delay={i * 0.15} />
              <AnimatedSkeleton variant="text" className="h-3 w-40" delay={i * 0.15 + 0.1} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (query.trim().length >= 2 && results.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        Aucun utilisateur trouvé pour « {query} »
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.map((user) => {
        const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Utilisateur";
        const initials = name.split(" ").map(n => n[0]).join("").toUpperCase();
        const sent = isAlreadySent(user.user_id);

        return (
          <div key={user.user_id} className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted/50 transition-colors">
              <Avatar className="w-10 h-10">
                {isValidImageUrl(user.avatar_url) && (
                  <AvatarImage src={user.avatar_url!} alt={name} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{name}</p>
                {user.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{user.bio}</p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!sent && messageFor !== user.user_id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 px-2"
                    onClick={() => {
                      setMessageFor(user.user_id);
                      setMessageText("");
                    }}
                  >
                    + Message
                  </Button>
                )}
                <Button
                  size="sm"
                  disabled={sent || sendingTo === user.user_id}
                  onClick={() => handleSend(user.user_id)}
                  className="gap-1 h-8"
                >
                  {sent ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span className="text-xs">Envoyée</span>
                    </>
                  ) : sendingTo === user.user_id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-3 w-3" />
                      <span className="text-xs">Ajouter</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {messageFor === user.user_id && (
              <Textarea
                placeholder="Message personnalisé (optionnel)..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="text-sm h-16 ml-12"
                maxLength={200}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
