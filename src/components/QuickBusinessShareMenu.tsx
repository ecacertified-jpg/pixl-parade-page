import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Share2, 
  MessageCircle, 
  Facebook, 
  Mail, 
  Copy, 
  Check,
  TrendingUp,
  Smartphone
} from "lucide-react";
import { useProductShares, SharePlatform } from "@/hooks/useProductShares";
import { toast } from "sonner";

interface QuickBusinessShareMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    price: number;
    currency?: string;
    image_url?: string;
  };
  businessName: string;
  businessId: string;
}

const businessMessageSuggestions = [
  { label: "Nouveau", emoji: "🆕", text: "Nouveau produit disponible !" },
  { label: "Offre", emoji: "🔥", text: "Offre spéciale du jour !" },
  { label: "Best-seller", emoji: "⭐", text: "Découvrez notre best-seller !" },
  { label: "Cadeau", emoji: "🎁", text: "Idée cadeau parfaite !" },
  { label: "Stock limité", emoji: "⚡", text: "Stock limité, profitez-en !" },
  { label: "Anniversaire", emoji: "🎂", text: "Parfait pour un anniversaire !" },
];

export function QuickBusinessShareMenu({
  open,
  onOpenChange,
  product,
  businessName,
  businessId,
}: QuickBusinessShareMenuProps) {
  const [customMessage, setCustomMessage] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const { stats, recordShare } = useProductShares(product.id);

  // Generate trackable share URL
  const getShareUrl = useCallback(() => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/boutique/${businessId}/produit/${product.id}?ref=share`;
  }, [businessId, product.id]);

  // Format share message
  const getShareMessage = useCallback(() => {
    const priceText = `${product.price.toLocaleString()} ${product.currency || 'XOF'}`;
    const message = customMessage || `Découvrez ${product.name} chez ${businessName}`;
    return `${message}\n\n💰 ${priceText}\n\n🔗 ${getShareUrl()}`;
  }, [customMessage, product.name, product.price, product.currency, businessName, getShareUrl]);

  // Handle share action
  const handleShare = async (platform: SharePlatform) => {
    const shareUrl = getShareUrl();
    const shareMessage = getShareMessage();
    const encodedMessage = encodeURIComponent(shareMessage);
    const encodedUrl = encodeURIComponent(shareUrl);

    // Record the share
    await recordShare(platform, { 
      template: 'business_quick', 
      message: customMessage || undefined 
    });

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodeURIComponent(customMessage || product.name)}`, '_blank');
        break;
      case 'sms':
        window.open(`sms:?body=${encodedMessage}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(`${product.name} - ${businessName}`)}&body=${encodedMessage}`, '_blank');
        break;
      case 'copy_link':
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        toast.success("Lien copié !");
        setTimeout(() => setCopiedLink(false), 2000);
        break;
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title: product.name,
              text: customMessage || `Découvrez ${product.name} chez ${businessName}`,
              url: shareUrl,
            });
          } catch (err) {
            if ((err as Error).name !== 'AbortError') {
              toast.error("Erreur lors du partage");
            }
          }
        }
        break;
    }

    // Close modal after sharing (except for copy)
    if (platform !== 'copy_link') {
      onOpenChange(false);
    }
  };

  // Apply message suggestion
  const applySuggestion = (text: string, emoji: string) => {
    setCustomMessage(`${text} ${emoji}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Partager ce produit
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Preview */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-16 h-16 object-cover rounded-md"
              />
            ) : (
              <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                <Share2 className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{product.name}</h4>
              <p className="text-sm text-primary font-semibold">
                {product.price.toLocaleString()} {product.currency || 'XOF'}
              </p>
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              💬 Message personnalisé (optionnel)
            </label>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Ajoutez un message pour accompagner le partage..."
              className="resize-none h-20"
            />
          </div>

          {/* Message Suggestions */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              Suggestions rapides :
            </label>
            <div className="flex flex-wrap gap-2">
              {businessMessageSuggestions.map((suggestion) => (
                <Button
                  key={suggestion.label}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => applySuggestion(suggestion.text, suggestion.emoji)}
                >
                  {suggestion.emoji} {suggestion.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-green-50 hover:border-green-500 hover:text-green-600"
              onClick={() => handleShare('whatsapp')}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs">WhatsApp</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600"
              onClick={() => handleShare('facebook')}
            >
              <Facebook className="h-5 w-5" />
              <span className="text-xs">Facebook</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-purple-50 hover:border-purple-500 hover:text-purple-600"
              onClick={() => handleShare('sms')}
            >
              <Smartphone className="h-5 w-5" />
              <span className="text-xs">SMS</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-orange-50 hover:border-orange-500 hover:text-orange-600"
              onClick={() => handleShare('email')}
            >
              <Mail className="h-5 w-5" />
              <span className="text-xs">Email</span>
            </Button>
          </div>

          {/* Copy Link Button */}
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => handleShare('copy_link')}
          >
            {copiedLink ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-600" />
                Lien copié !
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copier le lien
              </>
            )}
          </Button>

          {/* Native Share (if available) */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleShare('native')}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Autres options de partage
            </Button>
          )}

          {/* Share Stats */}
          {stats && stats.totalShares > 0 && (
            <div className="flex items-center justify-center gap-2 pt-2 border-t text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>
                Déjà partagé <strong className="text-foreground">{stats.totalShares}</strong> fois
                {stats.sharesToday > 0 && (
                  <span className="text-primary ml-1">
                    (+{stats.sharesToday} aujourd'hui)
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
