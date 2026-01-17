import { useState, useRef, useEffect, useCallback } from "react";
import { Copy, Mail, MessageCircle, Share2, Facebook, Smartphone, Loader2, ImageIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ProductShareCard } from "./ProductShareCard";
import { ProductShareCardCustomizer, type ShareCardCustomization } from "./ProductShareCardCustomizer";
import { useProductShareCard } from "@/hooks/useProductShareCard";
import { useProductShares } from "@/hooks/useProductShares";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [customization, setCustomization] = useState<ShareCardCustomization>({
    template: 'classic',
    message: '',
  });
  const cardRef = useRef<HTMLDivElement>(null);
  const { generating, shareImageUrl, generateShareCard, getShareFile, reset } = useProductShareCard();
  const { stats, recordShare } = useProductShares(product ? String(product.id) : '');
  const regenerateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Régénérer l'image avec debounce quand la customisation change
  const regenerateCard = useCallback(() => {
    if (cardRef.current && product) {
      generateShareCard(cardRef.current, String(product.id));
    }
  }, [generateShareCard, product]);

  // Générer l'image à l'ouverture du modal
  useEffect(() => {
    if (open && product) {
      const timer = setTimeout(() => {
        regenerateCard();
      }, 100);
      return () => clearTimeout(timer);
    } else if (!open) {
      reset();
      setCustomization({ template: 'classic', message: '' });
      setCustomizerOpen(false);
    }
  }, [open, product, regenerateCard, reset]);

  // Régénérer avec debounce quand la customisation change
  useEffect(() => {
    if (!open || !product) return;
    
    if (regenerateTimeoutRef.current) {
      clearTimeout(regenerateTimeoutRef.current);
    }
    
    regenerateTimeoutRef.current = setTimeout(() => {
      regenerateCard();
    }, 300);

    return () => {
      if (regenerateTimeoutRef.current) {
        clearTimeout(regenerateTimeoutRef.current);
      }
    };
  }, [customization, open, product, regenerateCard]);

  if (!product) return null;

  const productUrl = `${window.location.origin}/p/${product.id}`;
  const formattedPrice = `${product.price.toLocaleString()} ${product.currency}`;
  
  // Inclure le message personnalisé dans le texte de partage si présent
  const personalMessageText = customization.message.trim() 
    ? `\n\n💬 "${customization.message.trim()}"` 
    : '';
  const shareText = `🎁 Découvre ce produit sur JOIE DE VIVRE !${personalMessageText}\n\n📦 ${product.name}\n💰 ${formattedPrice}\n🏪 ${product.vendor}`;
  const fullMessage = `${shareText}\n\n➡️ ${productUrl}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      toast.success("Lien copié !");
      await recordShare('copy_link');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const shareViaWhatsApp = async () => {
    await recordShare('whatsapp');
    const url = `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
    window.open(url, "_blank");
    onOpenChange(false);
  };

  const shareViaFacebook = async () => {
    await recordShare('facebook');
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
    onOpenChange(false);
  };

  const shareViaSMS = async () => {
    await recordShare('sms');
    const url = `sms:?body=${encodeURIComponent(fullMessage)}`;
    window.location.href = url;
    onOpenChange(false);
  };

  const shareViaEmail = async () => {
    await recordShare('email');
    const subject = encodeURIComponent(`Découvre ${product.name} sur JOIE DE VIVRE !`);
    const body = encodeURIComponent(fullMessage);
    const url = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = url;
    onOpenChange(false);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        if (shareImageUrl && navigator.canShare) {
          const file = await getShareFile(shareImageUrl, product.name);
          if (file && navigator.canShare({ files: [file] })) {
            await recordShare('native');
            await navigator.share({
              title: `${product.name} - JOIE DE VIVRE`,
              text: shareText,
              url: productUrl,
              files: [file],
            });
            onOpenChange(false);
            return;
          }
        }
        
        await recordShare('native');
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
    <>
      {/* Card de preview (invisible, positionnée hors écran pour capture) */}
      <div className="fixed -left-[9999px] -top-[9999px]" aria-hidden="true">
        <ProductShareCard 
          ref={cardRef} 
          product={product} 
          template={customization.template}
          personalMessage={customization.message}
        />
      </div>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Partager ce produit
              {stats && stats.totalShares > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {stats.totalShares} partage{stats.totalShares > 1 ? 's' : ''}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Preview de l'image générée */}
            <div className="relative rounded-lg overflow-hidden border bg-muted/50">
              {generating ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Génération de l'image...
                </div>
              ) : shareImageUrl ? (
                <img
                  src={shareImageUrl}
                  alt="Preview du partage"
                  className="w-full h-auto"
                />
              ) : (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                  Aperçu du produit
                </div>
              )}
            </div>

            {/* Customizer section */}
            <Collapsible open={customizerOpen} onOpenChange={setCustomizerOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between text-sm font-medium">
                  🎨 Personnaliser le partage
                  {customizerOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <ProductShareCardCustomizer
                  customization={customization}
                  onCustomizationChange={setCustomization}
                />
              </CollapsibleContent>
            </Collapsible>

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
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4 mr-2" />
                )}
                Partager via...
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
