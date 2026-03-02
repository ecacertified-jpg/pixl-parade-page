import { useState, useEffect } from "react";
import { Link2, Loader2, Search } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { isValidImageUrl } from "@/lib/utils";

interface LinkContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  contactName: string;
  onLinked: () => void;
}

interface ProfileResult {
  user_id: string;
  first_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}


export function LinkContactDialog({
  open,
  onOpenChange,
  contactId,
  contactName,
  onLinked,
}: LinkContactDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      if (!user) return;
      const { data } = await supabase
        .from("public_profiles")
        .select("user_id, first_name, avatar_url, bio")
        .ilike("first_name", `%${query}%`)
        .neq("user_id", user.id)
        .limit(10);
      setResults((data as ProfileResult[]) || []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, open, user]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const handleLink = async (selectedUserId: string) => {
    if (!user) return;
    setLinking(selectedUserId);
    try {
      // 1. Update linked_user_id on contact
      const { error: updateError } = await supabase
        .from("contacts")
        .update({ linked_user_id: selectedUserId })
        .eq("id", contactId)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // 2. Create bidirectional relationship (symmetric key)
      const [userA, userB] = [user.id, selectedUserId].sort();
      const { error: relError } = await supabase
        .from("contact_relationships")
        .upsert(
          {
            user_a: userA,
            user_b: userB,
            can_see_events: true,
            can_see_funds: true,
          },
          { onConflict: "user_a,user_b" }
        );

      if (relError) throw relError;

      toast({
        title: "Contact lié",
        description: `${contactName} est maintenant lié à un compte utilisateur.`,
      });

      onLinked();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la liaison:", error);
      toast({
        title: "Erreur",
        description: "Impossible de lier ce contact. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setLinking(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-poppins">
            Lier « {contactName} » à un compte
          </DialogTitle>
          <DialogDescription>
            Recherchez l'utilisateur inscrit correspondant à ce contact.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nom ou téléphone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2">
          {searching && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">
              Aucun utilisateur trouvé pour « {query} »
            </p>
          )}

          {!searching &&
            results.map((profile) => {
              const name = profile.first_name || "Utilisateur";
              const initials = name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={profile.user_id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="w-10 h-10">
                    {isValidImageUrl(profile.avatar_url) && (
                      <AvatarImage src={profile.avatar_url!} alt={name} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
                    {profile.bio && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {profile.bio}
                      </p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    className="gap-1 h-8"
                    disabled={linking === profile.user_id}
                    onClick={() => handleLink(profile.user_id)}
                  >
                    {linking === profile.user_id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Link2 className="h-3 w-3" />
                        <span className="text-xs">Lier</span>
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
