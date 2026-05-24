import { useEffect, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ImagePlus, Smile, Sparkles, Mic, Square, Play, Trash2, Upload, Loader2, Send,
  Wand2, Youtube as YoutubeIcon, Type,
} from "lucide-react";
import { toast } from "sonner";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PhoneInput, createPhoneData, type PhoneData } from "@/components/PhoneInput";
import { useGiphy } from "@/hooks/useGiphy";
import { compressImage } from "@/utils/compressImage";
import type { BirthdayMessage } from "@/hooks/useBirthdayMessages";

type MediaType = "text" | "gif" | "sticker" | "image" | "youtube" | "animated_text" | "card";
type Tone = "joyeux" | "tendre" | "humour" | "solennel";

interface Selection {
  media_type: MediaType;
  media_url?: string;
  media_metadata?: any;
  card_template_id?: string;
}

interface Template {
  id: string;
  category: string;
  title: string;
  image_url: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  slug: string;
  firstName: string;
  onPublished: (m: BirthdayMessage) => void;
}

const TONES: { value: Tone; label: string; emoji: string }[] = [
  { value: "joyeux", label: "Joyeux", emoji: "🎉" },
  { value: "tendre", label: "Tendre", emoji: "💖" },
  { value: "humour", label: "Humour", emoji: "😄" },
  { value: "solennel", label: "Solennel", emoji: "🙏" },
];

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "").split(/[?&]/)[0] || null;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const m = u.pathname.match(/\/(embed|shorts)\/([^/?]+)/);
      if (m) return m[2];
    }
  } catch { /* ignore */ }
  return null;
}

