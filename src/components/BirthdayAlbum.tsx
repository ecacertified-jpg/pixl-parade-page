import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Video, BookOpen, ImagePlus, Play, X, Loader2,
  Sparkles, Send, Quote, MoreVertical, Pencil, Trash2,
  ChevronLeft, ChevronRight
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { AlbumItemReactions, type ReactionCounts, type UserReactions } from "@/components/AlbumItemReactions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AlbumItem {
  id: string;
  uploader_id?: string | null;
  uploader_name: string | null;
  image_url: string;
  caption: string | null;
  created_at: string;
  media_type: string;
  video_url: string | null;
  video_thumbnail_url: string | null;
  memory_text: string | null;
}

interface BirthdayAlbumProps {
  pageId: string;
  slug: string;
  firstName: string;
  user: User | null;
  items: AlbumItem[];
  onItemAdded: (item: AlbumItem) => void;
  pageOwnerUserId?: string | null;
  onItemRemoved?: (id: string) => void;
  onItemUpdated?: (item: AlbumItem) => void;
}

type TabType = "all" | "image" | "video" | "memory";

// Reactions state: { [photoId]: { counts: {...}, userReactions: {...} } }
interface ReactionsMap {
  [photoId: string]: { counts: ReactionCounts; userReactions: UserReactions };
}

