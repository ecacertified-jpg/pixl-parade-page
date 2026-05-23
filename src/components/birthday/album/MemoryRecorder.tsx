import { useEffect, useRef, useState } from "react";
import { Mic, Square, Play, Pause, Trash2, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_SECONDS = 120;

interface Props {
  sending: boolean;
  onSend: (blob: Blob, durationSec: number, mime: string) => void | Promise<void>;
}

function pickMime(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  for (const c of candidates) {
    // @ts-ignore
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return "audio/webm";
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function MemoryRecorder({ sending, onSend }: Props) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const mimeRef = useRef<string>("audio/webm");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startRecording = async () => {
    if (typeof MediaRecorder === "undefined") {
      toast.error("Ton navigateur ne supporte pas l'enregistrement audio");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      mimeRef.current = mime;
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const b = new Blob(chunksRef.current, { type: mime });
        setBlob(b);
        const url = URL.createObjectURL(b);
        setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
        stopStream();
      };
      rec.start();
      recorderRef.current = rec;
      startedAtRef.current = Date.now();
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        const s = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setElapsed(s);
        if (s >= MAX_SECONDS) stopRecording();
      }, 250);
    } catch (e) {
      console.error(e);
      toast.error("Impossible d'accéder au micro");
    }
  };

  const stopRecording = () => {
    try { recorderRef.current?.stop(); } catch { /* ignore */ }
    setRecording(false);
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  };

  const reset = () => {
    setBlob(null);
    setElapsed(0);
    setPlaying(false);
    if (previewUrl) { URL.revokeObjectURL(previewUrl); }
    setPreviewUrl(null);
  };

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play(); setPlaying(true); }
  };

  const handleSend = async () => {
    if (!blob) return;
    await onSend(blob, elapsed || 1, mimeRef.current);
    reset();
  };

  return (
    <div className="space-y-3 p-4 rounded-xl bg-muted/50 border border-border">
      {!blob ? (
        <div className="flex items-center gap-3">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={cn(
              "h-14 w-14 rounded-full flex items-center justify-center text-white transition-all shadow-card",
              recording ? "bg-destructive animate-pulse" : "bg-primary hover:bg-primary/90",
            )}
            aria-label={recording ? "Arrêter" : "Enregistrer"}
          >
            {recording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {recording ? "Enregistrement…" : "Touche le micro pour enregistrer"}
            </p>
            <p className="text-xs text-muted-foreground">
              {recording ? fmt(elapsed) + " / " + fmt(MAX_SECONDS) : `Max ${MAX_SECONDS}s · style WhatsApp`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-background rounded-lg p-3 border border-border">
            <button onClick={togglePlay}
              className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>
            <div className="flex-1">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary/40 w-full" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{fmt(elapsed)} · prêt à envoyer</p>
            </div>
            <audio ref={audioRef} src={previewUrl || undefined} onEnded={() => setPlaying(false)} hidden />
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="ghost" size="sm" onClick={reset} disabled={sending} className="w-full sm:w-auto">
              <Trash2 className="h-4 w-4 mr-1" /> Recommencer
            </Button>
            <Button size="sm" className="w-full sm:flex-1 min-w-0 whitespace-normal text-center h-auto py-2.5" onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
              Envoyer le souvenir
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}