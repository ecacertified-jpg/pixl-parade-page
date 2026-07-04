import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Copy } from "lucide-react";
import { toast } from "sonner";
import type { InspirationItem } from "@/hooks/useInspirationItems";
import { incrementInspirationShares, incrementInspirationViews } from "@/hooks/useInspirationItems";
import { findCategoryLabel, findSubcategoryLabel } from "@/features/inspiration/categories";

interface Props {
  item: InspirationItem | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** URL used as base for building share link (defaults to window.location.href without query) */
  currentPageUrl?: string;
}

export function InspirationDetailModal({ item, open, onOpenChange, currentPageUrl }: Props) {
  useEffect(() => {
    if (open && item) { incrementInspirationViews(item.id).catch(() => {}); }
  }, [open, item?.id]);

  if (!item) return null;

  const buildShareUrl = () => {
    const base = currentPageUrl ?? (typeof window !== "undefined" ? window.location.origin + window.location.pathname : "");
    return `${base}?inspiration=${item.share_token}`;
  };

  const share = async () => {
    const url = buildShareUrl();
    const shareData = { title: item.title || "Inspiration JDV", text: item.title || "Découvre cette inspiration", url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Lien copié !");
      }
      incrementInspirationShares(item.id).catch(() => {});
    } catch {}
  };

  const copy = async () => {
    await navigator.clipboard.writeText(buildShareUrl());
    toast.success("Lien copié !");
    incrementInspirationShares(item.id).catch(() => {});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-0.5 rounded-full bg-accent/40">{findCategoryLabel(item.category)}</span>
            <span>•</span>
            <span>{findSubcategoryLabel(item.category, item.subcategory)}</span>
            {item.is_admin_post && <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/10 text-primary">JDV Officiel</span>}
          </div>
          {item.title && <h2 className="text-lg font-semibold">{item.title}</h2>}
          {item.media_type === "video" && item.media_url && (
            <video src={item.media_url} controls autoPlay className="w-full max-h-[70vh] rounded-md bg-black" />
          )}
          {item.media_type === "image" && item.media_url && (
            <img src={item.media_url} alt={item.title ?? ""} className="w-full max-h-[70vh] object-contain rounded-md" />
          )}
          {item.body && <p className="whitespace-pre-wrap text-sm">{item.body}</p>}
          <div className="flex items-center gap-2 pt-2">
            <Button size="sm" onClick={share}><Share2 className="h-4 w-4 mr-1" /> Partager</Button>
            <Button size="sm" variant="outline" onClick={copy}><Copy className="h-4 w-4 mr-1" /> Copier le lien</Button>
            <div className="ml-auto text-xs text-muted-foreground">{item.views_count} vues • {item.shares_count} partages</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}