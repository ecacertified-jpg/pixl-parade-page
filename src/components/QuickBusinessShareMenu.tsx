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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Share2, 
  MessageCircle, 
  Facebook, 
  Mail, 
  Copy, 
  Check,
  TrendingUp,
  Smartphone,
  Hash,
  Sparkles
} from "lucide-react";
import { useProductShares, SharePlatform } from "@/hooks/useProductShares";
import { toast } from "sonner";
import { PRODUCT_TEMPLATES, buildHashtags, type HashtagCategory, HASHTAGS } from "@/data/social-media-content";
import { useSocialPost } from "@/hooks/useSocialPost";

interface QuickBusinessShareMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    price: number;
    currency?: string;
    image_url?: string;
    category?: string;
  };
  businessName: string;
  businessId: string;
  city?: string;
}

export function QuickBusinessShareMenu({
  open,
  onOpenChange,
  product,
  businessName,
  businessId,
  city = "Abidjan",
}: QuickBusinessShareMenuProps) {
  const [customMessage, setCustomMessage] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"templates" | "custom">("templates");
  const { stats, recordShare } = useProductShares(product.id);
  const { generateProductPost } = useSocialPost();

  // Generate trackable share URL
  const getShareUrl = useCallback(() => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/boutique/${businessId}/produit/${product.id}?ref=share`;
  }, [businessId, product.id]);

  // Format share message
  const getShareMessage = useCallback((platform: SharePlatform = 'whatsapp') => {
    // If using a template
    if (selectedTemplate) {
      return generateProductPost(selectedTemplate, {
        name: product.name,
        price: product.price,
        currency: product.currency || 'XOF',
        city,
        category: product.category,
        url: getShareUrl(),
      }, platform === 'copy_link' ? 'instagram' : platform as 'whatsapp' | 'facebook' | 'instagram' | 'twitter' | 'sms' | 'email');
    }
    
    // Custom message
    const priceText = `${product.price.toLocaleString()} ${product.currency || 'XOF'}`;
    const message = customMessage || `Découvrez ${product.name} chez ${businessName}`;
    return `${message}\n\n💰 ${priceText}\n\n🔗 ${getShareUrl()}`;
  }, [selectedTemplate, customMessage, product, businessName, getShareUrl, generateProductPost, city]);

  // Handle share action
  const handleShare = async (platform: SharePlatform) => {
    const shareUrl = getShareUrl();
    const shareMessage = getShareMessage(platform);
    const encodedMessage = encodeURIComponent(shareMessage);
    const encodedUrl = encodeURIComponent(shareUrl);

    // Record the share
    await recordShare(platform, { 
      template: selectedTemplate || 'custom', 
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

  // Apply template
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    setCustomMessage(""); // Clear custom message when selecting template
  };

  // Get suggested hashtags
  const suggestedHashtags = useCallback(() => {
    const categories: HashtagCategory[] = ['brand'];
    if (product.category) {
      const catKey = product.category.toLowerCase() as HashtagCategory;
      if (HASHTAGS[catKey]) categories.push(catKey);
    }
    const cityKey = city.toLowerCase().replace(/[éè]/g, 'e') as HashtagCategory;
    if (HASHTAGS[cityKey]) categories.push(cityKey);
    
    return buildHashtags(categories, { limit: 6 });
  }, [product.category, city]);

  const copyHashtags = async () => {
    await navigator.clipboard.writeText(suggestedHashtags());
    toast.success("Hashtags copiés !");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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

          {/* Tabs: Templates vs Custom */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "templates" | "custom")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Modèles
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-xs">
                ✏️ Personnalisé
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-3 mt-3">
              {/* Template Selection */}
              <div className="flex flex-wrap gap-2">
                {PRODUCT_TEMPLATES.map((template) => (
                  <Button
                    key={template.id}
                    variant={selectedTemplate === template.id ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleSelectTemplate(template.id)}
                  >
                    {template.emoji} {template.label}
                  </Button>
                ))}
              </div>

              {/* Template Preview */}
              {selectedTemplate && (
                <div className="p-3 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap max-h-32 overflow-y-auto border">
                  {getShareMessage('whatsapp')}
                </div>
              )}

              {/* Hashtags */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs flex-1 justify-start"
                  onClick={copyHashtags}
                >
                  <Hash className="h-3 w-3 mr-1" />
                  {suggestedHashtags().split(' ').slice(0, 3).join(' ')}...
                </Button>
                <Badge variant="secondary" className="text-xs">
                  Copier
                </Badge>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-3 mt-3">
              {/* Custom Message */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  💬 Message personnalisé
                </label>
                <Textarea
                  value={customMessage}
                  onChange={(e) => {
                    setCustomMessage(e.target.value);
                    setSelectedTemplate(null); // Clear template when typing custom
                  }}
                  placeholder="Ajoutez un message pour accompagner le partage..."
                  className="resize-none h-20"
                />
              </div>
            </TabsContent>
          </Tabs>

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