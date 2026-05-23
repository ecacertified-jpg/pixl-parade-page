import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Video, BookOpen, ImagePlus, Play, X, Loader2,
  Send, Quote, MoreVertical, Trash2, Lock,
  ChevronLeft, ChevronRight, Share2, Star, MessageCircle,
  Search, ArrowLeft, Heart, Download, Plus, Mic, Pencil,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { AlbumItemReactions, type ReactionCounts, type UserReactions } from "@/components/AlbumItemReactions";
import { compressImage } from "@/utils/compressImage";
import { extractSingleThumbnail } from "@/utils/videoThumbnails";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlbumEventKind,
  ALBUM_EVENT_KINDS,
  getEventLabel,
  getEventEmoji,
} from "@/data/album-event-kinds";
import { cn } from "@/lib/utils";
import { shareAlbumItem } from "@/utils/shareAlbumItem";
import { PhotoCommentsPanel } from "./PhotoCommentsPanel";
import { MemoryRecorder } from "./MemoryRecorder";
import { MemoryCard } from "./MemoryCard";
import { MemoryDetailDialog } from "./MemoryDetailDialog";

export interface AlbumItem {
  id: string;
  uploader_id?: string | null;
  uploader_name: string | null;
  image_url: string;
  caption: string | null;
  created_at: string;
  media_type: string; // image | video | memory
  video_url: string | null;
  video_thumbnail_url: string | null;
  memory_text: string | null;
  event_kind: string | null;
  view_count: number;
  memory_audio_url?: string | null;
  memory_audio_duration?: number | null;
}

interface Props {
  pageId: string;
  slug: string;
  firstName: string;
  user: User | null;
  items: AlbumItem[];
  onItemAdded: (item: AlbumItem) => void;
  pageOwnerUserId?: string | null;
  onItemRemoved?: (id: string) => void;
  onItemUpdated?: (item: AlbumItem) => void;
  socialSharePhotoId?: string | null;
  onSocialSharePhotoChanged?: (photoId: string | null) => void;
}

type MainTab = "gallery" | "events" | "memories" | "favorites";
type MediaFilter = "all" | "image" | "video";

const ALBUM_COLS = "id, uploader_id, uploader_name, image_url, caption, created_at, media_type, video_url, video_thumbnail_url, memory_text, event_kind, view_count, memory_audio_url, memory_audio_duration";

function pluralize(n: number, s: string, p?: string) {
  return `${n} ${n > 1 ? (p ?? s + "s") : s}`;
}

function getFingerprint(): string {
  try {
    let fp = localStorage.getItem("jdv-fp");
    if (!fp) {
      fp = crypto.randomUUID();
      localStorage.setItem("jdv-fp", fp);
    }
    return fp;
  } catch {
    return "anon";
  }
}

