import { useEffect, useState } from "react";
import { ClipboardPaste, ExternalLink, ImageIcon, Loader2, ShoppingBag, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  fetchExternalProductMeta,
  useAddExternalFavorite,
} from "@/hooks/useExternalFavorites";

interface JumiaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  countryCode?: string | null;
  /** Default platform to suggest in the helper button. Defaults to Jumia. */
  defaultPlatformUrl?: string;
  defaultPlatformLabel?: string;
  /**
   * "favorite" (default): adds the product to the user's external favorites (wishlist).
   * "fund": skips the wishlist and calls `onLaunchFund` with the preset so the caller
   * can open the ExternalProductFundModal directly.
   */
  mode?: "favorite" | "fund";
  onLaunchFund?: (preset: {
    productUrl: string;
    productName: string;
    productImageUrl: string | null;
    estimatedPrice: number;
    platform: string;
  }) => void;
}

export function JumiaImportModal({
  isOpen,
  onClose,
  countryCode,
  defaultPlatformUrl = "https://www.jumia.ci/",
  defaultPlatformLabel = "Jumia.ci",
  mode = "favorite",
  onLaunchFund,
}: JumiaImportModalProps) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("");
  const [platform, setPlatform] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewed, setPreviewed] = useState(false);
  const add = useAddExternalFavorite();

  useEffect(() => {
    if (isOpen) {
      // Sync the restored/selected platform into the modal as soon as it opens,
      // so the user immediately sees which marketplace is pre-filled (label + URL).
      setUrl(defaultPlatformUrl ?? "");
      setName("");
      setImageUrl("");
      setPrice("");
      setPlatform(defaultPlatformLabel ?? null);
      setPreviewing(false);
      setPreviewed(false);
    } else {
      setUrl("");
      setName("");
      setImageUrl("");
      setPrice("");
      setPlatform(null);
      setPreviewing(false);
      setPreviewed(false);
    }
  }, [isOpen, defaultPlatformUrl, defaultPlatformLabel]);

  const handlePreview = async () => {
    if (!url.trim()) {
      toast.error("Collez un lien produit.");
      return;
    }
    try {
      new URL(url);
    } catch {
      toast.error("Lien invalide.");
      return;
    }
    setPreviewing(true);
    try {
      const meta = await fetchExternalProductMeta(url.trim());
      setPlatform(meta.platform);
      if (meta.name) setName(meta.name);
      if (meta.image_url) setImageUrl(meta.image_url);
      if (meta.price) setPrice(String(meta.price));
      setPreviewed(true);
      if (!meta.name && !meta.price) {
        toast.warning("Aperçu partiel — complétez manuellement nom et prix.");
      } else {
        toast.success(`Produit ${meta.platform} détecté.`);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Impossible d'analyser ce lien.");
      // Best-effort platform detection from URL alone, so the user can still save manually
      try {
        const host = new URL(url).hostname.replace(/^www\./, "");
        if (host.includes("jumia")) setPlatform("Jumia");
        else setPlatform(host);
      } catch { /* ignore */ }
      setPreviewed(true);
    } finally {
      setPreviewing(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard?.readText) {
        toast.error("Votre navigateur ne permet pas la lecture du presse-papiers.");
        return;
      }
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) {
        toast.error("Presse-papiers vide.");
        return;
      }
      let parsed: URL;
      try {
        parsed = new URL(text);
      } catch {
        toast.error("Le presse-papiers ne contient pas un lien valide.");
        return;
      }
      if (!/^https?:$/.test(parsed.protocol)) {
        toast.error("Lien non supporté (http/https uniquement).");
        return;
      }
      setUrl(text);
      toast.success("Lien collé — analyse en cours…");
      // Auto-preview right after pasting
      setPreviewing(true);
      try {
        const meta = await fetchExternalProductMeta(text);
        setPlatform(meta.platform);
        if (meta.name) setName(meta.name);
        if (meta.image_url) setImageUrl(meta.image_url);
        if (meta.price) setPrice(String(meta.price));
        setPreviewed(true);
        if (!meta.name && !meta.price) {
          toast.warning("Aperçu partiel — complétez manuellement nom et prix.");
        } else {
          toast.success(`Produit ${meta.platform} détecté.`);
        }
      } catch (err: any) {
        toast.error(err?.message ?? "Impossible d'analyser ce lien.");
        try {
          const host = parsed.hostname.replace(/^www\./, "");
          if (host.includes("jumia")) setPlatform("Jumia");
          else setPlatform(host);
        } catch { /* ignore */ }
        setPreviewed(true);
      } finally {
        setPreviewing(false);
      }
    } catch {
      toast.error("Accès au presse-papiers refusé.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !name.trim() || !price) {
      toast.error("Lien, nom et prix sont requis.");
      return;
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast.error("Prix invalide.");
      return;
    }
    if (mode === "fund") {
      onLaunchFund?.({
        productUrl: url.trim(),
        productName: name.trim().slice(0, 200),
        productImageUrl: imageUrl.trim() || null,
        estimatedPrice: priceNum,
        platform: platform ?? "Jumia",
      });
      onClose();
      return;
    }
    try {
      await add.mutateAsync({
        platform: platform ?? "Jumia",
        external_url: url.trim(),
        product_name: name.trim().slice(0, 200),
        image_url: imageUrl.trim() || null,
        estimated_price: priceNum,
        currency: "XOF",
        country_code: countryCode ?? null,
      });
      onClose();
    } catch {
      /* toast already shown */
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Ajouter un produit depuis {defaultPlatformLabel}
          </DialogTitle>
          <DialogDescription>
            {mode === "fund"
              ? `Parcourez ${defaultPlatformLabel}, copiez le lien d'un produit et collez-le ici. Une cagnotte JDV sera lancée pour ce cadeau.`
              : `Parcourez ${defaultPlatformLabel}, copiez le lien d'un produit que vous aimez et collez-le ici. Une cagnotte JDV pourra ensuite être lancée pour ce cadeau.`}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-secondary/30 p-3 text-xs space-y-2">
          <p className="font-medium text-foreground">Comment ça marche ?</p>
          <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
            <li>Ouvrez {defaultPlatformLabel} et choisissez un produit.</li>
            <li>Copiez le lien de la page produit.</li>
            <li>Collez-le ci-dessous, vérifiez l'aperçu, puis ajoutez à vos souhaits.</li>
          </ol>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            asChild
          >
            <a href={defaultPlatformUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              Ouvrir {defaultPlatformLabel}
            </a>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="jumia-url">Lien du produit *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePasteFromClipboard}
                disabled={previewing}
                className="h-7 gap-1.5 text-xs text-primary hover:text-primary"
              >
                <ClipboardPaste className="h-3.5 w-3.5" />
                Coller le lien
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                id="jumia-url"
                type="url"
                placeholder="https://www.jumia.ci/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                maxLength={2000}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handlePreview}
                disabled={previewing || !url.trim()}
                className="shrink-0 gap-1.5"
              >
                {previewing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Aperçu
              </Button>
            </div>
            {platform && (
              <Badge variant="outline" className="text-xs">
                Plateforme : {platform}
              </Badge>
            )}
          </div>

          {(previewed || name) && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="jumia-name">Nom du produit *</Label>
                <Input
                  id="jumia-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={200}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="jumia-price">Prix estimé (XOF) *</Label>
                  <Input
                    id="jumia-price"
                    type="number"
                    min={100}
                    step={100}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="jumia-image">Image (URL)</Label>
                  <Input
                    id="jumia-image"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    maxLength={2000}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex justify-center">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={name || "Aperçu"}
                    className="w-32 h-32 object-cover rounded-md border"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center rounded-md border bg-muted text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
              </div>
            </>
          )}

          <p className="text-[11px] text-muted-foreground">
            Prix indicatif au jour de l'import — il pourra varier sur {defaultPlatformLabel} avant l'achat final.
          </p>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={mode === "favorite" && add.isPending}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={(mode === "favorite" && add.isPending) || !name.trim() || !price}
              className="bg-gradient-primary"
            >
              {mode === "fund"
                ? "Lancer une cagnotte"
                : add.isPending
                  ? "Ajout…"
                  : "Ajouter à mes souhaits"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}