import { useState, useEffect, useRef } from "react";
import { Search, UserPlus, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { isValidImageUrl } from "@/lib/utils";
import { type SearchResult } from "@/hooks/useFriendRequests";

interface SearchAndAddFriendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchUsers: (query: string) => Promise<SearchResult[]>;
  sendRequest: (targetId: string, message?: string) => Promise<boolean>;
  pendingSentIds: Set<string>;
}

export function SearchAndAddFriendModal({
  open,
  onOpenChange,
  searchUsers,
  sendRequest,
  pendingSentIds,
}: SearchAndAddFriendModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [messageFor, setMessageFor] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSentIds(new Set());
      setMessageFor(null);
      setMessageText("");
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const data = await searchUsers(query);
      setResults(data);
      setSearching(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchUsers]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Rechercher des amis
          </DialogTitle>
          <DialogDescription>
            Recherchez par nom ou prénom pour envoyer une demande d'amitié
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Nom ou prénom..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />

          {searching && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun utilisateur trouvé
            </p>
          )}

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {results.map((user) => {
              const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Utilisateur";
              const initials = name.split(" ").map(n => n[0]).join("").toUpperCase();
              const sent = isAlreadySent(user.user_id);

              return (
                <div key={user.user_id} className="space-y-2">
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <Avatar className="w-10 h-10">
                      {isValidImageUrl(user.avatar_url) && (
                        <AvatarImage src={user.avatar_url!} alt={name} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                      {user.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{user.bio}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
