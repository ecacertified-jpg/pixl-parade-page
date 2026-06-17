import { useEffect, useState } from "react";
import { Sparkles, Play, RefreshCw } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Campaign {
  id: string;
  key: string;
  name: string;
  description: string | null;
  trigger_type: string;
  channel: string;
  cooldown_hours: number;
  is_active: boolean;
  last_run_at: string | null;
  last_run_stats: any;
}

const CHANNEL_COLORS: Record<string, string> = {
  in_app: "bg-primary/10 text-primary",
  whatsapp: "bg-green-500/10 text-green-700",
  email: "bg-blue-500/10 text-blue-700",
  push: "bg-purple-500/10 text-purple-700",
};

const FUNCTION_MAP: Record<string, string> = {
  on_this_day: "notify-on-this-day",
  birthday_countdown: "birthday-wishes",
  inactive_reengagement: "check-inactive-users",
  event_countdown: "notify-upcoming-events",
  gratitude_nudge: "notify-reciprocity",
};

export default function EmotionalCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningKey, setRunningKey] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("emotional_campaigns")
      .select("*")
      .order("name");
    if (error) toast.error("Erreur de chargement");
    else setCampaigns(data as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (c: Campaign, active: boolean) => {
    const { error } = await supabase
      .from("emotional_campaigns")
      .update({ is_active: active })
      .eq("id", c.id);
    if (error) toast.error("Échec mise à jour");
    else {
      toast.success(active ? "Campagne activée" : "Campagne désactivée");
      load();
    }
  };

  const updateCooldown = async (c: Campaign, hours: number) => {
    const { error } = await supabase
      .from("emotional_campaigns")
      .update({ cooldown_hours: hours })
      .eq("id", c.id);
    if (!error) load();
  };

  const runNow = async (c: Campaign) => {
    const fn = FUNCTION_MAP[c.key];
    if (!fn) {
      toast.error("Aucune fonction associée");
      return;
    }
    setRunningKey(c.key);
    try {
      const { data, error } = await supabase.functions.invoke(fn, { body: {} });
      if (error) throw error;
      toast.success(`Exécuté : ${JSON.stringify(data).slice(0, 100)}`);
      load();
    } catch (e: any) {
      toast.error(`Erreur : ${e.message}`);
    } finally {
      setRunningKey(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-poppins flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Moteur émotionnel
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Pilote les campagnes d'automatisation émotionnelle (rappels, souvenirs, relances).
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
          </Button>
        </div>

        {loading ? (
          <Card className="p-6 animate-pulse h-40" />
        ) : (
          <div className="grid gap-4">
            {campaigns.map((c) => (
              <Card key={c.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{c.name}</h3>
                      <Badge variant="outline" className={CHANNEL_COLORS[c.channel] || ""}>
                        {c.channel}
                      </Badge>
                      <Badge variant="secondary">{c.trigger_type}</Badge>
                    </div>
                    {c.description && (
                      <p className="text-sm text-muted-foreground mb-3">{c.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 items-center text-sm">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`cd-${c.id}`} className="text-xs">
                          Cooldown (h)
                        </Label>
                        <Input
                          id={`cd-${c.id}`}
                          type="number"
                          className="w-20 h-8"
                          defaultValue={c.cooldown_hours}
                          onBlur={(e) => {
                            const v = parseInt(e.target.value);
                            if (v !== c.cooldown_hours) updateCooldown(c, v);
                          }}
                        />
                      </div>
                      {c.last_run_at && (
                        <span className="text-xs text-muted-foreground">
                          Dernier run : {new Date(c.last_run_at).toLocaleString("fr-FR")}
                          {c.last_run_stats?.sent !== undefined &&
                            ` · ${c.last_run_stats.sent} envoyés`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Switch
                      checked={c.is_active}
                      onCheckedChange={(v) => toggle(c, v)}
                    />
                    {FUNCTION_MAP[c.key] && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={runningKey === c.key}
                        onClick={() => runNow(c)}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        {runningKey === c.key ? "..." : "Lancer"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}