export function BirthdayAlbum({
  pageId,
  slug,
  firstName,
  user,
  items,
  onItemAdded,
  pageOwnerUserId = null,
  onItemRemoved,
  onItemUpdated,
}: BirthdayAlbumProps) {
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [uploading, setUploading] = useState(false);
  const [showMemoryForm, setShowMemoryForm] = useState(false);
  const [memoryText, setMemoryText] = useState("");
  const [sendingMemory, setSendingMemory] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [reactions, setReactions] = useState<ReactionsMap>({});

  // Edit/Delete state
  const [editingItem, setEditingItem] = useState<AlbumItem | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingItem, setDeletingItem] = useState<AlbumItem | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  // Touch tracking for swipe
  const touchStartX = useRef<number | null>(null);

  // Fetch all reactions for this page's photos
  const loadReactions = useCallback(async () => {
    if (items.length === 0) return;
    const photoIds = items.map((i) => i.id);

    const { data } = await supabase
      .from("album_photo_reactions")
      .select("photo_id, user_id, reaction_type")
      .in("photo_id", photoIds);

    if (!data) return;

    const map: ReactionsMap = {};
    for (const row of data) {
      if (!map[row.photo_id]) {
        map[row.photo_id] = { counts: {}, userReactions: {} };
      }
      const entry = map[row.photo_id];
      entry.counts[row.reaction_type] = (entry.counts[row.reaction_type] || 0) + 1;
      if (user && row.user_id === user.id) {
        entry.userReactions[row.reaction_type] = true;
      }
    }
    setReactions(map);
  }, [items, user]);

  useEffect(() => {
    loadReactions();
  }, [loadReactions]);

  const handleReactionToggle = (photoId: string, type: string, added: boolean) => {
    setReactions((prev) => {
      const entry = prev[photoId] || { counts: {}, userReactions: {} };
      const newCounts = { ...entry.counts };
      const newUserReactions = { ...entry.userReactions };

      if (added) {
        newCounts[type] = (newCounts[type] || 0) + 1;
        newUserReactions[type] = true;
      } else {
        newCounts[type] = Math.max(0, (newCounts[type] || 0) - 1);
        delete newUserReactions[type];
      }

      return { ...prev, [photoId]: { counts: newCounts, userReactions: newUserReactions } };
    });
  };

  const counts = {
    image: items.filter(i => i.media_type === "image").length,
    video: items.filter(i => i.media_type === "video").length,
    memory: items.filter(i => i.media_type === "memory").length,
  };

  const filtered = activeTab === "all" ? items : items.filter(i => i.media_type === activeTab);
  const lightboxItem = lightboxIndex !== null ? filtered[lightboxIndex] ?? null : null;

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      else if (e.key === "ArrowLeft") setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
      else if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i !== null && i < filtered.length - 1 ? i + 1 : i));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, filtered.length]);

  const goPrev = () => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  const goNext = () =>
    setLightboxIndex((i) => (i !== null && i < filtered.length - 1 ? i + 1 : i));

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  const canManage = (item: AlbumItem) => {
    if (!user) return false;
    if (item.uploader_id && item.uploader_id === user.id) return true;
    if (pageOwnerUserId && pageOwnerUserId === user.id) return true;
    return false;
  };
  const canEdit = (item: AlbumItem) =>
    !!user && !!item.uploader_id && item.uploader_id === user.id;

  const handleStartEdit = (item: AlbumItem) => {
    setEditingItem(item);
    setEditText(item.media_type === "memory" ? (item.memory_text || "") : (item.caption || ""));
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setSavingEdit(true);
    try {
      const updates =
        editingItem.media_type === "memory"
          ? { memory_text: editText.trim() }
          : { caption: editText.trim() };

      const { data, error } = await supabase
        .from("birthday_page_photos")
        .update(updates)
        .eq("id", editingItem.id)
        .select("id, uploader_name, image_url, caption, created_at, media_type, video_url, video_thumbnail_url, memory_text")
        .single();

      if (error) throw error;
      onItemUpdated?.(data as AlbumItem);
      toast.success("Modifié ✨");
      setEditingItem(null);
    } catch (err: any) {
      console.error(err);
      toast.error("Modification refusée — tu n'es pas l'auteur de ce contenu");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setDeleteInProgress(true);
    try {
      // 1) Tenter de supprimer le fichier storage si présent
      const url = deletingItem.video_url || deletingItem.image_url;
      if (url && deletingItem.media_type !== "memory") {
        // Extraire le path après /birthday-page-photos/
        const marker = "/birthday-page-photos/";
        const idx = url.indexOf(marker);
        if (idx !== -1) {
          const path = url.substring(idx + marker.length);
          await supabase.storage.from("birthday-page-photos").remove([path]);
          // ignore les erreurs storage : si RLS bloque, on continue quand même la suppression de la ligne
        }
      }
      // 2) Supprimer la ligne DB
      const { error } = await supabase
        .from("birthday_page_photos")
        .delete()
        .eq("id", deletingItem.id);

      if (error) throw error;

      onItemRemoved?.(deletingItem.id);
      // Si l'item supprimé est ouvert dans la lightbox, fermer ou décaler
      if (lightboxItem?.id === deletingItem.id) setLightboxIndex(null);
      toast.success("Supprimé");
      setDeletingItem(null);
    } catch (err: any) {
      console.error(err);
      toast.error("Suppression refusée");
    } finally {
      setDeleteInProgress(false);
    }
  };

  const requireAuth = () => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(`/birthday/${slug}`)}&invited=true`);
      return true;
    }
    return false;
  };

  const getProfileName = async () => {
    if (!user) return "Un ami";
    const { data } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("user_id", user.id)
      .single();
    return data?.first_name || "Un ami";
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (requireAuth()) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${pageId}/${user!.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("birthday-page-photos")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("birthday-page-photos")
        .getPublicUrl(path);

      const name = await getProfileName();

      const { data, error } = await supabase
        .from("birthday_page_photos")
        .insert({
          birthday_page_id: pageId,
          uploader_id: user!.id,
          uploader_name: name,
          image_url: urlData.publicUrl,
          media_type: "image",
        })
        .select("id, uploader_name, image_url, caption, created_at, media_type, video_url, video_thumbnail_url, memory_text")
        .single();

      if (error) throw error;
      onItemAdded(data as AlbumItem);
      toast.success("Photo ajoutée ! 📸 Partage l'album !");
    } catch {
      toast.error("Erreur lors de l'upload de la photo");
    } finally {
      setUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (requireAuth()) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("La vidéo ne doit pas dépasser 50 Mo");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${pageId}/vid-${user!.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("birthday-page-photos")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("birthday-page-photos")
        .getPublicUrl(path);

      const name = await getProfileName();

      const { data, error } = await supabase
        .from("birthday_page_photos")
        .insert({
          birthday_page_id: pageId,
          uploader_id: user!.id,
          uploader_name: name,
          image_url: urlData.publicUrl,
          video_url: urlData.publicUrl,
          media_type: "video",
        })
        .select("id, uploader_name, image_url, caption, created_at, media_type, video_url, video_thumbnail_url, memory_text")
        .single();

      if (error) throw error;
      onItemAdded(data as AlbumItem);
      toast.success("Vidéo ajoutée ! 🎬 Partage l'album !");
    } catch {
      toast.error("Erreur lors de l'upload de la vidéo");
    } finally {
      setUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleSendMemory = async () => {
    if (requireAuth()) return;
    if (!memoryText.trim()) return;

    setSendingMemory(true);
    try {
      const name = await getProfileName();

      const { data, error } = await supabase
        .from("birthday_page_photos")
        .insert({
          birthday_page_id: pageId,
          uploader_id: user!.id,
          uploader_name: name,
          image_url: "",
          media_type: "memory",
          memory_text: memoryText.trim(),
        })
        .select("id, uploader_name, image_url, caption, created_at, media_type, video_url, video_thumbnail_url, memory_text")
        .single();

      if (error) throw error;
      onItemAdded(data as AlbumItem);
      setMemoryText("");
      setShowMemoryForm(false);
      toast.success("Souvenir partagé ! 💖 Partage l'album !");
    } catch {
      toast.error("Erreur lors de l'envoi du souvenir");
    } finally {
      setSendingMemory(false);
    }
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: `Tout (${items.length})`, icon: <Sparkles className="h-3.5 w-3.5" /> },
    { key: "image", label: `Photos (${counts.image})`, icon: <Camera className="h-3.5 w-3.5" /> },
    { key: "video", label: `Vidéos (${counts.video})`, icon: <Video className="h-3.5 w-3.5" /> },
    { key: "memory", label: `Souvenirs (${counts.memory})`, icon: <BookOpen className="h-3.5 w-3.5" /> },
  ];

  const getReactionsForItem = (id: string) => reactions[id] || { counts: {}, userReactions: {} };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen className="h-5 w-5 text-accent" />
        <h2 className="font-bold font-poppins">Album souvenir de {firstName}</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {items.length} souvenir{items.length !== 1 ? "s" : ""} partagé{items.length !== 1 ? "s" : ""}
      </p>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />

        <Button
          variant="outline"
          size="sm"
          className="flex-col h-auto py-3 gap-1 border-dashed"
          disabled={uploading}
          onClick={() => {
            if (requireAuth()) return;
            photoInputRef.current?.click();
          }}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4 text-accent" />}
          <span className="text-[10px]">Photo</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex-col h-auto py-3 gap-1 border-dashed"
          disabled={uploading}
          onClick={() => {
            if (requireAuth()) return;
            videoInputRef.current?.click();
          }}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4 text-primary" />}
          <span className="text-[10px]">Vidéo</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex-col h-auto py-3 gap-1 border-dashed"
          onClick={() => {
            if (requireAuth()) return;
            setShowMemoryForm(!showMemoryForm);
          }}
        >
          <Quote className="h-4 w-4 text-heart" />
          <span className="text-[10px]">Souvenir</span>
        </Button>
      </div>

      {/* Memory form */}
      <AnimatePresence>
        {showMemoryForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="space-y-2 p-3 rounded-lg bg-muted/50">
              <Textarea
                value={memoryText}
                onChange={(e) => setMemoryText(e.target.value)}
                placeholder={`Raconte un souvenir avec ${firstName}... ✨`}
                className="resize-none min-h-[80px]"
                maxLength={1000}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={!memoryText.trim() || sendingMemory}
                  onClick={handleSendMemory}
                >
                  {sendingMemory ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                  Envoyer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowMemoryForm(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "ghost"}
            size="sm"
            className="text-xs gap-1 flex-shrink-0"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filtered.map((item) => {
            const r = getReactionsForItem(item.id);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-lg overflow-hidden cursor-pointer group"
                onClick={() => setLightboxItem(item)}
              >
                <div className="aspect-square">
                  {item.media_type === "image" && (
                    <img
                      src={item.image_url}
                      alt={item.caption || "Photo souvenir"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  )}

                  {item.media_type === "video" && (
                    <>
                      <video
                        src={item.video_url || item.image_url}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="h-5 w-5 text-primary fill-primary ml-0.5" />
                        </div>
                      </div>
                    </>
                  )}

                  {item.media_type === "memory" && (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/30 flex flex-col items-center justify-center p-3 text-center">
                      <Quote className="h-5 w-5 text-primary/50 mb-1" />
                      <p className="text-xs font-nunito text-foreground line-clamp-4 italic">
                        "{item.memory_text}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Reactions overlay */}
                <div className="absolute bottom-6 left-1 right-1 z-10" onClick={(e) => e.stopPropagation()}>
                  <AlbumItemReactions
                    photoId={item.id}
                    userId={user?.id || null}
                    counts={r.counts}
                    userReactions={r.userReactions}
                    onToggle={handleReactionToggle}
                    compact
                  />
                </div>

                {/* Author badge */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                  <p className="text-[10px] text-white truncate">
                    {item.media_type === "memory" ? "✨" : item.media_type === "video" ? "🎬" : "📸"}{" "}
                    {item.uploader_name || "Un ami"}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">
            {activeTab === "all"
              ? "Aucun souvenir pour le moment. Sois le premier !"
              : `Aucun${activeTab === "image" ? "e photo" : activeTab === "video" ? "e vidéo" : " souvenir"} pour le moment`}
          </p>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxItem(null)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
              onClick={() => setLightboxItem(null)}
            >
              <X className="h-6 w-6" />
            </Button>

            <div className="max-w-3xl max-h-[85vh] w-full" onClick={(e) => e.stopPropagation()}>
              {lightboxItem.media_type === "image" && (
                <img
                  src={lightboxItem.image_url}
                  alt={lightboxItem.caption || "Photo"}
                  className="w-full h-auto max-h-[65vh] object-contain rounded-lg"
                />
              )}

              {lightboxItem.media_type === "video" && (
                <video
                  src={lightboxItem.video_url || lightboxItem.image_url}
                  controls
                  autoPlay
                  className="w-full max-h-[65vh] rounded-lg"
                />
              )}

              {lightboxItem.media_type === "memory" && (
                <div className="bg-card rounded-2xl p-8 max-w-lg mx-auto text-center">
                  <Quote className="h-8 w-8 text-primary mx-auto mb-4" />
                  <p className="text-lg font-nunito italic text-foreground leading-relaxed">
                    "{lightboxItem.memory_text}"
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    — {lightboxItem.uploader_name || "Un ami"}
                  </p>
                </div>
              )}

              {lightboxItem.caption && lightboxItem.media_type !== "memory" && (
                <p className="text-white text-sm text-center mt-3">{lightboxItem.caption}</p>
              )}
              <p className="text-white/60 text-xs text-center mt-1">
                Par {lightboxItem.uploader_name || "Un ami"}
              </p>

              {/* Lightbox reactions */}
              <div className="flex justify-center mt-3">
                <AlbumItemReactions
                  photoId={lightboxItem.id}
                  userId={user?.id || null}
                  counts={getReactionsForItem(lightboxItem.id).counts}
                  userReactions={getReactionsForItem(lightboxItem.id).userReactions}
                  onToggle={handleReactionToggle}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
