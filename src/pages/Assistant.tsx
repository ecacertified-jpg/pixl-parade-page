import { useEffect, useRef, useState } from "react";
import { Heart, Send, Loader2, Sparkles, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const STARTERS = [
  "Aide-moi à écrire un message d'anniversaire touchant",
  "Quelle surprise originale pour ma maman ?",
  "Idées cadeaux pour mon meilleur ami (15 000 FCFA)",
  "Comment décorer un baptême ?",
];

const STORAGE_KEY = "jdv_assistant_chat_v1";

export default function Assistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {}
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Greeting message on first open
  useEffect(() => {
    if (messages.length === 0 && user) {
      sendInitial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const sendInitial = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("emotional-assistant-chat", {
        body: { messages: [{ role: "user", content: "Bonjour" }] },
      });
      if (error) throw error;
      if (data?.text) setMessages([{ role: "assistant", content: data.text }]);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("emotional-assistant-chat", {
        body: { messages: next },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages([...next, { role: "assistant", content: data.text || "..." }]);
    } catch (e: any) {
      toast.error(e.message || "Erreur de communication avec Joie");
      setMessages(next); // keep user message
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const reset = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    setTimeout(() => sendInitial(), 100);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <>
      <SEOHead
        title="Joie — IA émotionnelle JDV"
        description="Assistante IA pour mieux célébrer vos proches : messages, cadeaux, surprises, décoration."
      />
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-soft">
                <Heart className="h-6 w-6 text-primary-foreground" fill="currentColor" />
              </div>
              <div>
                <h1 className="font-poppins font-bold text-xl">Joie</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> IA émotionnelle JDV
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={reset} aria-label="Nouvelle conversation">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Messages */}
          <Card className="h-[60vh] flex flex-col overflow-hidden">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-3 text-primary/40" fill="currentColor" />
                  <p className="text-sm">Démarre la conversation ci-dessous 💫</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "user" ? (
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm">
                      {m.content}
                    </div>
                  ) : (
                    <div className="max-w-[85%] text-sm prose prose-sm max-w-none prose-headings:font-poppins prose-p:my-2 prose-ul:my-2">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Joie réfléchit...
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t p-3 bg-background">
              <div className="flex gap-2 items-end">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="Écris à Joie..."
                  rows={1}
                  className="resize-none min-h-[44px] max-h-32"
                  disabled={loading}
                />
                <Button
                  onClick={() => send(input)}
                  disabled={!input.trim() || loading}
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  aria-label="Envoyer"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick starters */}
          {messages.length <= 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={loading}
                  className="text-xs px-3 py-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}