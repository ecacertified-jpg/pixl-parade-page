import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Video, BookOpen, ImagePlus, Play, X, Loader2, Sparkles, Send, Quote } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface AlbumItem {
  id: string;
  uploader_name: string | null;
  image_url: string;
  caption: string | null;
  created_at: string;
  media_type: string;
  video_url: string | null;
  video_thumbnail_url: string | null;
  memory_text: string | null;
}

interface EventAlbumProps {
  eventPageId: string;
  slug: string;
  title: string;
  user: User | null;
  items: AlbumItem[];
  onItemAdded: (item: AlbumItem) => void;
}

type TabType = "all" | "image" | "video" | "memory";

export function EventAlbum({ eventPageId, slug, title, user, items, onItemAdded }: EventAlbumProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [uploading, setUploading] = useState(false);
  const [showMemoryForm, setShowMemoryForm] = useState(false);
  const [memoryText, setMemoryText] = useState("");
  const [sendingMemory, setSendingMemory] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<AlbumItem | null>(null);

  const counts = {
    image: items.filter(i => i.media_type === "image").length,
    video: items.filter(i => i.media_type === "video").length,
    memory: items.filter(i => i.media_type === "memory").length,
  };

  const filtered = activeTab === "all" ? items : items.filter(i => i.media_type === activeTab);

  const requireAuth = () => {
    if (!user) {
      const returnTo = `${location.pathname}${location.search}`;
      navigate(`/auth?tab=signup&returnTo=${encodeURIComponent(returnTo)}&intent=upload_media&invited=true`);
      return true;
    }
    return false;
  };

  const getProfileName = async () => {
    if (!user) return "Un ami";
    const { data } = await supabase.from("profiles").select("first_name").eq("user_id", user.id).single();
    return data?.first_name || "Un ami";
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (requireAuth()) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${eventPageId}/${user!.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("event-page-photos").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("event-page-photos").getPublicUrl(path);
      const name = await getProfileName();
      const { data, error } = await supabase.from("event_page_photos").insert({
        event_page_id: eventPageId, uploader_id: user!.id, uploader_name: name, image_url: urlData.publicUrl, media_type: "image",
      }).select("id, uploader_name, image_url, caption, created_at, media_type, video_url, video_thumbnail_url, memory_text").single();
      if (error) throw error;
      onItemAdded(data as AlbumItem);
      toast.success("Photo ajoutée ! 📸");
    } catch { toast.error("Erreur lors de l'upload de la photo"); } finally { setUploading(false); if (photoInputRef.current) photoInputRef.current.value = ""; }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (requireAuth()) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error("La vidéo ne doit pas dépasser 50 Mo"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${eventPageId}/vid-${user!.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("event-page-photos").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("event-page-photos").getPublicUrl(path);
      const name = await getProfileName();
      const { data, error } = await supabase.from("event_page_photos").insert({
        event_page_id: eventPageId, uploader_id: user!.id, uploader_name: name, image_url: urlData.publicUrl, video_url: urlData.publicUrl, media_type: "video",
      }).select("id, uploader_name, image_url, caption, created_at, media_type, video_url, video_thumbnail_url, memory_text").single();
      if (error) throw error;
      onItemAdded(data as AlbumItem);
      toast.success("Vidéo ajoutée ! 🎬");
    } catch { toast.error("Erreur lors de l'upload de la vidéo"); } finally { setUploading(false); if (videoInputRef.current) videoInputRef.current.value = ""; }
  };

  const handleSendMemory = async () => {
    if (requireAuth()) return;
    if (!memoryText.trim()) return;
    setSendingMemory(true);
    try {
      const name = await getProfileName();
      const { data, error } = await supabase.from("event_page_photos").insert({
        event_page_id: eventPageId, uploader_id: user!.id, uploader_name: name, image_url: "memory", media_type: "memory", memory_text: memoryText.trim(),
      }).select("id, uploader_name, image_url, caption, created_at, media_type, video_url, video_thumbnail_url, memory_text").single();
      if (error) throw error;
      onItemAdded(data as AlbumItem);
      setMemoryText("");
      setShowMemoryForm(false);
      toast.success("Souvenir partagé ! 💫");
    } catch { toast.error("Erreur lors de l'envoi du souvenir"); } finally { setSendingMemory(false); }
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "all", label: "Tout", icon: <Sparkles className="h-3.5 w-3.5" />, count: items.length },
    { key: "image", label: "Photos", icon: <Camera className="h-3.5 w-3.5" />, count: counts.image },
    { key: "video", label: "Vidéos", icon: <Video className="h-3.5 w-3.5" />, count: counts.video },
    { key: "memory", label: "Souvenirs", icon: <BookOpen className="h-3.5 w-3.5" />, count: counts.memory },
  ];

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Camera className="h-5 w-5 text-primary" />
        <h2 className="font-bold font-poppins">Album souvenir</h2>
        <span className="text-xs text-muted-foreground ml-auto">{items.length}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${activeTab === tab.key ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {tab.icon} {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-4">
        <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => photoInputRef.current?.click()} disabled={uploading}>
          <ImagePlus className="h-3.5 w-3.5 mr-1" /> Photo
        </Button>
        <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => videoInputRef.current?.click()} disabled={uploading}>
          <Video className="h-3.5 w-3.5 mr-1" /> Vidéo
        </Button>
        <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => { if (requireAuth()) return; setShowMemoryForm(!showMemoryForm); }}>
          <Quote className="h-3.5 w-3.5 mr-1" /> Souvenir
        </Button>
      </div>

      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />

      {uploading && (
        <div className="flex items-center justify-center py-4 gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Upload en cours...
        </div>
      )}

      {/* Memory form */}
      <AnimatePresence>
        {showMemoryForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
            <div className="p-3 bg-muted/50 rounded-xl space-y-2">
              <Textarea value={memoryText} onChange={(e) => setMemoryText(e.target.value)} placeholder="Partage un souvenir..." className="resize-none min-h-[80px] text-sm" maxLength={500} />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" disabled={!memoryText.trim() || sendingMemory} onClick={handleSendMemory}>
                  {sendingMemory ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />} Envoyer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowMemoryForm(false)}><X className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <AnimatePresence>
          {filtered.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group" onClick={() => setLightboxItem(item)}>
              {item.media_type === "memory" ? (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex flex-col items-center justify-center p-3 text-center">
                  <BookOpen className="h-5 w-5 text-primary mb-1" />
                  <p className="text-xs text-foreground line-clamp-4 font-nunito">{item.memory_text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{item.uploader_name}</p>
                </div>
              ) : item.media_type === "video" ? (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  {item.video_thumbnail_url ? <img src={item.video_thumbnail_url} alt="" className="w-full h-full object-cover" /> : <Play className="h-8 w-8 text-muted-foreground" />}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20"><Play className="h-8 w-8 text-white drop-shadow" /></div>
                </div>
              ) : (
                <img src={item.image_url} alt={item.caption || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                <p className="text-[10px] text-white truncate">{item.uploader_name || 'Un ami'}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8">
          <Camera className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Aucun élément dans l'album. Ajoute le premier !</p>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxItem(null)}>
            <button className="absolute top-4 right-4 text-white z-10" onClick={() => setLightboxItem(null)}><X className="h-6 w-6" /></button>
            <div className="max-w-lg w-full max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
              {lightboxItem.media_type === "video" && lightboxItem.video_url ? (
                <video src={lightboxItem.video_url} controls autoPlay className="w-full max-h-[70vh] rounded-lg" />
              ) : lightboxItem.media_type === "memory" ? (
                <div className="bg-card p-8 rounded-2xl text-center">
                  <BookOpen className="h-8 w-8 text-primary mx-auto mb-4" />
                  <p className="text-lg font-nunito text-foreground">{lightboxItem.memory_text}</p>
                  <p className="text-sm text-muted-foreground mt-4">— {lightboxItem.uploader_name || 'Un ami'}</p>
                </div>
              ) : (
                <img src={lightboxItem.image_url} alt="" className="w-full max-h-[70vh] object-contain rounded-lg" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