export function BirthdayAlbumFlickr({
  pageId, slug, firstName, user, items,
  onItemAdded, pageOwnerUserId = null,
  onItemRemoved, onItemUpdated,
  socialSharePhotoId = null, onSocialSharePhotoChanged,
}: Props) {
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [mainTab, setMainTab] = useState<MainTab>("gallery");
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [selectedEvent, setSelectedEvent] = useState<AlbumEventKind | null>(null);
  const [search, setSearch] = useState("");

  // Upload sheet
  const [uploadSheet, setUploadSheet] = useState<{ mode: "image" | "video"; defaultEvent?: AlbumEventKind } | null>(null);
  const [pendingEvent, setPendingEvent] = useState<AlbumEventKind | null>(null);
  const [uploading, setUploading] = useState(false);

  // Memory form
  const [memorySheet, setMemorySheet] = useState<null | { mode: "text" | "audio" }>(null);
  const [memoryMode, setMemoryMode] = useState<"text" | "audio">("text");
  const [memoryText, setMemoryText] = useState("");
  const [sendingMemory, setSendingMemory] = useState(false);
  const [openMemoryId, setOpenMemoryId] = useState<string | null>(null);
  // Comments counts (best-effort cache; details loaded on demand inside panels)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  // Lightbox
  const [lightboxIds, setLightboxIds] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxShowComments, setLightboxShowComments] = useState(false);

  // Delete
  const [deletingItem, setDeletingItem] = useState<AlbumItem | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  // Reactions
  const [reactions, setReactions] = useState<Record<string, { counts: ReactionCounts; userReactions: UserReactions }>>({});
  // Favorites
  const [favCounts, setFavCounts] = useState<Record<string, number>>({});
  const [myFavs, setMyFavs] = useState<Set<string>>(new Set());
  // Comments counts (from existing fund_comments? we use album reactions only for now → use counts.heart as proxy)

  // Load reactions + favorites
  const loadAux = useCallback(async () => {
    if (items.length === 0) return;
    const ids = items.map((i) => i.id);

    const [rRes, fRes, cRes] = await Promise.all([
      supabase
        .from("album_photo_reactions")
        .select("photo_id, user_id, reaction_type")
        .in("photo_id", ids),
      supabase
        .from("birthday_page_photo_favorites")
        .select("photo_id, user_id")
        .in("photo_id", ids),
      supabase
        .from("album_photo_comments")
        .select("photo_id")
        .in("photo_id", ids),
    ]);

    const rMap: typeof reactions = {};
    for (const row of rRes.data ?? []) {
      const e = (rMap[row.photo_id] ||= { counts: {}, userReactions: {} });
      e.counts[row.reaction_type] = (e.counts[row.reaction_type] || 0) + 1;
      if (user && row.user_id === user.id) e.userReactions[row.reaction_type] = true;
    }
    setReactions(rMap);

    const fc: Record<string, number> = {};
    const mine = new Set<string>();
    for (const row of fRes.data ?? []) {
      fc[row.photo_id] = (fc[row.photo_id] || 0) + 1;
      if (user && row.user_id === user.id) mine.add(row.photo_id);
    }
    setFavCounts(fc);
    setMyFavs(mine);

    const cc: Record<string, number> = {};
    for (const row of cRes.data ?? []) {
      cc[row.photo_id] = (cc[row.photo_id] || 0) + 1;
    }
    setCommentCounts(cc);
  }, [items, user]);

  useEffect(() => { loadAux(); }, [loadAux]);

  const handleReactionToggle = (photoId: string, type: string, added: boolean) => {
    setReactions((prev) => {
      const entry = prev[photoId] || { counts: {}, userReactions: {} };
      const counts = { ...entry.counts };
      const u = { ...entry.userReactions };
      if (added) { counts[type] = (counts[type] || 0) + 1; u[type] = true; }
      else { counts[type] = Math.max(0, (counts[type] || 0) - 1); delete u[type]; }
      return { ...prev, [photoId]: { counts, userReactions: u } };
    });
  };

  const toggleFavorite = async (item: AlbumItem) => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(`/birthday/${slug}`)}&invited=true`);
      return;
    }
    const isFav = myFavs.has(item.id);
    // optimistic
    setMyFavs((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(item.id); else next.add(item.id);
      return next;
    });
    setFavCounts((prev) => ({
      ...prev,
      [item.id]: Math.max(0, (prev[item.id] || 0) + (isFav ? -1 : 1)),
    }));
    if (isFav) {
      await supabase.from("birthday_page_photo_favorites").delete()
        .eq("photo_id", item.id).eq("user_id", user.id);
    } else {
      await supabase.from("birthday_page_photo_favorites").insert({ photo_id: item.id, user_id: user.id });
    }
  };

  const recordView = useCallback(async (photoId: string) => {
    try {
      const key = `jdv-view-${photoId}`;
      const last = localStorage.getItem(key);
      const today = new Date().toISOString().slice(0, 10);
      if (last === today) return;
      localStorage.setItem(key, today);
      await supabase.rpc("record_album_photo_view", {
        _photo_id: photoId,
        _fingerprint: user ? null : getFingerprint(),
      });
    } catch { /* ignore */ }
  }, [user]);

  // Filtering helpers
  const applyMediaFilter = (arr: AlbumItem[]) =>
    mediaFilter === "all" ? arr : arr.filter((i) => i.media_type === mediaFilter);

  const searched = useCallback((arr: AlbumItem[]) => {
    const q = search.trim().toLowerCase();
    if (!q) return arr;
    return arr.filter((i) =>
      (i.caption || "").toLowerCase().includes(q) ||
      (i.uploader_name || "").toLowerCase().includes(q) ||
      (i.memory_text || "").toLowerCase().includes(q) ||
      getEventLabel(i.event_kind).toLowerCase().includes(q),
    );
  }, [search]);

  // Gallery: all non-memory items
  const galleryItems = useMemo(
    () => searched(applyMediaFilter(items.filter((i) => i.media_type !== "memory"))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, mediaFilter, search],
  );

  // Memories tab
  const memoryItems = useMemo(() => items.filter((i) => i.media_type === "memory"), [items]);

  // Favorites
  const favoriteItems = useMemo(
    () => searched(applyMediaFilter(items.filter((i) => myFavs.has(i.id) && i.media_type !== "memory"))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, myFavs, mediaFilter, search],
  );

  // Events grouping
  const eventsGrouped = useMemo(() => {
    const map = new Map<AlbumEventKind, AlbumItem[]>();
    for (const it of items) {
      if (!it.event_kind || it.media_type === "memory") continue;
      const k = it.event_kind as AlbumEventKind;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(it);
    }
    return map;
  }, [items]);

  const eventDetailItems = useMemo(() => {
    if (!selectedEvent) return [];
    const arr = items.filter((i) => i.event_kind === selectedEvent && i.media_type !== "memory");
    return applyMediaFilter(arr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, selectedEvent, mediaFilter]);

  // === Upload ===

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
      .from("profiles").select("first_name").eq("user_id", user.id).single();
    return data?.first_name || "Un ami";
  };

  const openUploadSheet = (mode: "image" | "video", defaultEvent?: AlbumEventKind) => {
    if (requireAuth()) return;
    setPendingEvent(defaultEvent ?? null);
    setUploadSheet({ mode, defaultEvent });
  };

  const handlePickFile = () => {
    if (uploadSheet?.mode === "image") photoInputRef.current?.click();
    else videoInputRef.current?.click();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      let toUpload: File = file;
      try {
        const c = await compressImage(file, { quality: 0.82, maxWidth: 1600, maxHeight: 1600, format: "jpeg" });
        toUpload = c.file;
      } catch { toUpload = file; }
      const ext = toUpload.name.includes(".") ? toUpload.name.split(".").pop() : "jpg";
      const path = `${pageId}/${user.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("birthday-page-photos").upload(path, toUpload, { contentType: toUpload.type || "image/jpeg" });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("birthday-page-photos").getPublicUrl(path);
      const name = await getProfileName();
      const { data, error } = await supabase
        .from("birthday_page_photos")
        .insert({
          birthday_page_id: pageId,
          uploader_id: user.id,
          uploader_name: name,
          image_url: urlData.publicUrl,
          media_type: "image",
          event_kind: pendingEvent,
        })
        .select(ALBUM_COLS).single();
      if (error) throw error;
      onItemAdded(data as AlbumItem);
      toast.success("Photo ajoutée ! 📸");
      setUploadSheet(null);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'upload de la photo");
    } finally {
      setUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 50 * 1024 * 1024) { toast.error("La vidéo ne doit pas dépasser 50 Mo"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${pageId}/vid-${user.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("birthday-page-photos").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("birthday-page-photos").getPublicUrl(path);
      let thumbnailUrl: string | null = null;
      try {
        const objectUrl = URL.createObjectURL(file);
        const dataUrl = await extractSingleThumbnail(objectUrl, 0.5, 480);
        URL.revokeObjectURL(objectUrl);
        const thumbBlob = await (await fetch(dataUrl)).blob();
        const thumbPath = `${pageId}/vid-${user.id}-${Date.now()}-thumb.jpg`;
        const { error: thumbErr } = await supabase.storage
          .from("birthday-page-photos").upload(thumbPath, thumbBlob, { contentType: "image/jpeg" });
        if (!thumbErr) {
          const { data: thumbData } = supabase.storage.from("birthday-page-photos").getPublicUrl(thumbPath);
          thumbnailUrl = thumbData.publicUrl;
        }
      } catch { /* ignore */ }
      const name = await getProfileName();
      const { data, error } = await supabase
        .from("birthday_page_photos")
        .insert({
          birthday_page_id: pageId,
          uploader_id: user.id,
          uploader_name: name,
          image_url: urlData.publicUrl,
          video_url: urlData.publicUrl,
          video_thumbnail_url: thumbnailUrl,
          media_type: "video",
          event_kind: pendingEvent,
        })
        .select(ALBUM_COLS).single();
      if (error) throw error;
      onItemAdded(data as AlbumItem);
      toast.success("Vidéo ajoutée ! 🎬");
      setUploadSheet(null);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'upload de la vidéo");
    } finally {
      setUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleSendMemoryText = async () => {
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
          image_url: null as unknown as string,
          media_type: "memory",
          memory_text: memoryText.trim(),
        })
        .select(ALBUM_COLS).single();
      if (error) throw error;
      onItemAdded(data as AlbumItem);
      setMemoryText("");
      setMemorySheet(null);
      toast.success("Souvenir partagé ! 💖");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'envoi du souvenir");
    } finally {
      setSendingMemory(false);
    }
  };

  const handleSendMemoryAudio = async (blob: Blob, durationSec: number, mime: string) => {
    if (requireAuth()) return;
    setSendingMemory(true);
    try {
      const ext = mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm";
      const path = `${pageId}/audio-${user!.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("birthday-page-photos")
        .upload(path, blob, { contentType: mime });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("birthday-page-photos").getPublicUrl(path);
      const name = await getProfileName();
      const { data, error } = await supabase
        .from("birthday_page_photos")
        .insert({
          birthday_page_id: pageId,
          uploader_id: user!.id,
          uploader_name: name,
          image_url: null as unknown as string,
          media_type: "memory",
          memory_audio_url: urlData.publicUrl,
          memory_audio_duration: Math.max(1, Math.round(durationSec)),
        })
        .select(ALBUM_COLS).single();
      if (error) throw error;
      onItemAdded(data as AlbumItem);
      setMemorySheet(null);
      toast.success("Souvenir audio partagé ! 🎙️");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l'envoi du souvenir");
    } finally {
      setSendingMemory(false);
    }
  };

  const handleShareItem = (item: AlbumItem) => {
    const t = item.media_type === "memory"
      ? `Souvenir avec ${firstName}`
      : item.media_type === "video" ? `Vidéo souvenir de ${firstName}` : `Photo souvenir de ${firstName}`;
    shareAlbumItem({ slug, itemId: item.id, title: t });
  };

  const openCommentsOn = (item: AlbumItem) => {
    if (item.media_type === "memory") {
      setOpenMemoryId(item.id);
      return;
    }
    const ids = (mainTab === "favorites" ? favoriteItems : galleryItems).map((i) => i.id);
    const list = ids.includes(item.id) ? ids : items.map((i) => i.id);
    const idx = list.indexOf(item.id);
    setLightboxIds(list);
    setLightboxIndex(Math.max(0, idx));
    setLightboxShowComments(true);
    recordView(item.id);
  };

  // Delete
  const canManage = (item: AlbumItem) =>
    !!user && ((item.uploader_id && item.uploader_id === user.id) || (pageOwnerUserId === user.id));

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setDeleteInProgress(true);
    try {
      const url = deletingItem.video_url || deletingItem.image_url;
      if (url && deletingItem.media_type !== "memory") {
        const marker = "/birthday-page-photos/";
        const idx = url.indexOf(marker);
        if (idx !== -1) {
          const p = url.substring(idx + marker.length);
          await supabase.storage.from("birthday-page-photos").remove([p]);
        }
      }
      const { error } = await supabase
        .from("birthday_page_photos").delete().eq("id", deletingItem.id);
      if (error) throw error;
      onItemRemoved?.(deletingItem.id);
      toast.success("Supprimé");
      setDeletingItem(null);
      if (lightboxIds && lightboxIds.includes(deletingItem.id)) setLightboxIds(null);
    } catch {
      toast.error("Suppression refusée");
    } finally {
      setDeleteInProgress(false);
    }
  };

  // Set social cover
  const handleSetSocialCover = async (item: AlbumItem) => {
    if (item.media_type !== "image" || !item.image_url) {
      toast.error("Seules les photos peuvent servir d'image de partage");
      return;
    }
    const isSel = socialSharePhotoId === item.id;
    const newVal = isSel ? null : item.id;
    const { error } = await supabase
      .from("birthday_pages").update({ social_share_photo_id: newVal }).eq("id", pageId);
    if (error) { toast.error("Impossible de mettre à jour"); return; }
    onSocialSharePhotoChanged?.(newVal);
    supabase.functions.invoke("purge-birthday-og-cache", { body: { slug } }).catch(() => {});
    toast.success(isSel ? "Image de partage retirée" : "Image de partage mise à jour ✨");
  };

  const openLightbox = (ids: string[], index: number) => {
    setLightboxIds(ids);
    setLightboxIndex(index);
    recordView(ids[index]);
  };

  // Lightbox nav keyboard
  useEffect(() => {
    if (!lightboxIds) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIds(null);
      else if (e.key === "ArrowLeft") setLightboxIndex((i) => Math.max(0, i - 1));
      else if (e.key === "ArrowRight") setLightboxIndex((i) => Math.min((lightboxIds?.length ?? 1) - 1, i + 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIds]);

  useEffect(() => {
    if (lightboxIds) recordView(lightboxIds[lightboxIndex]);
  }, [lightboxIndex, lightboxIds, recordView]);

  const currentLightboxItem: AlbumItem | undefined = useMemo(() => {
    if (!lightboxIds) return undefined;
    const id = lightboxIds[lightboxIndex];
    return items.find((i) => i.id === id);
  }, [lightboxIds, lightboxIndex, items]);

  // ============== RENDER ==============

  const MAIN_TABS: { key: MainTab; label: string }[] = [
    { key: "gallery", label: "Galerie" },
    { key: "events", label: "Événements" },
    { key: "memories", label: "Souvenirs" },
    { key: "favorites", label: "Favoris" },
  ];

  const showSubFilter = mainTab === "gallery" || mainTab === "favorites" || (mainTab === "events" && !!selectedEvent);
  const showEventsSubFilter = mainTab === "events" && !selectedEvent;

  return (
    <Card className="p-5">
      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />

      <div className="flex items-center gap-2 mb-1">
        <BookOpen className="h-5 w-5 text-accent" />
        <h2 className="font-bold font-poppins">Album souvenir de {firstName}</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {pluralize(items.length, "souvenir partagé", "souvenirs partagés")}
      </p>

      {/* Quick add buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Button variant="outline" size="sm" className="flex-col h-auto py-3 gap-1 border-dashed"
          disabled={uploading}
          onClick={() => openUploadSheet("image")}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4 text-accent" />}
          <span className="text-[10px]">Photo</span>
        </Button>
        <Button variant="outline" size="sm" className="flex-col h-auto py-3 gap-1 border-dashed"
          disabled={uploading}
          onClick={() => openUploadSheet("video")}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4 text-primary" />}
          <span className="text-[10px]">Vidéo</span>
        </Button>
        <Button variant="outline" size="sm" className="flex-col h-auto py-3 gap-1 border-dashed"
          onClick={() => { if (!requireAuth()) setMemorySheet({ mode: "text" }); }}>
          <Quote className="h-4 w-4 text-heart" />
          <span className="text-[10px]">Souvenir</span>
        </Button>
      </div>

      {/* Main tabs - Flickr-like underline */}
      <div className="border-b border-border mb-4 -mx-1 px-1 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {MAIN_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setMainTab(t.key); setSelectedEvent(null); }}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors relative -mb-px border-b-2",
                mainTab === t.key
                  ? "text-foreground border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar + sub-filter row */}
      {(mainTab !== "memories") && (
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher" className="pl-8 h-9 text-sm" />
          </div>
        </div>
      )}

      {showSubFilter && (
        <div className="flex gap-1 mb-4">
          {(["all", "image", "video"] as MediaFilter[]).map((f) => (
            <Button key={f} size="sm" variant={mediaFilter === f ? "default" : "ghost"} className="text-xs"
              onClick={() => setMediaFilter(f)}>
              {f === "all" ? "Tout" : f === "image" ? <><Camera className="h-3 w-3 mr-1" /> Photos</> : <><Video className="h-3 w-3 mr-1" /> Vidéos</>}
            </Button>
          ))}
        </div>
      )}

      {/* === Body === */}
      {mainTab === "gallery" && (
        <MediaGrid items={galleryItems}
          favCounts={favCounts} myFavs={myFavs}
          reactions={reactions} commentCounts={commentCounts} user={user}
          onOpen={(idx) => openLightbox(galleryItems.map((i) => i.id), idx)}
          onToggleFav={toggleFavorite}
          onShare={handleShareItem}
          onComment={openCommentsOn}
          emptyLabel="Aucun média pour le moment."
        />
      )}

      {mainTab === "favorites" && (
        !user ? (
          <div className="text-center py-8">
            <Star className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Connecte-toi pour voir tes favoris</p>
            <Button size="sm" onClick={() => requireAuth()}>Se connecter</Button>
          </div>
        ) : (
          <MediaGrid items={favoriteItems}
            favCounts={favCounts} myFavs={myFavs}
            reactions={reactions} commentCounts={commentCounts} user={user}
            onOpen={(idx) => openLightbox(favoriteItems.map((i) => i.id), idx)}
            onToggleFav={toggleFavorite}
            onShare={handleShareItem}
            onComment={openCommentsOn}
            emptyLabel="Aucun favori pour le moment. Touche ★ sur un média pour le sauvegarder."
          />
        )
      )}

      {mainTab === "memories" && (
        <div className="space-y-3">
          <Button
            onClick={() => { if (!requireAuth()) setMemorySheet({ mode: "text" }); }}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" /> Ajouter un souvenir
          </Button>
          {memoryItems.length === 0 ? (
            <div className="text-center py-8">
              <Quote className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Aucun souvenir partagé pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {memoryItems.map((m) => (
                <MemoryCard
                  key={m.id}
                  item={{
                    id: m.id,
                    uploader_name: m.uploader_name,
                    memory_text: m.memory_text,
                    memory_audio_url: m.memory_audio_url ?? null,
                    memory_audio_duration: m.memory_audio_duration ?? null,
                    created_at: m.created_at,
                  }}
                  favCount={favCounts[m.id] || 0}
                  isFav={myFavs.has(m.id)}
                  reactionsTotal={Object.values(reactions[m.id]?.counts ?? {}).reduce((s, n) => s + n, 0)}
                  commentsCount={commentCounts[m.id] || 0}
                  canDelete={canManage(m)}
                  onOpen={() => setOpenMemoryId(m.id)}
                  onToggleFav={() => toggleFavorite(m)}
                  onShare={() => handleShareItem(m)}
                  onComment={() => setOpenMemoryId(m.id)}
                  onDelete={() => setDeletingItem(m)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {mainTab === "events" && !selectedEvent && (
        <EventsGrid
          eventsGrouped={eventsGrouped}
          mediaFilter={mediaFilter}
          onOpenEvent={(k) => setSelectedEvent(k)}
          onAddTo={(k, mode) => openUploadSheet(mode, k)}
        />
      )}

      {mainTab === "events" && selectedEvent && (
        <EventDetailView
          eventKind={selectedEvent}
          items={eventDetailItems}
          favCounts={favCounts} myFavs={myFavs} reactions={reactions} commentCounts={commentCounts}
          user={user}
          onBack={() => setSelectedEvent(null)}
          onOpen={(idx) => openLightbox(eventDetailItems.map((i) => i.id), idx)}
          onToggleFav={toggleFavorite}
          onShare={handleShareItem}
          onComment={openCommentsOn}
          onAdd={(mode) => openUploadSheet(mode, selectedEvent)}
        />
      )}

      {/* === Upload Sheet === */}
      <Sheet open={!!uploadSheet} onOpenChange={(v) => !v && setUploadSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>
              Ajouter {uploadSheet?.mode === "video" ? "une vidéo" : "une photo"}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <p className="text-xs text-muted-foreground">Classer dans un événement (optionnel) :</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setPendingEvent(null)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs border transition-colors",
                  !pendingEvent ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted",
                )}
              >
                Aucun
              </button>
              {ALBUM_EVENT_KINDS.map((k) => (
                <button key={k.key} onClick={() => setPendingEvent(k.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs border transition-colors",
                    pendingEvent === k.key ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted",
                  )}>
                  {k.emoji} {k.label}
                </button>
              ))}
            </div>
            <Button className="w-full" disabled={uploading} onClick={handlePickFile}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Choisir un fichier
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* === Memory Sheet (texte / audio) === */}
      <Sheet
        open={!!memorySheet}
        onOpenChange={(v) => {
          if (!v) { setMemorySheet(null); setMemoryText(""); }
        }}
      >
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Ajouter un souvenir</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-1 p-1 bg-muted rounded-full w-fit mx-auto">
              <button
                onClick={() => setMemoryMode("text")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1",
                  memoryMode === "text" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground",
                )}
              >
                <Quote className="h-3.5 w-3.5" /> Écrit
              </button>
              <button
                onClick={() => setMemoryMode("audio")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1",
                  memoryMode === "audio" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground",
                )}
              >
                <Mic className="h-3.5 w-3.5" /> Audio
              </button>
            </div>

            {memoryMode === "text" ? (
              <div className="space-y-3">
                <Textarea
                  value={memoryText}
                  onChange={(e) => setMemoryText(e.target.value)}
                  placeholder={`Raconte un souvenir avec ${firstName}…`}
                  rows={5}
                  maxLength={1500}
                  className="resize-none"
                />
                <Button
                  className="w-full"
                  disabled={!memoryText.trim() || sendingMemory}
                  onClick={handleSendMemoryText}
                >
                  {sendingMemory ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Partager le souvenir
                </Button>
              </div>
            ) : (
              <MemoryRecorder sending={sendingMemory} onSend={handleSendMemoryAudio} />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* === Memory detail dialog === */}
      <MemoryDetailDialog
        open={!!openMemoryId}
        onOpenChange={(v) => !v && setOpenMemoryId(null)}
        item={(() => {
          const m = items.find((i) => i.id === openMemoryId);
          if (!m) return null;
          return {
            id: m.id,
            uploader_id: m.uploader_id ?? null,
            uploader_name: m.uploader_name,
            memory_text: m.memory_text,
            memory_audio_url: m.memory_audio_url ?? null,
            memory_audio_duration: m.memory_audio_duration ?? null,
            created_at: m.created_at,
          };
        })()}
        user={user}
        pageOwnerUserId={pageOwnerUserId}
        favCount={openMemoryId ? (favCounts[openMemoryId] || 0) : 0}
        isFav={openMemoryId ? myFavs.has(openMemoryId) : false}
        reactionCounts={openMemoryId ? (reactions[openMemoryId]?.counts ?? {}) : {}}
        userReactions={openMemoryId ? (reactions[openMemoryId]?.userReactions ?? {}) : {}}
        canDelete={(() => {
          const m = items.find((i) => i.id === openMemoryId);
          return m ? canManage(m) : false;
        })()}
        onToggleFav={() => {
          const m = items.find((i) => i.id === openMemoryId);
          if (m) toggleFavorite(m);
        }}
        onShare={() => {
          const m = items.find((i) => i.id === openMemoryId);
          if (m) handleShareItem(m);
        }}
        onDelete={() => {
          const m = items.find((i) => i.id === openMemoryId);
          if (m) { setDeletingItem(m); setOpenMemoryId(null); }
        }}
        onReactionToggle={handleReactionToggle}
        onRequireAuth={() => requireAuth()}
      />

      {/* === Lightbox === */}
      <AnimatePresence>
        {currentLightboxItem && lightboxIds && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
            onClick={() => setLightboxIds(null)}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between p-3 text-white" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setLightboxIds(null)}>
                <X className="h-5 w-5" />
              </Button>
              <div className="text-xs text-white/70">{lightboxIndex + 1} / {lightboxIds.length}</div>
              {canManage(currentLightboxItem) ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {currentLightboxItem.media_type === "image" && pageOwnerUserId === user?.id && (
                      <DropdownMenuItem onClick={() => handleSetSocialCover(currentLightboxItem)}>
                        <Share2 className="h-4 w-4 mr-2" />
                        {socialSharePhotoId === currentLightboxItem.id ? "Retirer image de partage" : "Image de partage"}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeletingItem(currentLightboxItem)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : <div className="w-9" />}
            </div>

            {/* Media */}
            <div className="flex-1 flex items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
              {lightboxIndex > 0 && (
                <Button variant="ghost" size="icon" className="absolute left-2 text-white hover:bg-white/10 h-12 w-12 rounded-full bg-black/40"
                  onClick={() => setLightboxIndex((i) => i - 1)}>
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              {lightboxIndex < lightboxIds.length - 1 && (
                <Button variant="ghost" size="icon" className="absolute right-2 text-white hover:bg-white/10 h-12 w-12 rounded-full bg-black/40"
                  onClick={() => setLightboxIndex((i) => i + 1)}>
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}
              {currentLightboxItem.media_type === "image" && (
                <img src={currentLightboxItem.image_url} alt={currentLightboxItem.caption || ""} className="max-w-full max-h-[70vh] object-contain" />
              )}
              {currentLightboxItem.media_type === "video" && (
                <video src={currentLightboxItem.video_url || currentLightboxItem.image_url} controls autoPlay className="max-w-full max-h-[70vh]" />
              )}
            </div>

            {/* Bottom action bar */}
            <div className="p-3 text-white" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <button onClick={() => toggleFavorite(currentLightboxItem)}
                  className="flex items-center gap-1.5 text-sm">
                  <Star className={cn("h-5 w-5", myFavs.has(currentLightboxItem.id) ? "fill-yellow-400 text-yellow-400" : "text-white")} />
                  <span>{favCounts[currentLightboxItem.id] || 0}</span>
                </button>
                <button
                  onClick={() => setLightboxShowComments((v) => !v)}
                  className={cn(
                    "flex items-center gap-1.5 text-sm",
                    lightboxShowComments ? "text-white" : "text-white/70 hover:text-white",
                  )}
                  aria-label="Commentaires"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>{commentCounts[currentLightboxItem.id] || 0}</span>
                </button>
                <button
                  onClick={() => handleShareItem(currentLightboxItem)}
                  className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
                  aria-label="Partager"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                <a href={currentLightboxItem.video_url || currentLightboxItem.image_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm">
                  <Download className="h-5 w-5" />
                </a>
                <div className="text-xs text-white/60">👁 {currentLightboxItem.view_count}</div>
              </div>
              <AlbumItemReactions
                photoId={currentLightboxItem.id}
                userId={user?.id || null}
                counts={reactions[currentLightboxItem.id]?.counts ?? {}}
                userReactions={reactions[currentLightboxItem.id]?.userReactions ?? {}}
                onToggle={handleReactionToggle}
              />
              {currentLightboxItem.uploader_name && (
                <p className="text-xs text-white/60 mt-2">— {currentLightboxItem.uploader_name}</p>
              )}
              {lightboxShowComments && (
                <div className="mt-3 max-h-[40vh] overflow-y-auto rounded-lg bg-white/5 p-3 border border-white/10">
                  <PhotoCommentsPanel
                    photoId={currentLightboxItem.id}
                    user={user}
                    pageOwnerUserId={pageOwnerUserId}
                    authorName={null}
                    onRequireAuth={() => requireAuth()}
                    variant="dark"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <Dialog open={!!deletingItem} onOpenChange={(v) => !v && setDeletingItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Supprimer ce souvenir ?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Cette action est irréversible.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setDeletingItem(null)}>Annuler</Button>
            <Button variant="destructive" disabled={deleteInProgress} onClick={handleConfirmDelete}>
              {deleteInProgress ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ============================================================
// Sub-components
// ============================================================

function MediaTile({
  item, index, favCount, isFav, reactionCounts, commentsCount,
  onOpen, onToggleFav, onShare, onComment,
}: {
  item: AlbumItem;
  index: number;
  favCount: number;
  isFav: boolean;
  reactionCounts: ReactionCounts;
  commentsCount: number;
  onOpen: () => void;
  onToggleFav: () => void;
  onShare: () => void;
  onComment: () => void;
}) {
  const totalReactions = Object.values(reactionCounts).reduce((s, n) => s + n, 0);
  const isAboveFold = index < 4;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="group flex flex-col"
    >
      <button onClick={onOpen} className="relative w-full overflow-hidden bg-muted">
        {item.media_type === "image" ? (
          <img src={item.image_url} alt={item.caption || ""}
            className="w-full aspect-[4/3] object-cover group-hover:scale-[1.02] transition-transform"
            loading={isAboveFold ? "eager" : "lazy"} decoding="async" />
        ) : (
          <>
            {item.video_thumbnail_url ? (
              <img src={item.video_thumbnail_url} alt="" className="w-full aspect-[4/3] object-cover" loading="lazy" />
            ) : (
              <div className="w-full aspect-[4/3] bg-black" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="h-6 w-6 text-primary fill-primary ml-0.5" />
              </div>
            </div>
          </>
        )}
      </button>
      <div className="flex items-center justify-between px-1 py-2 gap-1">
        <div className="text-xs text-foreground truncate flex-1">
          {item.caption || item.uploader_name || "Souvenir"}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <button onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
            className="flex items-center gap-0.5 hover:text-foreground px-1 py-0.5">
            <Star className={cn("h-3.5 w-3.5", isFav ? "fill-yellow-400 text-yellow-400" : "")} />
            <span>{favCount}</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onComment(); }}
            className="flex items-center gap-0.5 hover:text-foreground px-1 py-0.5" aria-label="Commenter">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>{commentsCount || totalReactions}</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onShare(); }}
            className="hover:text-foreground px-1 py-0.5" aria-label="Partager">
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function MediaGrid({
  items, favCounts, myFavs, reactions, commentCounts, user, onOpen, onToggleFav, onShare, onComment, emptyLabel,
}: {
  items: AlbumItem[];
  favCounts: Record<string, number>;
  myFavs: Set<string>;
  reactions: Record<string, { counts: ReactionCounts; userReactions: UserReactions }>;
  commentCounts: Record<string, number>;
  user: User | null;
  onOpen: (index: number) => void;
  onToggleFav: (item: AlbumItem) => void;
  onShare: (item: AlbumItem) => void;
  onComment: (item: AlbumItem) => void;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <Camera className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((item, idx) => (
        <MediaTile
          key={item.id}
          item={item}
          index={idx}
          favCount={favCounts[item.id] || 0}
          isFav={myFavs.has(item.id)}
          reactionCounts={reactions[item.id]?.counts ?? {}}
          commentsCount={commentCounts[item.id] || 0}
          onOpen={() => onOpen(idx)}
          onToggleFav={() => onToggleFav(item)}
          onShare={() => onShare(item)}
          onComment={() => onComment(item)}
        />
      ))}
    </div>
  );
}

function EventsGrid({
  eventsGrouped, mediaFilter, onOpenEvent, onAddTo,
}: {
  eventsGrouped: Map<AlbumEventKind, AlbumItem[]>;
  mediaFilter: MediaFilter;
  onOpenEvent: (k: AlbumEventKind) => void;
  onAddTo: (k: AlbumEventKind, mode: "image" | "video") => void;
}) {
  // Always show all known event kinds so "+" exists even when empty
  return (
    <div className="grid grid-cols-2 gap-3">
      {ALBUM_EVENT_KINDS.map((kind) => {
        const all = eventsGrouped.get(kind.key) ?? [];
        const filtered = mediaFilter === "all" ? all : all.filter((i) => i.media_type === mediaFilter);
        const cover = filtered[0] ?? all[0];
        const photoCount = all.filter((i) => i.media_type === "image").length;
        const videoCount = all.filter((i) => i.media_type === "video").length;
        const views = all.reduce((s, i) => s + (i.view_count || 0), 0);
        return (
          <div key={kind.key} className="relative group">
            <button
              onClick={() => onOpenEvent(kind.key)}
              className="block w-full aspect-square rounded-xl overflow-hidden bg-muted relative shadow-card"
            >
              {cover ? (
                cover.media_type === "image" ? (
                  <img src={cover.image_url} alt={kind.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                ) : (
                  <>
                    <img src={cover.video_thumbnail_url || ""} alt={kind.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="h-5 w-5 text-primary fill-primary ml-0.5" />
                      </div>
                    </div>
                  </>
                )
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/15 via-accent/15 to-secondary/40 flex items-center justify-center">
                  <span className="text-4xl">{kind.emoji}</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 text-left">
                <p className="text-white font-semibold text-sm font-poppins leading-tight">
                  {kind.label}
                </p>
                <p className="text-white/80 text-[10px] mt-0.5">
                  {photoCount} photo{photoCount !== 1 ? "s" : ""} · {videoCount} vidéo{videoCount !== 1 ? "s" : ""} · {views} vue{views !== 1 ? "s" : ""}
                </p>
              </div>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-md">
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAddTo(kind.key, "image")}>
                  <Camera className="h-4 w-4 mr-2" /> Ajouter une photo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddTo(kind.key, "video")}>
                  <Video className="h-4 w-4 mr-2" /> Ajouter une vidéo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}
    </div>
  );
}

function EventDetailView({
  eventKind, items, favCounts, myFavs, reactions, commentCounts, user, onBack, onOpen, onToggleFav, onShare, onComment, onAdd,
}: {
  eventKind: AlbumEventKind;
  items: AlbumItem[];
  favCounts: Record<string, number>;
  myFavs: Set<string>;
  reactions: Record<string, { counts: ReactionCounts; userReactions: UserReactions }>;
  commentCounts: Record<string, number>;
  user: User | null;
  onBack: () => void;
  onOpen: (index: number) => void;
  onToggleFav: (item: AlbumItem) => void;
  onShare: (item: AlbumItem) => void;
  onComment: (item: AlbumItem) => void;
  onAdd: (mode: "image" | "video") => void;
}) {
  const photoCount = items.filter((i) => i.media_type === "image").length;
  const videoCount = items.filter((i) => i.media_type === "video").length;
  const totalViews = items.reduce((s, i) => s + (i.view_count || 0), 0);
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAdd("image")}>
              <Camera className="h-4 w-4 mr-2" /> Photo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAdd("video")}>
              <Video className="h-4 w-4 mr-2" /> Vidéo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="text-center mb-4">
        <h3 className="text-3xl font-bold font-poppins">{getEventEmoji(eventKind)} {getEventLabel(eventKind)}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {photoCount} photo{photoCount !== 1 ? "s" : ""} · {videoCount} vidéo{videoCount !== 1 ? "s" : ""} · {totalViews} vue{totalViews !== 1 ? "s" : ""}
        </p>
      </div>
      <MediaGrid items={items}
        favCounts={favCounts} myFavs={myFavs} reactions={reactions} commentCounts={commentCounts} user={user}
        onOpen={onOpen} onToggleFav={onToggleFav} onShare={onShare} onComment={onComment}
        emptyLabel="Aucun média dans cet événement. Ajoute-en avec le bouton +."
      />
    </div>
  );
}