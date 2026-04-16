import { useRef, useState } from "react";
import { Camera, Video, PenLine, Wallet, Gift, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FeedPage } from "@/hooks/usePagesFeed";

interface FeedCardActionsProps {
  page: FeedPage;
  onMediaUploaded?: () => void;
}

const ACTION_BUTTONS = [
  { key: "photo", icon: Camera, label: "Photo" },
  { key: "video", icon: Video, label: "Vidéo" },
  { key: "souvenir", icon: PenLine, label: "Souvenir" },
  { key: "cagnotte", icon: Wallet, label: "Cagnotte" },
  { key: "cadeau", icon: Gift, label: "Cadeau" },
  { key: "voir", icon: Eye, label: "Voir" },
] as const;

export function FeedCardActions({ page, onMediaUploaded }: FeedCardActionsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [showMemory, setShowMemory] = useState(false);
  const [memoryText, setMemoryText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sendingMemory, setSendingMemory] = useState(false);

  const requireAuth = () => {
    if (!user) {
      const currentPath = window.location.pathname;
      navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
      return true;
    }
    return false;
  };

  const pageUrl = page.type === "birthday" ? `/birthday/${page.slug}` : `/event/${page.slug}`;

  const handleUpload = async (file: File, mediaType: "photo" | "video") => {
    if (requireAuth()) return;
    setUploading(true);
    try {
      const bucket = page.type === "birthday" ? "birthday-page-photos" : "event-page-photos";
      const ext = file.name.split(".").pop();
      const filePath = `${page.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      if (page.type === "birthday") {
        const row: any = {
          birthday_page_id: page.id,
          image_url: publicUrl,
          uploader_id: user!.id,
          media_type: mediaType === "video" ? "video" : "image",
          ...(mediaType === "video" ? { video_url: publicUrl } : {}),
        };
        const { error: insertError } = await supabase.from("birthday_page_photos").insert(row);
        if (insertError) throw insertError;
      } else {
        const row: any = {
          event_page_id: page.id,
          image_url: publicUrl,
          uploader_id: user!.id,
          media_type: mediaType === "video" ? "video" : "image",
          ...(mediaType === "video" ? { video_url: publicUrl } : {}),
        };
        const { error: insertError } = await supabase.from("event_page_photos").insert(row);
        if (insertError) throw insertError;
      }

      toast.success(mediaType === "photo" ? "Photo ajoutée ! 📸" : "Vidéo ajoutée ! 🎥");
      onMediaUploaded?.();
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setUploading(false);
    }
  };

  const handleSendMemory = async () => {
    if (requireAuth()) return;
    if (!memoryText.trim()) return;
    setSendingMemory(true);
    try {
      if (page.type === "birthday") {
        const { error } = await supabase.from("birthday_page_photos").insert({
          birthday_page_id: page.id,
          image_url: "",
          uploader_id: user!.id,
          media_type: "text",
          memory_text: memoryText.trim(),
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_page_photos").insert({
          event_page_id: page.id,
          image_url: "",
          uploader_id: user!.id,
          media_type: "text",
          memory_text: memoryText.trim(),
        });
        if (error) throw error;
      }

      toast.success("Souvenir partagé ! ✍️");
      setMemoryText("");
      setShowMemory(false);
      onMediaUploaded?.();
    } catch (err: any) {
      console.error("Memory error:", err);
      toast.error("Erreur lors de l'envoi du souvenir");
    } finally {
      setSendingMemory(false);
    }
  };

  const handleAction = (key: string) => {
    switch (key) {
      case "photo":
        if (!requireAuth()) photoInputRef.current?.click();
        break;
      case "video":
        if (!requireAuth()) videoInputRef.current?.click();
        break;
      case "souvenir":
        if (!requireAuth()) setShowMemory((v) => !v);
        break;
      case "cagnotte":
        if (page.fund_id) navigate(`/f/${page.fund_id}`);
        else navigate(pageUrl);
        break;
      case "cadeau":
        navigate(pageUrl);
        break;
      case "voir":
        navigate(pageUrl);
        break;
    }
  };

  const visibleButtons = ACTION_BUTTONS.filter((b) => {
    if (b.key === "cagnotte" && !page.fund) return false;
    return true;
  });

  return (
    <div className="px-4 pb-4 space-y-2">
      <div className="flex items-center justify-around gap-1">
        {visibleButtons.map((btn) => (
          <motion.button
            key={btn.key}
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              handleAction(btn.key);
            }}
            disabled={uploading}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl bg-muted/60 hover:bg-primary/10 transition-colors min-w-[48px] disabled:opacity-50"
          >
            <btn.icon className="h-4.5 w-4.5 text-foreground/70" />
            <span className="text-[10px] text-muted-foreground font-medium">{btn.label}</span>
          </motion.button>
        ))}
      </div>

      {showMemory && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2"
        >
          <Textarea
            placeholder="Écrivez un souvenir..."
            value={memoryText}
            onChange={(e) => setMemoryText(e.target.value)}
            className="min-h-[60px] text-sm resize-none"
            maxLength={500}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowMemory(false); setMemoryText(""); }}
              className="h-7 text-xs"
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleSendMemory}
              disabled={!memoryText.trim() || sendingMemory}
              className="h-7 text-xs"
            >
              {sendingMemory ? "Envoi..." : "Envoyer"}
            </Button>
          </div>
        </motion.div>
      )}

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUpload(f, "photo");
          e.target.value = "";
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUpload(f, "video");
          e.target.value = "";
        }}
      />
    </div>
  );
}
