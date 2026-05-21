import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, Trash2, Video as VideoIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  SCHEDULE_KIND_LABELS,
  type CoverVideoScheduleKind,
} from "@/utils/coverVideoSchedule";
import { getVideoMetadata } from "@/utils/videoValidation";
import { extractSingleThumbnail } from "@/utils/videoThumbnails";

const USER_KINDS: CoverVideoScheduleKind[] = [
  "greeting_morning",
  "greeting_afternoon",
  "greeting_evening",
  "greeting_night",
  "calendar_event",
  "birthday_day",
];

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_SECONDS = 30;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  birthdayPageId: string;
}

export function CoverVideosManagerSheet({ open, onOpenChange, birthdayPageId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [uploadingKind, setUploadingKind] = useState<CoverVideoScheduleKind | null>(null);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["birthday-page-cover-videos", birthdayPageId],
    enabled: open && !!birthdayPageId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("birthday_page_cover_videos")
        .select("id, schedule_kind, video_url, poster_url, is_active, display_order")
        .eq("birthday_page_id", birthdayPageId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleUpload = async (kind: CoverVideoScheduleKind, file: File) => {
    if (!user) return;
    if (file.size > MAX_BYTES) {
      toast.error("Vidéo trop lourde (max 25 Mo)");
      return;
    }
    setUploadingKind(kind);
    try {
      const meta = await getVideoMetadata(file);
      if (meta.duration > MAX_SECONDS) {
        toast.error(`Vidéo trop longue (max ${MAX_SECONDS}s)`);
        return;
      }
      const ext = file.name.split(".").pop() || "mp4";
      const path = `birthday-pages/${user.id}/cover-videos/${birthdayPageId}-${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("assets")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("assets").getPublicUrl(path);

      // Generate poster from local file
      let posterUrl: string | null = null;
      try {
        const blobUrl = URL.createObjectURL(file);
        const dataUrl = await extractSingleThumbnail(blobUrl, Math.min(1, meta.duration / 2));
        URL.revokeObjectURL(blobUrl);
        // Convert data URL to blob and upload
        const resp = await fetch(dataUrl);
        const blob = await resp.blob();
        const posterPath = `${path.replace(/\.[^.]+$/, "")}-poster.jpg`;
        const { error: pErr } = await supabase.storage
          .from("assets")
          .upload(posterPath, blob, { contentType: "image/jpeg", upsert: true });
        if (!pErr) {
          posterUrl = supabase.storage.from("assets").getPublicUrl(posterPath).data.publicUrl;
        }
      } catch {
        // poster optional
      }

      const { error: insErr } = await supabase.from("birthday_page_cover_videos").insert({
        birthday_page_id: birthdayPageId,
        user_id: user.id,
        schedule_kind: kind,
        video_url: pub.publicUrl,
        poster_url: posterUrl,
        is_active: true,
      });
      if (insErr) throw insErr;

      toast.success("Vidéo ajoutée 🎉");
      qc.invalidateQueries({ queryKey: ["birthday-page-cover-videos", birthdayPageId] });
    } catch (e) {
      console.error(e);
      toast.error("Échec de l'upload");
    } finally {
      setUploadingKind(null);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("birthday_page_cover_videos").delete().eq("id", id);
    if (error) {
      toast.error("Suppression impossible");
      return;
    }
    toast.success("Vidéo supprimée");
    qc.invalidateQueries({ queryKey: ["birthday-page-cover-videos", birthdayPageId] });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[88vh] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Vidéos de couverture</SheetTitle>
          <SheetDescription>
            Personnalise les vidéos qui défilent en haut de ta page selon le moment de la journée et les fêtes.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(88vh-90px)] p-4">
          <div className="space-y-3 max-w-lg mx-auto">
            {isLoading && <Loader2 className="h-6 w-6 animate-spin mx-auto" />}
            {USER_KINDS.map((kind) => {
              const ones = videos.filter((v) => v.schedule_kind === kind);
              return (
                <Card key={kind} className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-poppins font-semibold text-sm">{SCHEDULE_KIND_LABELS[kind]}</p>
                      <p className="text-xs text-muted-foreground">
                        {ones.length ? `${ones.length} vidéo(s) personnalisée(s)` : "Vidéo par défaut utilisée"}
                      </p>
                    </div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/webm"
                        className="hidden"
                        disabled={uploadingKind !== null}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUpload(kind, f);
                          e.target.value = "";
                        }}
                      />
                      <Button size="sm" variant="outline" asChild disabled={uploadingKind !== null}>
                        <span>
                          {uploadingKind === kind ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          ) : (
                            <Upload className="h-3.5 w-3.5 mr-1" />
                          )}
                          Uploader
                        </span>
                      </Button>
                    </label>
                  </div>
                  {ones.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {ones.map((v) => (
                        <div key={v.id} className="relative aspect-video bg-black rounded overflow-hidden">
                          {v.poster_url ? (
                            <img src={v.poster_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/50">
                              <VideoIcon className="h-6 w-6" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(v.id)}
                            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                            aria-label="Supprimer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
            <p className="text-[11px] text-muted-foreground pt-2 text-center">
              MP4 / MOV / WebM · max 25 Mo · 30s max
            </p>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}