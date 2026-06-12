import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Cake, Gift, Heart, ShoppingBag, Sparkles, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type Row = {
  id: string;
  title: string | null;
  body: string | null;
  category: string | null;
  action_url: string | null;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
};

const CATEGORY_META: Record<string, { label: string; icon: any; color: string }> = {
  birthday: { label: "Anniversaires", icon: Cake, color: "text-pink-500" },
  fund: { label: "Cagnottes", icon: Gift, color: "text-purple-500" },
  gift: { label: "Cadeaux", icon: Gift, color: "text-rose-500" },
  gratitude: { label: "Gratitude", icon: Heart, color: "text-red-500" },
  order: { label: "Commandes", icon: ShoppingBag, color: "text-blue-500" },
  other: { label: "Autres", icon: Sparkles, color: "text-amber-500" },
};

const PAGE_SIZE = 30;

export default function NotificationHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("all");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    let q = supabase
      .from("notification_analytics")
      .select("id, title, body, category, action_url, sent_at, opened_at, clicked_at")
      .eq("user_id", user.id)
      .eq("notification_type", "push")
      .order("sent_at", { ascending: false })
      .limit(PAGE_SIZE);
    if (category !== "all") q = q.eq("category", category);
    const { data } = await q;
    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const channel = supabase
      .channel("notif-history")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notification_analytics", filter: `user_id=eq.${user.id}` },
        (payload) => {
          if ((payload.new as any).notification_type === "push") {
            setRows((prev) => [payload.new as Row, ...prev].slice(0, PAGE_SIZE));
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, category]);

  const handleClick = (r: Row) => {
    if (r.action_url) navigate(r.action_url);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold font-poppins flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Historique des notifications
            </h1>
            <p className="text-xs text-muted-foreground">Toutes tes notifications push reçues</p>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <Tabs value={category} onValueChange={setCategory}>
            <TabsList className="w-full overflow-x-auto flex justify-start">
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="birthday">🎂 Anniv.</TabsTrigger>
              <TabsTrigger value="fund">🎁 Cagnottes</TabsTrigger>
              <TabsTrigger value="gratitude">❤️ Gratitude</TabsTrigger>
              <TabsTrigger value="order">📦 Commandes</TabsTrigger>
              <TabsTrigger value="other">✨ Autres</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : rows.length === 0 ? (
          <Card className="p-10 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <h2 className="font-semibold mb-1">Aucune notification pour le moment</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Tes notifications push apparaîtront ici dès qu'elles seront envoyées.
            </p>
            <Button variant="outline" asChild>
              <Link to="/notification-settings">Gérer mes préférences</Link>
            </Button>
          </Card>
        ) : (
          rows.map((r) => {
            const meta = CATEGORY_META[r.category || "other"] || CATEGORY_META.other;
            const Icon = meta.icon;
            return (
              <Card
                key={r.id}
                onClick={() => handleClick(r)}
                className={`p-4 transition-all hover:shadow-md ${
                  r.action_url ? "cursor-pointer" : ""
                } ${r.clicked_at ? "opacity-80" : ""}`}
              >
                <div className="flex gap-3">
                  <div className={`shrink-0 ${meta.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-tight">{r.title}</h3>
                      {!r.clicked_at && (
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          Nouveau
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.body}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{meta.label}</span>
                      <span>·</span>
                      <span>
                        {r.sent_at
                          ? formatDistanceToNow(new Date(r.sent_at), { addSuffix: true, locale: fr })
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </main>
    </div>
  );
}