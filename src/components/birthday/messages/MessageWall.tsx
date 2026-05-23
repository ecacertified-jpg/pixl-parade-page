import { useState } from "react";
import { Heart, Plus, Search, ArrowUpDown, Sparkles, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useBirthdayMessages } from "@/hooks/useBirthdayMessages";
import { MessageCard } from "./MessageCard";
import { NewPostModal } from "./NewPostModal";

interface Props {
  pageId: string;
  slug: string;
  firstName: string;
  pageOwnerUserId: string;
}

export function MessageWall({ pageId, slug, firstName, pageOwnerUserId }: Props) {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const {
    messages, total, loading,
    search, setSearch, sort, setSort, prepend, remove,
  } = useBirthdayMessages(pageId);

  const isOwner = user?.id === pageOwnerUserId;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="h-5 w-5 text-heart" />
        <h2 className="font-bold font-poppins">Messages d'anniversaire</h2>
        <span className="text-xs text-muted-foreground">({total})</span>
        <Button
          size="sm"
          className="ml-auto bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-soft hover:opacity-95"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1.5" /> Nouveau post
        </Button>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Button
          variant="outline" size="sm" className="h-9"
          onClick={() => setSort(sort === "recent" ? "oldest" : "recent")}
        >
          <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
          {sort === "recent" ? "Récent" : "Ancien"}
        </Button>
      </div>

      <div className="space-y-3">
        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-center py-8">
            <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Sois le premier à écrire un message !</p>
          </div>
        )}
        <AnimatePresence>
          {messages.map(m => (
            <MessageCard
              key={m.id}
              message={m}
              canDelete={isOwner || m.sender_id === user?.id}
              onDelete={remove}
            />
          ))}
        </AnimatePresence>
      </div>

      <NewPostModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        slug={slug}
        firstName={firstName}
        onPublished={(m) => prepend(m as any)}
      />
    </Card>
  );
}