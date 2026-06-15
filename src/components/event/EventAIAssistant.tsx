import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Loader2, ListChecks, Wallet, Users, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Props {
  eventId: string;
  isOwner: boolean;
}

interface ChecklistItem {
  id: string;
  task: string;
  category: string | null;
  due_offset_days: number | null;
  is_done: boolean;
  position: number;
}

export function EventAIAssistant({ eventId, isOwner }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [budget, setBudget] = useState<string>("");
  const [vendors, setVendors] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const load = async () => {
    setLoadingList(true);
    const { data } = await supabase
      .from("event_checklist_items")
      .select("id, task, category, due_offset_days, is_done, position")
      .eq("event_id", eventId)
      .order("position", { ascending: true });
    setItems((data ?? []) as ChecklistItem[]);
    setLoadingList(false);
  };

  useEffect(() => { load(); }, [eventId]);

  if (!isOwner) return null;

  const call = async (action: string, payload: any = {}) => {
    setBusy(action);
    try {
      const { data, error } = await supabase.functions.invoke("event-ai-assistant", {
        body: { event_id: eventId, action, ...payload },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as any;
    } catch (e: any) {
      toast.error(e.message || "Erreur IA");
      return null;
    } finally {
      setBusy(null);
    }
  };

  const generate = async () => {
    const res = await call("generate_checklist");
    if (res?.ok) { toast.success(`✨ ${res.count} tâches générées`); load(); }
  };

  const toggle = async (item: ChecklistItem) => {
    const next = !item.is_done;
    setItems((p) => p.map((i) => (i.id === item.id ? { ...i, is_done: next } : i)));
    await supabase.from("event_checklist_items").update({ is_done: next }).eq("id", item.id);
  };

  const remove = async (id: string) => {
    setItems((p) => p.filter((i) => i.id !== id));
    await supabase.from("event_checklist_items").delete().eq("id", id);
  };

  const askBudget = async () => {
    const res = await call("suggest_budget");
    if (res?.ok) setBudget(res.text);
  };
  const askVendors = async () => {
    const res = await call("suggest_vendors");
    if (res?.ok) setVendors(res.text);
  };
  const ask = async () => {
    if (!question.trim()) return;
    const res = await call("ask", { question: question.trim() });
    if (res?.ok) setAnswer(res.text);
  };

  return (
    <Card className="p-5 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="font-bold font-poppins">Assistant IA</h2>
      </div>

      <Tabs defaultValue="checklist">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="checklist"><ListChecks className="h-4 w-4" /></TabsTrigger>
          <TabsTrigger value="budget"><Wallet className="h-4 w-4" /></TabsTrigger>
          <TabsTrigger value="vendors"><Users className="h-4 w-4" /></TabsTrigger>
          <TabsTrigger value="ask"><MessageCircle className="h-4 w-4" /></TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="mt-4 space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{items.length} tâche(s)</p>
            <Button size="sm" onClick={generate} disabled={busy === "generate_checklist"}>
              {busy === "generate_checklist" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              Générer
            </Button>
          </div>
          {loadingList ? (
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          ) : items.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-4">Aucune tâche. Clique sur "Générer" pour créer ta checklist IA.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((it) => (
                <li key={it.id} className="flex items-start gap-2 p-2 rounded-md bg-background/50">
                  <Checkbox checked={it.is_done} onCheckedChange={() => toggle(it)} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${it.is_done ? "line-through text-muted-foreground" : ""}`}>{it.task}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                      {it.category && <span>{it.category}</span>}
                      {it.due_offset_days != null && (
                        <span>{it.due_offset_days === 0 ? "Jour J" : `J${it.due_offset_days}`}</span>
                      )}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(it.id)} className="h-7 w-7">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="budget" className="mt-4 space-y-3">
          <Button size="sm" onClick={askBudget} disabled={busy === "suggest_budget"}>
            {busy === "suggest_budget" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Suggérer un budget
          </Button>
          {budget && (
            <div className="prose prose-sm max-w-none text-sm bg-background/50 p-3 rounded-md">
              <ReactMarkdown>{budget}</ReactMarkdown>
            </div>
          )}
        </TabsContent>

        <TabsContent value="vendors" className="mt-4 space-y-3">
          <Button size="sm" onClick={askVendors} disabled={busy === "suggest_vendors"}>
            {busy === "suggest_vendors" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Suggérer des prestataires
          </Button>
          {vendors && (
            <div className="prose prose-sm max-w-none text-sm bg-background/50 p-3 rounded-md">
              <ReactMarkdown>{vendors}</ReactMarkdown>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ask" className="mt-4 space-y-3">
          <Textarea
            placeholder="Pose ta question (ex: comment gérer 200 invités ?)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
          />
          <Button size="sm" onClick={ask} disabled={busy === "ask" || !question.trim()}>
            {busy === "ask" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-1" />}
            Demander
          </Button>
          {answer && (
            <div className="prose prose-sm max-w-none text-sm bg-background/50 p-3 rounded-md">
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}