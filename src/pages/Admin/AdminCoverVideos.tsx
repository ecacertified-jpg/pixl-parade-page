import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Film, Loader2, Trash2, Upload } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { getVideoMetadata } from "@/utils/videoValidation";
import { extractSingleThumbnail } from "@/utils/videoThumbnails";
import { CALENDAR_EVENT_PRESETS, findEventPreset } from "@/data/calendarEvents";

const KINDS: CoverVideoScheduleKind[] = [
  "greeting_morning",
  "greeting_afternoon",
  "greeting_evening",
  "greeting_night",
  "calendar_event",
  "birthday_day",
  "birthday_morning",
  "birthday_afternoon",
  "birthday_evening",
  "birthday_night",
];

const MAX_BYTES = 60 * 1024 * 1024; // 60 MB pour l'admin

export default function AdminCoverVideos() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<CoverVideoScheduleKind>("greeting_morning");
  const [month, setMonth] = useState<string>("");
  const [day, setDay] = useState<string>("");
  const [eventKey, setEventKey] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-cover-video-library"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("cover_video_library")
        .select("id, title, schedule_kind, video_url, poster_url, calendar_month, calendar_day, is_active, priority, created_at, event_key, event_label")
        .order("schedule_kind", { ascending: true })
        .order("priority", { ascending: true });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const handleSubmit = async () => {
    if (!file || !title.trim() || !user) {
      toast.error("Renseigne un titre et choisis une vidéo");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Vidéo trop lourde (max 60 Mo)");
      return;
    }
    let evMonth: number | null = null;
    let evDay: number | null = null;
    let evKey: string | null = null;
    let evLabel: string | null = null;
    if (kind === "calendar_event") {
      const preset = findEventPreset(eventKey);
      if (!preset) {
        toast.error("Choisis d'abord la fête");
        return;
      }
      evMonth = preset.month ?? (month ? parseInt(month, 10) : null);
      evDay = preset.day ?? (day ? parseInt(day, 10) : null);
      if (!evMonth || !evDay) {
        toast.error("Indique le mois et le jour de la fête");
        return;
      }
      evKey = preset.key;
      evLabel = preset.label;
    }
    setUploading(true);
    try {
      const meta = await getVideoMetadata(file);
      const ext = file.name.split(".").pop() || "mp4";
      const path = `cover-videos/${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("assets")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const video_url = supabase.storage.from("assets").getPublicUrl(path).data.publicUrl;

      let poster_url: string | null = null;
      try {
        const blobUrl = URL.createObjectURL(file);
        const dataUrl = await extractSingleThumbnail(blobUrl, Math.min(1, meta.duration / 2));
        URL.revokeObjectURL(blobUrl);
        const blob = await (await fetch(dataUrl)).blob();
        const posterPath = `${path.replace(/\.[^.]+$/, "")}-poster.jpg`;
        const { error } = await supabase.storage
          .from("assets")
          .upload(posterPath, blob, { contentType: "image/jpeg", upsert: true });
        if (!error) poster_url = supabase.storage.from("assets").getPublicUrl(posterPath).data.publicUrl;
      } catch {
        /* optional */
      }

      const { error: insErr } = await (supabase as any).from("cover_video_library").insert({
        title: title.trim(),
        schedule_kind: kind,
        video_url,
        poster_url,
        calendar_month: evMonth,
        calendar_day: evDay,
        event_key: evKey,
        event_label: evLabel,
        is_active: true,
        created_by: user.id,
      });
      if (insErr) throw insErr;

      toast.success("Vidéo ajoutée à la bibliothèque");
      setTitle("");
      setFile(null);
      setMonth("");
      setDay("");
      setEventKey("");
      qc.invalidateQueries({ queryKey: ["admin-cover-video-library"] });
      qc.invalidateQueries({ queryKey: ["cover-video-library"] });
    } catch (e) {
      console.error(e);
      toast.error("Échec de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (id: string, value: boolean) => {
    const { error } = await supabase
      .from("cover_video_library")
      .update({ is_active: value })
      .eq("id", id);
    if (error) return toast.error("Mise à jour impossible");
    qc.invalidateQueries({ queryKey: ["admin-cover-video-library"] });
    qc.invalidateQueries({ queryKey: ["cover-video-library"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette vidéo ?")) return;
    const { error } = await supabase.from("cover_video_library").delete().eq("id", id);
    if (error) return toast.error("Suppression impossible");
    qc.invalidateQueries({ queryKey: ["admin-cover-video-library"] });
    qc.invalidateQueries({ queryKey: ["cover-video-library"] });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-poppins flex items-center gap-2">
            <Film className="h-6 w-6 text-primary" />
            Vidéos de couverture (bibliothèque)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vidéos par défaut affichées en haut des pages d'anniversaire selon le créneau / la fête.
          </p>
        </div>

        <Card className="p-4 space-y-3">
          <h2 className="font-poppins font-semibold">Ajouter une vidéo</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Titre</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Bonjour matin sunrise" />
            </div>
            <div>
              <Label>Créneau</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as CoverVideoScheduleKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KINDS.map((k) => (
                    <SelectItem key={k} value={k}>{SCHEDULE_KIND_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {kind === "calendar_event" && (
              <>
                <div className="md:col-span-2">
                  <Label>Nom de la fête</Label>
                  <Select
                    value={eventKey}
                    onValueChange={(v) => {
                      setEventKey(v);
                      const p = findEventPreset(v);
                      if (p?.month && p?.day) {
                        setMonth(String(p.month));
                        setDay(String(p.day));
                      } else {
                        setMonth("");
                        setDay("");
                      }
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Choisis une fête…" /></SelectTrigger>
                    <SelectContent>
                      {CALENDAR_EVENT_PRESETS.map((p) => (
                        <SelectItem key={p.key} value={p.key}>
                          {p.label}
                          {p.month && p.day ? ` · ${p.day}/${p.month}` : " (date à préciser)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mois (1-12)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    disabled={!!findEventPreset(eventKey)?.month}
                  />
                </div>
                <div>
                  <Label>Jour (1-31)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    disabled={!!findEventPreset(eventKey)?.day}
                  />
                </div>
              </>
            )}
            <div className="md:col-span-2">
              <Label>Fichier vidéo (MP4)</Label>
              <Input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={uploading} className="w-full md:w-auto">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Publier
          </Button>
        </Card>

        <div>
          <h2 className="font-poppins font-semibold mb-3">Bibliothèque ({rows.length})</h2>
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rows.map((r) => (
                <Card key={r.id} className="p-3 space-y-2">
                  <div className="aspect-video bg-black rounded overflow-hidden">
                    <video
                      src={r.video_url}
                      poster={r.poster_url ?? undefined}
                      controls
                      muted
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {SCHEDULE_KIND_LABELS[r.schedule_kind as CoverVideoScheduleKind]}
                        {r.event_label ? ` · ${r.event_label}` : ""}
                        {r.calendar_month ? ` (${r.calendar_day}/${r.calendar_month})` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      className="text-destructive p-1"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Actif</span>
                    <Switch
                      checked={r.is_active}
                      onCheckedChange={(v) => toggleActive(r.id, v)}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}