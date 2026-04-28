import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Globe, ExternalLink, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface ExternalProductFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional pre-selected beneficiary contact (defaults to self-fund). */
  beneficiaryContactId?: string | null;
  beneficiaryName?: string | null;
  occasion?: "birthday" | "wedding" | "promotion" | "other";
  onSuccess?: (fundId: string) => void;
}

function detectPlatform(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host.includes("amazon")) return "Amazon";
    if (host.includes("jumia")) return "Jumia";
    if (host.includes("aliexpress")) return "AliExpress";
    if (host.includes("ebay")) return "eBay";
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("tiktok")) return "TikTok";
    if (host.includes("shein")) return "Shein";
    if (host.includes("alibaba")) return "Alibaba";
    return host;
  } catch {
    return null;
  }
}

export function ExternalProductFundModal({
  isOpen,
  onClose,
  beneficiaryContactId,
  beneficiaryName,
  occasion = "birthday",
  onSuccess,
}: ExternalProductFundModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [productUrl, setProductUrl] = useState("");
  const [productName, setProductName] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setProductUrl("");
      setProductName("");
      setProductImageUrl("");
      setEstimatedPrice("");
      setDescription("");
      setDeadline("");
      setLoading(false);
    }
  }, [isOpen]);

  const platform = productUrl ? detectPlatform(productUrl) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vous devez être connecté.");
      return;
    }

    // Validation
    try {
      new URL(productUrl);
    } catch {
      toast.error("Veuillez saisir une URL produit valide (https://...).");
      return;
    }
    if (!productName.trim() || productName.length > 200) {
      toast.error("Le nom du produit est requis (max 200 caractères).");
      return;
    }
    const price = Number(estimatedPrice);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Veuillez saisir un prix estimé valide.");
      return;
    }

    setLoading(true);
    try {
      const beneficiaryLabel =
        beneficiaryName?.trim() ||
        (user.user_metadata?.first_name as string | undefined) ||
        "moi";

      const title = `Cagnotte ${productName.slice(0, 60)} pour ${beneficiaryLabel}`;

      const { data: fund, error } = await supabase
        .from("collective_funds")
        .insert({
          creator_id: user.id,
          title,
          description:
            description?.trim() ||
            `Aidons à offrir « ${productName} » à ${beneficiaryLabel}. Le produit sera commandé sur ${platform ?? "la plateforme externe"} dès que la cagnotte sera complète.`,
          target_amount: price,
          currency: "XOF",
          occasion,
          status: "active",
          is_public: true,
          beneficiary_contact_id: beneficiaryContactId ?? null,
          deadline_date: deadline || null,
          is_external_product: true,
          external_product_url: productUrl,
          external_product_name: productName,
          external_product_image_url: productImageUrl || null,
          external_platform: platform,
        })
        .select("id")
        .single();

      if (error) throw error;

      toast.success("Cagnotte créée ! Partagez-la pour démarrer la collecte.");
      onSuccess?.(fund.id);
      onClose();
      navigate(`/f/${fund.id}`);
    } catch (err: any) {
      console.error("Failed to create external product fund", err);
      toast.error(
        err?.message ?? "Impossible de créer la cagnotte. Réessayez."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Cagnotte pour un produit externe
          </DialogTitle>
          <DialogDescription>
            Collez le lien d'un produit hébergé sur une autre plateforme
            (Amazon, Jumia, Instagram, etc.). Une fois la cagnotte complète,
            l'équipe Joie de Vivre se charge de l'achat et de la livraison.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="external-url">URL du produit *</Label>
            <Input
              id="external-url"
              type="url"
              placeholder="https://www.amazon.com/..."
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              required
              maxLength={2000}
            />
            {platform && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                Plateforme détectée : <strong>{platform}</strong>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="external-name">Nom du produit *</Label>
            <Input
              id="external-name"
              placeholder="Ex. Casque Sony WH-1000XM5"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="external-image">URL de l'image (optionnel)</Label>
            <Input
              id="external-image"
              type="url"
              placeholder="https://..."
              value={productImageUrl}
              onChange={(e) => setProductImageUrl(e.target.value)}
              maxLength={2000}
            />
            {productImageUrl ? (
              <img
                src={productImageUrl}
                alt={productName || "Aperçu"}
                className="mt-2 w-24 h-24 object-cover rounded-md border"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="mt-2 w-24 h-24 flex items-center justify-center bg-muted rounded-md border text-muted-foreground">
                <ImageIcon className="h-6 w-6" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="external-price">Prix estimé (XOF) *</Label>
              <Input
                id="external-price"
                type="number"
                min={100}
                step={100}
                placeholder="50000"
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="external-deadline">Date limite</Label>
              <Input
                id="external-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="external-desc">Message (optionnel)</Label>
            <Textarea
              id="external-desc"
              placeholder="Pourquoi ce cadeau ? Ajoutez un message pour les contributeurs."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="rounded-lg bg-secondary/40 p-3 text-xs text-muted-foreground">
            ℹ️ Le prix saisi inclut la marchandise, l'achat international et la
            livraison estimés. L'équipe JDV ajustera si nécessaire.
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-primary">
              {loading ? "Création..." : "Créer la cagnotte"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}