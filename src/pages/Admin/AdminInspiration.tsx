import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Eye, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InspirationComposer } from "@/components/inspiration/InspirationComposer";
import { findCategoryLabel, findSubcategoryLabel } from "@/features/inspiration/categories";
import type { InspirationItem } from "@/hooks/useInspirationItems";
import { getAppBaseUrl } from "@/utils/appUrl";

export default function AdminInspiration() {
  const [items, setItems] = useState<InspirationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "global" | "user">("all");

  const load = async () => {
    setLoading(true);
    let q = (supabase as any).from("inspiration_items").select("*").order("created_at", { ascending: false }).limit(200);
    if (filter === "global") q = q.eq("is_admin_post", true);
    if (filter === "user") q = q.eq("is_admin_post", false);
    const { data, error } = await q;
    if (error) { toast.error("Chargement impossible"); }
    else setItems((data ?? []) as InspirationItem[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const toggleActive = async (it: InspirationItem) => {
    const { error } = await (supabase as any).from("inspiration_items").update({ is_active: !it.is_active }).eq("id", it.id);
    if (error) toast.error("Action impossible"); else { toast.success("Mis à jour"); load(); }
  };

  const remove = async (it: InspirationItem) => {
    if (!confirm("Supprimer définitivement ?")) return;
    const { error } = await (supabase as any).from("inspiration_items").delete().eq("id", it.id);
    if (error) toast.error("Suppression impossible"); else { toast.success("Supprimé"); load(); }
  };

  const copyShare = async (it: InspirationItem) => {
    const url = `${getAppBaseUrl()}/inspiration/${it.share_token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Lien copié");
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-semibold font-poppins">Inspiration</h1>
            <p className="text-sm text-muted-foreground">Publications globales affichées sur toutes les pages anniversaire / événement.</p>
          </div>
          <Button onClick={() => setComposerOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nouvelle publication</Button>
        </div>

        <div className="flex gap-2">
          {(["all", "global", "user"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-full text-xs border ${filter === k ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"}`}
            >
              {k === "all" ? "Toutes" : k === "global" ? "Publications JDV" : "Utilisateurs"}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune publication.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((it) => (
              <Card key={it.id} className="p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-accent/40">{findCategoryLabel(it.category)}</span>
                  <span className="text-muted-foreground">{findSubcategoryLabel(it.category, it.subcategory)}</span>
                  {it.is_admin_post && <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/10 text-primary">JDV</span>}
                </div>
                {it.media_type === "video" && it.media_url && <video src={it.media_url} className="w-full aspect-video rounded bg-black" controls />}
                {it.media_type === "image" && it.media_url && <img src={it.media_url} alt="" className="w-full aspect-video object-cover rounded" />}
                {it.title && <p className="text-sm font-medium">{it.title}</p>}
                {it.body && <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">{it.body}</p>}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">{it.views_count} vues • {it.shares_count} partages</span>
                  <Button size="sm" variant="outline" className="ml-auto" onClick={() => copyShare(it)}><Share2 className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => toggleActive(it)}><Eye className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(it)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                {!it.is_active && <p className="text-xs text-destructive">Désactivée</p>}
              </Card>
            ))}
          </div>
        )}

        <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nouvelle publication JDV</DialogTitle></DialogHeader>
            <InspirationComposer
              pageKind="global"
              pageId={null}
              isAdminPost
              onCancel={() => setComposerOpen(false)}
              onCreated={() => { setComposerOpen(false); load(); }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}