import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, Trash2, Video as VideoIcon, Eye, EyeOff, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  SCHEDULE_KIND_LABELS,
  type CoverVideoScheduleKind,
} from "@/utils/coverVideoSchedule";
import { extractSingleThumbnail } from "@/utils/videoThumbnails";
import { prepareCoverVideoForUpload } from "@/utils/prepareCoverVideo";
import { CALENDAR_EVENT_PRESETS, findEventPreset } from "@/data/calendarEvents";

const USER_KINDS: CoverVideoScheduleKind[] = [
  "greeting_morning",
  "greeting_afternoon",
  "greeting_evening",
  "greeting_night",
  "calendar_event",
  "birthday_day",
];

const LOW_VIEW_THRESHOLD = 3;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  birthdayPageId: string;
}

export function CoverVideosManagerSheet({ open, onOpenChange, birthdayPageId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [uploadingKind, setUploadingKind] = useState<CoverVideoScheduleKind | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  // Calendar event picker state (controls the "Fête calendaire" upload row)
  const [eventKey, setEventKey] = useState<string>("");
  const [eventMonth, setEventMonth] = useState<string>("");
  const [eventDay, setEventDay] = useState<string>("");

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["birthday-page-cover-videos", birthdayPageId],
    enabled: open && !!birthdayPageId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("birthday_page_cover_videos")
        .select("id, schedule_kind, video_url, poster_url, is_active, display_order, event_key, event_label, calendar_month, calendar_day")
        .eq("birthday_page_id", birthdayPageId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  // Per-video view counts for the owner
  const { data: viewCounts = {} } = useQuery({
    queryKey: ["bp-cover-video-views", user?.id, videos.map((v) => v.id).join(",")],
    enabled: !!user?.id && videos.length > 0,
    queryFn: async () => {
      const ids = videos.map((v) => v.id);
      const { data, error } = await (supabase as any)
        .from("birthday_page_cover_video_views")
        .select("video_id, view_count")
        .eq("owner_id", user!.id)
        .in("video_id", ids);
      if (error) throw error;
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        map[r.video_id] = r.view_count ?? 0;
      });
      return map;
    },
  });

  const viewCount = (id: string) => viewCounts[id] ?? 0;

  const lowViewVideos = videos.filter((v) => viewCount(v.id) <= LOW_VIEW_THRESHOLD);

  const handleUpload = async (kind: CoverVideoScheduleKind, file: File) => {
    if (!user) return;

    // Calendar event guard
    let monthVal: number | null = null;
    let dayVal: number | null = null;
    let evKey: string | null = null;
    let evLabel: string | null = null;
    if (kind === "calendar_event") {
      const preset = findEventPreset(eventKey);
      if (!preset) {
        toast.error("Choisis d'abord la fête");
        return;
      }
      const m = preset.month ?? parseInt(eventMonth, 10);
      const d = preset.day ?? parseInt(eventDay, 10);
      if (!m || !d) {
        toast.error("Indique le mois et le jour de la fête");
        return;
      }
      monthVal = m;
      dayVal = d;
      evKey = preset.key;
      evLabel = preset.label;
    }

    setUploadingKind(kind);
    setUploadStatus("Préparation…");
    try {
      const prep = await prepareCoverVideoForUpload(file, (p) => {
        setUploadStatus(p.message);
      });
      const finalFile = prep.file;
      const ext = finalFile.name.split(".").pop() || "mp4";
      const path = `birthday-pages/${user.id}/cover-videos/${birthdayPageId}-${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("assets")
        .upload(path, finalFile, { contentType: finalFile.type, upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("assets").getPublicUrl(path);

      // Generate poster from local file
      let posterUrl: string | null = null;
      try {
        const blobUrl = URL.createObjectURL(finalFile);
        const dataUrl = await extractSingleThumbnail(blobUrl, Math.min(1, prep.finalDuration / 2));
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

      const { error: insErr } = await (supabase as any).from("birthday_page_cover_videos").insert({
        birthday_page_id: birthdayPageId,
        user_id: user.id,
        schedule_kind: kind,
        video_url: pub.publicUrl,
        poster_url: posterUrl,
        is_active: true,
        event_key: evKey,
        event_label: evLabel,
        calendar_month: monthVal,
        calendar_day: dayVal,
      });
      if (insErr) throw insErr;

      toast.success(
        prep.trimmed || prep.compressed
          ? `Vidéo optimisée et ajoutée 🎉${prep.trimmed ? " (30s)" : ""}${prep.compressed ? " (compressée)" : ""}`
          : "Vidéo ajoutée 🎉",
      );
      if (kind === "calendar_event") {
        setEventKey("");
        setEventMonth("");
        setEventDay("");
      }
      qc.invalidateQueries({ queryKey: ["birthday-page-cover-videos", birthdayPageId] });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Échec de l'upload");
    } finally {
      setUploadingKind(null);
      setUploadStatus("");
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

  const selectedPreset = findEventPreset(eventKey);
  const presetHasDate = !!(selectedPreset?.month && selectedPreset?.day);

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

            {lowViewVideos.length > 0 && (
              <Card className="p-3 space-y-2 border-primary/40 bg-primary/5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="font-poppins font-semibold text-sm">À (re)découvrir</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Voici les vidéos que tu n'as encore jamais ou très peu regardées.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {lowViewVideos.slice(0, 9).map((v) => (
                    <div key={v.id} className="relative aspect-video bg-black rounded overflow-hidden">
                      <video
                        src={v.video_url}
                        poster={v.poster_url ?? undefined}
                        muted
                        playsInline
                        controls
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/65 text-white text-[10px] flex items-center gap-0.5">
                        {viewCount(v.id) === 0 ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                        {viewCount(v.id) === 0 ? "Jamais vue" : `${viewCount(v.id)} vue${viewCount(v.id) > 1 ? "s" : ""}`}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {USER_KINDS.map((kind) => {
              const ones = [...videos.filter((v) => v.schedule_kind === kind)].sort(
                (a, b) => viewCount(a.id) - viewCount(b.id),
              );
              const isCalendar = kind === "calendar_event";
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

                  {isCalendar && (
                    <div className="space-y-2 pt-1 border-t">
                      <div>
                        <Label className="text-xs">Nom de la fête</Label>
                        <Select
                          value={eventKey}
                          onValueChange={(v) => {
                            setEventKey(v);
                            const p = findEventPreset(v);
                            if (p?.month && p?.day) {
                              setEventMonth(String(p.month));
                              setEventDay(String(p.day));
                            } else {
                              setEventMonth("");
                              setEventDay("");
                            }
                          }}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Choisis une fête…" />
                          </SelectTrigger>
                          <SelectContent>
                            {CALENDAR_EVENT_PRESETS.map((p) => (
                              <SelectItem key={p.key} value={p.key}>
                                {p.label}
                                {p.month && p.day ? ` · ${p.day}/${p.month}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedPreset && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Mois (1-12)</Label>
                            <Input
                              type="number"
                              min={1}
                              max={12}
                              value={eventMonth}
                              onChange={(e) => setEventMonth(e.target.value)}
                              disabled={presetHasDate}
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Jour (1-31)</Label>
                            <Input
                              type="number"
                              min={1}
                              max={31}
                              value={eventDay}
                              onChange={(e) => setEventDay(e.target.value)}
                              disabled={presetHasDate}
                              className="h-9"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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
                          {viewCount(v.id) <= LOW_VIEW_THRESHOLD && (
                            <Badge
                              variant="secondary"
                              className="absolute bottom-1 left-1 text-[9px] px-1 py-0 h-4"
                            >
                              {viewCount(v.id) === 0 ? "Jamais vue" : "Peu vue"}
                            </Badge>
                          )}
                          {isCalendar && v.event_label && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/65 text-white text-[9px] max-w-[80%] truncate">
                              {v.event_label}
                            </span>
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
            {uploadingKind && uploadStatus && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                {uploadStatus}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground pt-2 text-center">
              MP4 / MOV / WebM · &gt; 30s = découpé aux 30 premières secondes · &gt; 25 Mo = compressé automatiquement
            </p>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}