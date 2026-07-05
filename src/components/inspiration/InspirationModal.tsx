import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Play, Image as ImageIcon, FileText, Share2, Trash2 } from "lucide-react";
import { INSPIRATION_CATEGORIES } from "@/features/inspiration/categories";
import { useInspirationItems, type InspirationItem, incrementInspirationShares } from "@/hooks/useInspirationItems";
import { InspirationComposer } from "./InspirationComposer";
import { InspirationDetailModal } from "./InspirationDetailModal";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { buildInspirationShareUrl } from "@/utils/inspirationShareUrl";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pageKind: "birthday" | "event";
  pageId: string | null;
  canPublish?: boolean;
}

export function InspirationModal({ open, onOpenChange, pageKind, pageId, canPublish = true }: Props) {
  const { user } = useAuth();
  const { items, loading, refetch, remove } = useInspirationItems(pageKind, pageId);
  const [activeCat, setActiveCat] = useState(INSPIRATION_CATEGORIES[0].key);
  const [activeSub, setActiveSub] = useState<string>("all");
  const [composerOpen, setComposerOpen] = useState(false);
  const [detail, setDetail] = useState<InspirationItem | null>(null);

  const cat = INSPIRATION_CATEGORIES.find((c) => c.key === activeCat)!;

  const filtered = useMemo(() => {
    return items.filter(
      (it) => it.category === activeCat && (activeSub === "all" || it.subcategory === activeSub),
    );
  }, [items, activeCat, activeSub]);

  const share = async (it: InspirationItem) => {
    const url = buildInspirationShareUrl(it.share_token);
    try {
      if (navigator.share) await navigator.share({ title: it.title || "Inspiration", url });
      else { await navigator.clipboard.writeText(url); toast.success("Lien copié !"); }
      incrementInspirationShares(it.id).catch(() => {});
    } catch {}
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Inspiration</DialogTitle>
          </DialogHeader>

          <Tabs value={activeCat} onValueChange={(v) => { setActiveCat(v as any); setActiveSub("all"); }}>
            <TabsList className="w-full flex-wrap h-auto">
              {INSPIRATION_CATEGORIES.map((c) => (
                <TabsTrigger key={c.key} value={c.key} className="text-xs">{c.label}</TabsTrigger>
              ))}
            </TabsList>

            {INSPIRATION_CATEGORIES.map((c) => (
              <TabsContent key={c.key} value={c.key} className="space-y-3">
                <div className="flex gap-2 flex-wrap items-center">
                  <button
                    className={`px-2.5 py-1 rounded-full text-xs border ${activeSub === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}
                    onClick={() => setActiveSub("all")}
                  >Toutes</button>
                  {c.subcategories.map((s) => (
                    <button
                      key={s.key}
                      className={`px-2.5 py-1 rounded-full text-xs border ${activeSub === s.key ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}
                      onClick={() => setActiveSub(s.key)}
                    >{s.label}</button>
                  ))}
                  {canPublish && (
                    <Button size="sm" className="ml-auto" onClick={() => setComposerOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Publier
                    </Button>
                  )}
                </div>

                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Chargement…</p>
                ) : filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucune publication pour l'instant.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {filtered.map((it) => (
                      <div key={it.id} className="group relative rounded-md overflow-hidden bg-muted aspect-[9/12] cursor-pointer" onClick={() => setDetail(it)}>
                        {it.media_type === "video" && it.media_url ? (
                          <>
                            <video src={it.media_url} className="w-full h-full object-cover" muted preload="metadata" />
                            <Play className="absolute inset-0 m-auto h-8 w-8 text-white drop-shadow" />
                          </>
                        ) : it.media_type === "image" && it.media_url ? (
                          <img src={it.media_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="p-3 h-full flex flex-col justify-between bg-gradient-to-br from-primary/10 to-accent/10">
                            <FileText className="h-5 w-5 text-primary" />
                            <p className="text-xs line-clamp-6 whitespace-pre-wrap">{it.body}</p>
                          </div>
                        )}
                        {it.is_admin_post && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-primary/90 text-primary-foreground text-[10px] font-medium">JDV</span>
                        )}
                        <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/60 to-transparent flex items-center gap-1">
                          <p className="flex-1 text-white text-xs line-clamp-1">{it.title || " "}</p>
                          <button
                            className="h-7 w-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
                            onClick={(e) => { e.stopPropagation(); share(it); }}
                            aria-label="Partager"
                          >
                            <Share2 className="h-3.5 w-3.5 text-white" />
                          </button>
                          {user && it.author_id === user.id && (
                            <button
                              className="h-7 w-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
                              onClick={async (e) => { e.stopPropagation(); if (confirm("Supprimer ?")) await remove(it.id); }}
                              aria-label="Supprimer"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-white" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nouvelle publication</DialogTitle></DialogHeader>
          <InspirationComposer
            pageKind={pageKind}
            pageId={pageId}
            onCancel={() => setComposerOpen(false)}
            onCreated={() => { setComposerOpen(false); refetch(); }}
          />
        </DialogContent>
      </Dialog>

      <InspirationDetailModal item={detail} open={!!detail} onOpenChange={(o) => !o && setDetail(null)} />
    </>
  );
}