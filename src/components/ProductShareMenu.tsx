import { useState } from "react";
import { Copy, Mail, MessageCircle, Share2, Facebook, Smartphone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProductShareMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string | number;
    name: string;
    price: number;
    currency: string;
    image: string;
    vendor: string;
    vendorId?: string | null;
  } | null;
}

export function ProductShareMenu({
  open,
  onOpenChange,
  product,
}: ProductShareMenuProps) {
  const [copied, setCopied] = useState(false);

  if (!product) return null;

  // Utiliser l'URL de la boutique spécifique si vendorId est disponible
  const productUrl = product.vendorId
    ? `${window.location.origin}/boutique/${product.vendorId}?product=${product.id}`
    : `${window.location.origin}/shop?product=${product.id}`;
  const formattedPrice = `${product.price.toLocaleString()} ${product.currency}`;
  const shareText = `🎁 Découvre ce produit sur JOIE DE VIVRE !\n\n📦 ${product.name}\n💰 ${formattedPrice}\n🏪 ${product.vendor}`;
  const fullMessage = `${shareText}\n\n➡️ ${productUrl}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const shareViaWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
    window.open(url, "_blank");
    onOpenChange(false);
  };

  const shareViaFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
    onOpenChange(false);
  };

  const shareViaSMS = () => {
    const url = `sms:?body=${encodeURIComponent(fullMessage)}`;
    window.location.href = url;
    onOpenChange(false);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Découvre ${product.name} sur JOIE DE VIVRE !`);
    const body = encodeURIComponent(fullMessage);
    const url = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = url;
    onOpenChange(false);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} - JOIE DE VIVRE`,
          text: shareText,
          url: productUrl,
        });
        onOpenChange(false);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast.error("Erreur lors du partage");
        }
      }
    } else {
      copyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Partager ce produit
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Product preview */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
            <img
              src={product.image}
              alt={product.name}
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm line-clamp-1">{product.name}</h4>
              <p className="text-primary font-bold text-sm">{formattedPrice}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{product.vendor}</p>
            </div>
          </div>

          {/* Share options grid */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-green-50 hover:border-green-500 hover:text-green-600"
              onClick={shareViaWhatsApp}
            >
              <MessageCircle className="h-6 w-6" />
              <span className="text-xs">WhatsApp</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600"
              onClick={shareViaFacebook}
            >
              <Facebook className="h-6 w-6" />
              <span className="text-xs">Facebook</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-purple-50 hover:border-purple-500 hover:text-purple-600"
              onClick={shareViaSMS}
            >
              <Smartphone className="h-6 w-6" />
              <span className="text-xs">SMS</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-orange-50 hover:border-orange-500 hover:text-orange-600"
              onClick={shareViaEmail}
            >
              <Mail className="h-6 w-6" />
              <span className="text-xs">Email</span>
            </Button>
          </div>

          {/* Copy link section */}
          <div className="border rounded-lg p-3 bg-muted/50">
            <p className="text-xs text-muted-foreground mb-2">Lien du produit</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={productUrl}
                readOnly
                className="flex-1 text-sm bg-background border rounded px-3 py-2 truncate"
              />
              <Button
                size="sm"
                variant={copied ? "default" : "outline"}
                onClick={copyLink}
                className="shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Native share button (mobile) */}
          {typeof navigator !== "undefined" && navigator.share && (
            <Button
              className="w-full"
              variant="gradient"
              onClick={shareNative}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Partager via...
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