export function NewPostModal({ open, onOpenChange, slug, firstName, onPublished }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState("gif");
  const [text, setText] = useState("");
  const [tone, setTone] = useState<Tone>("joyeux");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState<PhoneData>(createPhoneData());

  // Audio
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      // Reset on close
      setText(""); setTone("joyeux"); setSelection(null); setTab("gif");
      setAudioBlob(null); setRecording(false); setRecordSecs(0);
      if (mediaRecRef.current && mediaRecRef.current.state !== "inactive") mediaRecRef.current.stop();
      if (timerRef.current) window.clearInterval(timerRef.current);
    }
  }, [open]);

  // Recording controls
  const startRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecRef.current = mr;
      setRecording(true);
      setRecordSecs(0);
      timerRef.current = window.setInterval(() => {
        setRecordSecs(s => {
          if (s >= 15) { stopRecord(); return 15; }
          return s + 1;
        });
      }, 1000);
    } catch (e) {
      toast.error("Micro inaccessible. Vérifie les permissions.");
    }
  };

  const stopRecord = () => {
    if (mediaRecRef.current && mediaRecRef.current.state !== "inactive") mediaRecRef.current.stop();
    if (timerRef.current) window.clearInterval(timerRef.current);
    setRecording(false);
  };

  const handleSuggest = async () => {
    setSuggesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-birthday-message", {
        body: { first_name: firstName, tone, occasion: "anniversaire" },
      });
      if (error) throw error;
      const t = (data as any)?.text;
      if (t) setText(t);
      else toast.error("L'IA n'a pas répondu, réessaie.");
    } catch (e: any) {
      toast.error(e?.message?.includes("429") ? "Trop de demandes, réessaie." : "Échec génération IA");
    } finally {
      setSuggesting(false);
    }
  };

  const blobToBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

  const handlePublish = async () => {
    const hasAudio = !!audioBlob;
    const hasSelection = !!selection;
    if (!text.trim() && !hasSelection && !hasAudio) {
      toast.error("Ajoute un message, un média ou un vocal.");
      return;
    }
    if (!user) {
      if (!visitorName.trim()) { toast.error("Ton prénom est requis"); return; }
      if (!visitorPhone.isValid) { toast.error("Numéro de téléphone invalide"); return; }
    }
    setPublishing(true);
    try {
      const mediaType: MediaType | "audio" = hasSelection ? selection!.media_type : (hasAudio ? "audio" : "text");
      const payload: any = {
        slug,
        message_text: text.trim(),
        media_type: mediaType,
        media_url: selection?.media_url ?? null,
        media_metadata: selection?.media_metadata ?? null,
        card_template_id: selection?.card_template_id ?? null,
        tone,
      };
      if (hasAudio) {
        payload.audio_base64 = await blobToBase64(audioBlob!);
        if (!hasSelection) payload.media_type = "audio";
      }
      if (!user) {
        payload.visitor = {
          first_name: visitorName.trim(),
          phone: visitorPhone.fullNumber.replace(/\s/g, ""),
          country_code: visitorPhone.countryCode,
        };
      }
      const { data, error } = await supabase.functions.invoke("post-birthday-message", { body: payload });
      if (error) throw error;
      const result = data as any;
      if (result?.error) throw new Error(result.error);
      toast.success(
        result.moderation_status === "borderline"
          ? "Message publié — il sera relu par la personne célébrée 💛"
          : "Message publié ! 💖"
      );
      if (result.message) onPublished(result.message);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de la publication");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="font-poppins">Créer ma carte ✨</DialogTitle>
          <DialogDescription>
            Compose un message inoubliable pour <b>{firstName}</b>.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-5 relative">
            <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
              <TabsList className="inline-flex flex-nowrap min-w-max gap-1.5 bg-secondary/60 p-1 pr-10 h-auto">
                {[
                  { v: "gif", l: "🎞️ GIFs" },
                  { v: "emoji", l: "😀 Emoji" },
                  { v: "card", l: "💌 Cartes" },
                  { v: "sticker", l: "🌟 Stickers" },
                  { v: "animated_text", l: "✨ Texte animé" },
                  { v: "youtube", l: "▶️ YouTube" },
                  { v: "image", l: "📷 Photo" },
                ].map(t => (
                  <TabsTrigger
                    key={t.v}
                    value={t.v}
                    className="text-xs font-medium rounded-full px-3 py-1.5 text-foreground/70 hover:text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft transition"
                  >
                    {t.l}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <div className="pointer-events-none absolute right-5 top-0 bottom-0 w-10 bg-gradient-to-l from-background to-transparent" />
          </div>

          <div className="flex-1 overflow-y-auto px-5 pt-3 pb-2 min-h-0">
            <TabsContent value="gif" className="mt-0">
              <GiphyGrid type="gif" onSelect={(it) => setSelection({ media_type: "gif", media_url: it.url, media_metadata: { giphy_id: it.id, width: it.width, height: it.height } })} selectedUrl={selection?.media_type === "gif" ? selection.media_url : undefined} />
            </TabsContent>
            <TabsContent value="sticker" className="mt-0">
              <GiphyGrid type="sticker" onSelect={(it) => setSelection({ media_type: "sticker", media_url: it.url, media_metadata: { giphy_id: it.id } })} selectedUrl={selection?.media_type === "sticker" ? selection.media_url : undefined} />
            </TabsContent>
            <TabsContent value="animated_text" className="mt-0">
              <GiphyGrid type="text" onSelect={(it) => setSelection({ media_type: "animated_text", media_url: it.url, media_metadata: { giphy_id: it.id } })} selectedUrl={selection?.media_type === "animated_text" ? selection.media_url : undefined} placeholder="Tape ton mot magique (ex: bravo, merci...)" />
            </TabsContent>
            <TabsContent value="emoji" className="mt-0">
              <div className="flex justify-center py-2">
                <EmojiPicker
                  width="100%"
                  height={360}
                  onEmojiClick={(e) => setText((t) => t + e.emoji)}
                  searchPlaceholder="Rechercher un emoji"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">Les emojis sont ajoutés à ton message ci-dessous.</p>
            </TabsContent>
            <TabsContent value="card" className="mt-0">
              <CardTemplates onSelect={(t) => setSelection({ media_type: "card", media_url: t.image_url, card_template_id: t.id, media_metadata: { title: t.title } })} selectedId={selection?.card_template_id} />
            </TabsContent>
            <TabsContent value="youtube" className="mt-0">
              <YoutubePicker onSelect={(id) => setSelection({ media_type: "youtube", media_url: id, media_metadata: { video_id: id } })} selectedId={selection?.media_type === "youtube" ? (selection.media_metadata?.video_id || selection.media_url) : undefined} />
            </TabsContent>
            <TabsContent value="image" className="mt-0">
              <ImageUploader pageSlug={slug} onSelect={(url) => setSelection({ media_type: "image", media_url: url })} selectedUrl={selection?.media_type === "image" ? selection.media_url : undefined} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Selected preview chip */}
        {selection?.media_url && selection.media_type !== "youtube" && (
          <div className="px-5">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border">
              <img src={selection.media_url} alt="" className="h-12 w-12 rounded object-cover" />
              <span className="text-xs text-muted-foreground flex-1">Média sélectionné</span>
              <Button variant="ghost" size="sm" onClick={() => setSelection(null)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        {selection?.media_type === "youtube" && (
          <div className="px-5">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border">
              <YoutubeIcon className="h-5 w-5 text-red-500" />
              <span className="text-xs text-muted-foreground flex-1">Vidéo YouTube ajoutée</span>
              <Button variant="ghost" size="sm" onClick={() => setSelection(null)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Text + tone + suggest */}
        <div className="px-5 pt-3 space-y-2 border-t">
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="text-xs">Ton :</Label>
            {TONES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTone(t.value)}
                className={`text-xs px-3 py-1 rounded-full border transition ${tone === t.value ? "bg-gradient-to-r from-primary to-accent text-primary-foreground border-transparent shadow-soft" : "bg-secondary/70 border-primary/20 hover:bg-secondary"}`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
            <Button
              type="button" variant="outline" size="sm"
              className="ml-auto border-primary/40 text-primary hover:bg-primary/10"
              onClick={handleSuggest} disabled={suggesting}
            >
              {suggesting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-1" />}
              Suggérer ✨
            </Button>
          </div>

          <div className="relative">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 500))}
              placeholder="Votre message ✨"
              className="resize-none min-h-[80px] pr-10"
              maxLength={500}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="absolute right-1 top-1 h-7 w-7 p-0">
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="p-0 w-auto">
                <EmojiPicker height={320} onEmojiClick={(e) => setText(t => t + e.emoji)} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>✨ Le contenu généré par IA peut contenir des erreurs.</span>
            <span>{text.length}/500</span>
          </div>

          {/* Voice recorder */}
          <div className="rounded-lg border bg-muted/30 p-2.5 flex items-center gap-2 flex-wrap">
            <Mic className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">Message vocal (15s max)</span>
            <div className="ml-auto flex items-center gap-2">
              {audioBlob && !recording && (
                <>
                  <audio controls src={URL.createObjectURL(audioBlob)} className="h-8" />
                  <Button variant="ghost" size="sm" onClick={() => setAudioBlob(null)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              {!recording && !audioBlob && (
                <Button size="sm" variant="outline" onClick={startRecord} className="border-accent/50 text-accent-foreground bg-accent/10 hover:bg-accent/20">
                  <Mic className="h-3.5 w-3.5 mr-1" /> Enregistrer
                </Button>
              )}
              {recording && (
                <Button size="sm" variant="destructive" onClick={stopRecord}>
                  <Square className="h-3.5 w-3.5 mr-1" /> Stop {recordSecs}s
                </Button>
              )}
            </div>
          </div>

          {/* Visitor identity */}
          {!user && (
            <div className="grid grid-cols-1 gap-2 pt-1">
              <Input
                placeholder="Ton prénom"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value.slice(0, 50))}
              />
              <PhoneInput
                value={visitorPhone}
                onChange={setVisitorPhone}
                label="Téléphone WhatsApp"
                size="sm"
              />
              <p className="text-[10px] text-muted-foreground">
                Ton numéro reste privé. Il ne sera jamais affiché publiquement.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 p-4 border-t bg-background">
          <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)} disabled={publishing}>
            Annuler
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-soft hover:opacity-95"
            onClick={handlePublish}
            disabled={publishing}
          >
            {publishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Publier
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ───────── Sub-pickers ───────── */

function GiphyGrid({ type, onSelect, selectedUrl, placeholder }: {
  type: "gif" | "sticker" | "text";
  onSelect: (it: { id: string; url: string; width?: number; height?: number }) => void;
  selectedUrl?: string;
  placeholder?: string;
}) {
  const { query, setQuery, items, loading } = useGiphy(type);
  return (
    <div className="space-y-2">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder || (type === "sticker" ? "Rechercher un sticker..." : "Rechercher un GIF...")}
      />
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {items.map(it => (
            <button
              key={it.id}
              type="button"
              onClick={() => onSelect(it)}
              className={`relative rounded-md overflow-hidden bg-muted aspect-square ${selectedUrl === it.url ? "ring-2 ring-primary" : ""}`}
            >
              <img src={it.preview || it.url} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
          {items.length === 0 && (
            <p className="col-span-3 text-center text-xs text-muted-foreground py-6">Aucun résultat</p>
          )}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground text-right">Propulsé par GIPHY</p>
    </div>
  );
}

function CardTemplates({ onSelect, selectedId }: {
  onSelect: (t: Template) => void;
  selectedId?: string;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("anniversaire");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("birthday_card_templates")
        .select("id, category, title, image_url")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      setTemplates((data as Template[]) || []);
      setLoading(false);
    })();
  }, []);

  const cats = Array.from(new Set(templates.map(t => t.category)));
  const filtered = templates.filter(t => t.category === category || !cats.includes(category));

  return (
    <div className="space-y-2">
      {cats.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {cats.map(c => (
            <button
              key={c} type="button"
              onClick={() => setCategory(c)}
              className={`text-xs px-3 py-1 rounded-full border capitalize transition ${category === c ? "bg-gradient-to-r from-primary to-accent text-primary-foreground border-transparent shadow-soft" : "bg-secondary/70 border-primary/20 hover:bg-secondary"}`}
            >{c}</button>
          ))}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-8">
          Aucune carte disponible pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filtered.map(t => (
            <button
              key={t.id} type="button"
              onClick={() => onSelect(t)}
              className={`rounded-lg overflow-hidden border bg-muted text-left ${selectedId === t.id ? "ring-2 ring-primary" : ""}`}
            >
              <img src={t.image_url} alt={t.title} className="w-full aspect-[4/5] object-cover" />
              <div className="px-2 py-1 text-[11px] truncate">{t.title}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function YoutubePicker({ onSelect, selectedId }: { onSelect: (id: string) => void; selectedId?: string }) {
  const [url, setUrl] = useState("");
  const [id, setId] = useState<string | null>(selectedId || null);
  return (
    <div className="space-y-2">
      <Input
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          const v = extractYoutubeId(e.target.value);
          setId(v);
          if (v) onSelect(v);
        }}
        placeholder="Colle ton lien YouTube (https://...)"
      />
      {id ? (
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
          <iframe src={`https://www.youtube.com/embed/${id}`} title="Aperçu" className="w-full h-full" allowFullScreen />
        </div>
      ) : url ? (
        <p className="text-xs text-destructive">Lien YouTube non reconnu.</p>
      ) : (
        <p className="text-xs text-muted-foreground">Lien classique, share, shorts ou embed acceptés.</p>
      )}
    </div>
  );
}

function ImageUploader({ pageSlug, onSelect, selectedUrl }: { pageSlug: string; onSelect: (url: string) => void; selectedUrl?: string }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 Mo"); return; }
    setUploading(true);
    try {
      const compressed = await compressImage(file, { quality: 0.82, maxWidth: 1400, maxHeight: 1400 } as any);
      const blob: Blob = (compressed as any).blob ?? compressed;
      const ext = blob.type.split("/")[1] || "webp";
      const filename = `${pageSlug}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("birthday-message-media").upload(filename, blob, { contentType: blob.type, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("birthday-message-media").getPublicUrl(filename);
      onSelect(data.publicUrl);
      toast.success("Image prête !");
    } catch (e: any) {
      toast.error(e?.message || "Échec upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <Button
        variant="outline" className="w-full h-32 border-dashed"
        onClick={() => inputRef.current?.click()} disabled={uploading}
      >
        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-6 w-6 mr-2" />}
        {uploading ? "Compression…" : "Choisir une image"}
      </Button>
      {selectedUrl && (
        <img src={selectedUrl} alt="" className="max-h-60 mx-auto rounded-lg" />
      )}
      <p className="text-[10px] text-muted-foreground text-center">JPG/PNG/WebP, 5 Mo max — compressée automatiquement.</p>
    </div>
  );
}