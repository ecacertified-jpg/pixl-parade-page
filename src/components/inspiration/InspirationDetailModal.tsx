import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Copy, LayoutGrid, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { InspirationItem } from "@/hooks/useInspirationItems";
import { incrementInspirationShares, incrementInspirationViews } from "@/hooks/useInspirationItems";
import { findCategoryLabel, findSubcategoryLabel } from "@/features/inspiration/categories";
import { buildInspirationShareUrl } from "@/utils/inspirationShareUrl";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  item: InspirationItem | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Called when the user (signed-in) clicks "Voir d'autres vidéos". */
  onBrowseMore?: () => void;
}

export function InspirationDetailModal({ item, open, onOpenChange, onBrowseMore }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [signupGateOpen, setSignupGateOpen] = useState(false);
  useEffect(() => {
    if (open && item) { incrementInspirationViews(item.id).catch(() => {}); }
  }, [open, item?.id]);

  if (!item) return null;

  const buildShareUrl = () => buildInspirationShareUrl(item.share_token);

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

  const handleBrowseMore = () => {
    if (!user) {
      setSignupGateOpen(true);
      return;
    }
    onOpenChange(false);
    // Give the dialog a beat to close before parents open the browse modal.
    setTimeout(() => onBrowseMore?.(), 150);
  };

  const goToSignup = () => {
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.search.includes("openInspiration") ? "" : (window.location.search ? "&" : "?") + "openInspiration=1"}`;
    setSignupGateOpen(false);
    onOpenChange(false);
    navigate(
      `/auth?tab=signup&returnTo=${encodeURIComponent(returnTo)}&intent=inspiration_browse&utm_source=inspiration_more`,
    );
  };

  return (
    <>
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
            <video
              src={item.media_url}
              poster={item.thumbnail_url ?? undefined}
              controls
              autoPlay
              className="w-full max-h-[70vh] rounded-md bg-black"
            />
          )}
          {item.media_type === "image" && item.media_url && (
            <img src={item.media_url} alt={item.title ?? ""} className="w-full max-h-[70vh] object-contain rounded-md" />
          )}
          {item.body && <p className="whitespace-pre-wrap text-sm">{item.body}</p>}
          <div className="flex items-center gap-2 pt-2">
            <Button size="icon" onClick={share} aria-label="Partager" title="Partager">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={copy} aria-label="Copier le lien" title="Copier le lien">
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={handleBrowseMore}
              aria-label="Voir d'autres vidéos"
              title="Voir d'autres vidéos"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <div className="ml-auto text-xs text-muted-foreground">{item.views_count} vues • {item.shares_count} partages</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={signupGateOpen} onOpenChange={setSignupGateOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Inscris-toi pour continuer
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Pour découvrir plus de vidéos, films, astuces et conseils inspirants, crée ton compte gratuit
          Joie de Vivre. Tu reviendras automatiquement ici après l'inscription.
        </p>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => setSignupGateOpen(false)}>Plus tard</Button>
          <Button onClick={goToSignup}>Je m'inscris</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}