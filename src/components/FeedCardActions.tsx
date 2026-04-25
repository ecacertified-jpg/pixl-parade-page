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
import { GiftPromiseModal } from "@/components/GiftPromiseModal";

interface FeedCardActionsProps {
  page: FeedPage;
  onMediaUploaded?: () => void;
}

const ACTION_BUTTONS = [
  { key: "photo", icon: Camera, label: "Photo", countKey: "photo_count" },
  { key: "video", icon: Video, label: "Vidéo", countKey: "video_count" },
  { key: "souvenir", icon: PenLine, label: "Souvenir", countKey: "memory_count" },
  { key: "cagnotte", icon: Wallet, label: "Cagnotte", countKey: null },
  { key: "cadeau", icon: Gift, label: "Promesse", countKey: "gift_promise_count" },
  { key: "voir", icon: Eye, label: "Voir", countKey: null },
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
  const [showGiftPromise, setShowGiftPromise] = useState(false);

  const requireAuth = () => {
    if (!user) {
      const currentPath = window.location.pathname;
      navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
      return true;
    }
    return false;
  };

  const pageUrl = page.type === "birthday" ? `/birthday/${page.slug}` : `/event/${page.slug}`;

  const notifyPageActivity = async (
    actionType: 'photo' | 'video' | 'memory' | 'gift_promise' | 'contribution',
    extra?: { amount?: number; currency?: string }
  ) => {
    if (page.type !== 'birthday') return;
    try {
      await supabase.functions.invoke('notify-birthday-page-activity', {
        body: {
          birthdayPageId: page.id,
          actorUserId: user!.id,
          actionType,
          ...(extra || {}),
        },
      });
    } catch (err) {
      console.warn('notify-birthday-page-activity failed:', err);
    }
  };

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
      void notifyPageActivity(mediaType === 'video' ? 'video' : 'photo');
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
      void notifyPageActivity('memory');
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
        if (!requireAuth()) setShowGiftPromise(true);
        break;
      case "voir":
        navigate(pageUrl, { state: { fromFeed: true } });
        break;
    }
  };

  const handleGiftPromiseConfirm = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from("page_gift_promises" as any).insert({
        user_id: user.id,
        page_id: page.id,
        page_type: page.type,
        page_owner_id: page.creator.user_id,
      });
      if (error) throw error;
      toast.success("Promesse de cadeau enregistrée ! 🎁");
      void notifyPageActivity('gift_promise');
    } catch (err: any) {
      if (err?.code === "23505") {
        toast.info("Vous avez déjà promis un cadeau pour cette page !");
      } else {
        console.error("Gift promise error:", err);
        toast.error("Erreur lors de l'enregistrement de la promesse");
      }
    }
  };

  const creatorName = [page.creator.first_name, page.creator.last_name].filter(Boolean).join(" ") || "Utilisateur";
  const occasion = page.type === "birthday" ? "anniversaire" : page.occasion || "événement";

  const visibleButtons = ACTION_BUTTONS.filter((b) => {
    if (b.key === "cagnotte" && !page.fund) return false;
    return true;
  });

  const getCount = (countKey: string | null): number => {
    if (!countKey) return 0;
    return (page as any)[countKey] || 0;
  };

  return (
    <div className="px-4 pb-4 space-y-2">
      <div className="flex items-center justify-around gap-1">
        {visibleButtons.map((btn) => {
          const count = getCount(btn.countKey);
          return (
            <motion.button
              key={btn.key}
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                e.stopPropagation();
                handleAction(btn.key);
              }}
              disabled={uploading}
              className="relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl bg-muted/60 hover:bg-primary/10 transition-colors min-w-[48px] disabled:opacity-50"
            >
              <btn.icon className="h-4.5 w-4.5 text-foreground/70" />
              <span className="text-[10px] text-muted-foreground font-medium">{btn.label}</span>
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </motion.button>
          );
        })}
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

      <GiftPromiseModal
        open={showGiftPromise}
        onOpenChange={setShowGiftPromise}
        onConfirm={handleGiftPromiseConfirm}
        authorName={creatorName}
        occasion={occasion}
      />
    </div>
  );
}
