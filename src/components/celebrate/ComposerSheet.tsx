import { useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Image as ImageIcon, Video, Film, Type, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MUSIC_TRACKS } from "./musicTracks";
import { PremiumCardPicker } from "./PremiumCardPicker";
import type {
  CelebrationPageType,
  CelebrationPostKind,
} from "@/hooks/useCelebrationFeed";

interface Props {
  pageType?: CelebrationPageType;
  pageId?: string | null;
  onPublish: (input: {
    kind: CelebrationPostKind;
    content: string;
    media_urls?: string[];
    music_track_id?: string | null;
    card_template_id?: string | null;
  }) => Promise<unknown>;
  triggerLabel?: string;
  fullWidth?: boolean;
}

type Mode = "text" | "photo" | "video" | "tribute";

const MODES: { id: Mode; label: string; emoji: string; icon: any }[] = [
  { id: "text", label: "Mot", emoji: "✍️", icon: Type },
  { id: "photo", label: "Photo", emoji: "📸", icon: ImageIcon },
  { id: "video", label: "Vidéo", emoji: "🎥", icon: Video },
  { id: "tribute", label: "Hommage", emoji: "💖", icon: Film },
];

const BUCKET = "posts";

export function ComposerSheet({
  onPublish,
  triggerLabel = "Publier une célébration",
  fullWidth,
}: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [musicId, setMusicId] = useState<string | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    setMode("text");
    setText("");
    setMedia([]);
    setMusicId(null);
    setCardId(null);
  };

  const acceptFor = (m: Mode) =>
    m === "video"
      ? "video/mp4,video/webm,video/quicktime"
      : "image/*";

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`${file.name} dépasse 100 Mo`);
        continue;
      }
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/celebrate/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) {
        console.error(error);
        toast.error(`Upload échoué: ${file.name}`);
        continue;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      uploaded.push(data.publicUrl);
      if (mode === "video") break;
      if (mode === "photo" && media.length + uploaded.length >= 4) break;
    }
    setUploading(false);
    setMedia((prev) =>
      mode === "video" ? uploaded.slice(0, 1) : [...prev, ...uploaded].slice(0, 12)
    );
  };

  const canPublish = () => {
    if (submitting || uploading) return false;
    if (mode === "text") return text.trim().length > 0;
    if (mode === "photo") return media.length > 0;
    if (mode === "video") return media.length > 0;
    if (mode === "tribute") return media.length >= 2;
    return false;
  };

  const publish = async () => {
    if (!canPublish()) return;
    setSubmitting(true);
    const kind: CelebrationPostKind =
      mode === "text" ? "text" : mode === "tribute" ? "tribute" : mode;
    const res = await onPublish({
      kind,
      content: text.trim(),
      media_urls: media,
      music_track_id: mode === "tribute" ? musicId : null,
      card_template_id: cardId,
    });
    setSubmitting(false);
    if (res) {
      reset();
      setOpen(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <SheetTrigger asChild>
        <Button
          disabled={!user}
          className={fullWidth ? "w-full gap-2" : "gap-2"}
          size="lg"
        >
          <Sparkles className="h-4 w-4" />
          {user ? triggerLabel : "Connecte-toi pour célébrer"}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-poppins">Célébrer ✨</SheetTitle>
        </SheetHeader>

        {/* Mode tabs */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setMode(m.id);
                  setMedia([]);
                }}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-all",
                  mode === m.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              mode === "tribute"
                ? "Quelques mots pour accompagner l'hommage…"
                : "Dis-leur qu'ils sont aimés, vus, célébrés…"
            }
            rows={mode === "text" ? 6 : 3}
            maxLength={1000}
            className="resize-none text-base"
          />

          {(mode === "photo" || mode === "video" || mode === "tribute") && (
            <>
              <input
                ref={fileRef}
                type="file"
                hidden
                multiple={mode !== "video"}
                accept={acceptFor(mode)}
                onChange={(e) => handleFiles(e.target.files)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full gap-2"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === "video" ? (
                  <Video className="h-4 w-4" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
                {mode === "video"
                  ? "Choisir une vidéo"
                  : mode === "tribute"
                  ? `Ajouter des photos (${media.length}/12)`
                  : `Ajouter des photos (${media.length}/4)`}
              </Button>

              {media.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {media.map((url, i) => (
                    <div key={url} className="relative aspect-square">
                      {mode === "video" ? (
                        <video
                          src={url}
                          className="h-full w-full rounded-lg object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full rounded-lg object-cover"
                        />
                      )}
                      <button
                        onClick={() =>
                          setMedia((p) => p.filter((_, idx) => idx !== i))
                        }
                        className="absolute -top-1 -right-1 rounded-full bg-black/70 p-0.5 text-white"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {mode === "tribute" && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Musique d'ambiance
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMusicId(null)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs",
                    !musicId
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  )}
                >
                  🔇 Aucune
                </button>
                {MUSIC_TRACKS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMusicId(t.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs",
                      musicId === t.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
              {media.length < 2 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Ajoute au moins 2 photos pour générer le montage.
                </p>
              )}
            </div>
          )}

          <PremiumCardPicker value={cardId} onChange={setCardId} />

          <Button
            onClick={publish}
            disabled={!canPublish()}
            className="w-full"
            size="lg"
          >
            {submitting
              ? "Publication…"
              : mode === "tribute"
              ? "💖 Publier l'hommage"
              : "💖 Publier la célébration"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}