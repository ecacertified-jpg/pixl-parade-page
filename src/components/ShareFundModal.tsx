import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Facebook, 
  MessageCircle, 
  Link as LinkIcon,
  Download,
  QrCode,
  Share2,
  Loader2,
  Sparkles,
  Hash,
  Copy
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CollectiveFundShareCard } from './CollectiveFundShareCard';
import { useFundShareCard } from '@/hooks/useFundShareCard';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import { FUND_TEMPLATES, buildHashtags, getOccasionEmoji, type HashtagCategory, HASHTAGS } from '@/data/social-media-content';
import { useSocialPost } from '@/hooks/useSocialPost';

interface FundData {
  title: string;
  beneficiaryName: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  productImage?: string;
  productName?: string;
  occasion?: string;
  deadline?: string;
}

interface ShareFundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fundId: string;
  fundTitle: string;
  fundDescription?: string;
  targetAmount?: number;
  currentAmount?: number;
  currency?: string;
  occasion?: string;
  beneficiaryName?: string;
  productImage?: string;
  productName?: string;
  deadline?: string;
}

export function ShareFundModal({ 
  open, 
  onOpenChange, 
  fundId, 
  fundTitle,
  fundDescription,
  targetAmount,
  currentAmount,
  currency,
  occasion,
  beneficiaryName,
  productImage,
  productName,
  deadline,
}: ShareFundModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { generating, shareImageUrl, generateShareCard, getShareFile, reset } = useFundShareCard();
  const [fundData, setFundData] = useState<FundData | null>(null);
  const [loadingFundData, setLoadingFundData] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('creation');
  const { trackSocialShare } = useGoogleAnalytics();
  const { generateFundPost } = useSocialPost();

  // Use new /f/ URL for sharing (Edge Function with OG meta tags)
  const fundUrl = `${window.location.origin}/f/${fundId}`;
  const shareText = `🎁 Contribuez à cette cagnotte : ${fundTitle}${fundDescription ? ` - ${fundDescription.substring(0, 80)}` : ''}`;

  // Get suggested hashtags based on occasion
  const suggestedHashtags = useCallback(() => {
    const categories: HashtagCategory[] = ['brand'];
    if (occasion) {
      const occasionKey = occasion.toLowerCase().replace(/[éè]/g, 'e') as HashtagCategory;
      if (HASHTAGS[occasionKey]) categories.push(occasionKey);
    }
    return buildHashtags(categories, { limit: 6 });
  }, [occasion]);

  // Generate share message using template
  const getShareMessage = useCallback((platform: 'whatsapp' | 'facebook' | 'instagram' = 'whatsapp') => {
    if (!fundData) return shareText + '\n' + fundUrl;
    
    return generateFundPost(selectedTemplate, {
      beneficiary: fundData.beneficiaryName,
      occasion: fundData.occasion || 'cadeau',
      target: fundData.targetAmount,
      current: fundData.currentAmount,
      currency: fundData.currency,
      deadline: fundData.deadline,
      url: fundUrl,
    }, platform);
  }, [fundData, selectedTemplate, fundUrl, shareText, generateFundPost]);

  // Copy hashtags
  const copyHashtags = async () => {
    await navigator.clipboard.writeText(suggestedHashtags());
    toast.success('Hashtags copiés !');
  };

  // Fetch fund data if not provided via props
  useEffect(() => {
    async function fetchFundData() {
      // If all data is provided via props, use it directly
      if (targetAmount !== undefined && beneficiaryName) {
        setFundData({
          title: fundTitle,
          beneficiaryName: beneficiaryName,
          targetAmount: targetAmount,
          currentAmount: currentAmount || 0,
          currency: currency || 'XOF',
          productImage,
          productName,
          occasion,
          deadline,
        });
        return;
      }

      // Otherwise, fetch from database
      setLoadingFundData(true);
      try {
        const { data, error } = await supabase
          .from('collective_funds')
          .select(`
            id,
            title,
            target_amount,
            current_amount,
            currency,
            occasion,
            deadline_date,
            products:business_product_id (
              id,
              name,
              image_url
            ),
            contacts:beneficiary_contact_id (
              id,
              name
            )
          `)
          .eq('id', fundId)
          .single();

        if (!error && data) {
          const product = data.products as { id: string; name: string; image_url: string } | null;
          const contact = data.contacts as { id: string; name: string } | null;

          setFundData({
            title: data.title,
            beneficiaryName: contact?.name || beneficiaryName || 'un proche',
            targetAmount: data.target_amount,
            currentAmount: data.current_amount || 0,
            currency: data.currency || 'XOF',
            productImage: product?.image_url || productImage,
            productName: product?.name || productName,
            occasion: data.occasion || occasion,
            deadline: data.deadline_date || deadline,
          });
        }
      } catch (err) {
        console.error('Error fetching fund data for share card:', err);
      } finally {
        setLoadingFundData(false);
      }
    }

    if (open) {
      fetchFundData();
    }
  }, [open, fundId, fundTitle, targetAmount, currentAmount, currency, occasion, beneficiaryName, productImage, productName, deadline]);

  // Generate share card when modal opens and data is ready
  useEffect(() => {
    if (open && fundData && cardRef.current && !shareImageUrl && !generating) {
      // Small delay to ensure the card is rendered
      const timer = setTimeout(() => {
        generateShareCard(cardRef.current, fundId);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, fundData, fundId, generateShareCard, shareImageUrl, generating]);

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      reset();
      setSelectedTemplate('creation');
    }
  }, [open, reset]);

  const handleDownloadQR = () => {
    const svg = document.getElementById('fund-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `qrcode-${fundTitle.replace(/\s+/g, '-').toLowerCase()}.png`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success('QR code téléchargé ! 📥');
        }
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        // Try to share with image if available
        if (shareImageUrl) {
          const file = await getShareFile(shareImageUrl, fundTitle);
          if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: fundTitle,
              text: getShareMessage('whatsapp'),
              url: fundUrl,
              files: [file],
            });
            trackSocialShare('native', 'fund', fundId);
            toast.success('Partage effectué avec succès !');
            onOpenChange(false);
            return;
          }
        }
        
        // Fallback to share without image
        await navigator.share({
          title: fundTitle,
          text: getShareMessage('whatsapp'),
          url: fundUrl,
        });
        trackSocialShare('native', 'fund', fundId);
        toast.success('Partage effectué avec succès !');
        onOpenChange(false);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Erreur lors du partage');
        }
      }
    }
  };

  const shareOptions = [
    ...(navigator.share ? [{
      name: 'Partager...',
      icon: Share2,
      color: 'text-primary',
      bgColor: 'hover:bg-primary/10',
      action: nativeShare,
    }] : []),
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-600',
      bgColor: 'hover:bg-green-50 dark:hover:bg-green-950',
      action: () => {
        const message = encodeURIComponent(getShareMessage('whatsapp'));
        const url = `https://wa.me/?text=${message}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        trackSocialShare('whatsapp', 'fund', fundId);
        toast.success('Ouverture de WhatsApp...');
      },
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      bgColor: 'hover:bg-blue-50 dark:hover:bg-blue-950',
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fundUrl)}`;
        window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');
        trackSocialShare('facebook', 'fund', fundId);
        toast.success('Ouverture de Facebook...');
      },
    },
    {
      name: 'Copier le lien',
      icon: LinkIcon,
      color: 'text-primary',
      bgColor: 'hover:bg-primary/10',
      action: async () => {
        try {
          await navigator.clipboard.writeText(fundUrl);
          trackSocialShare('copy_link', 'fund', fundId);
          toast.success('Lien copié dans le presse-papier ! 📋');
          onOpenChange(false);
        } catch (error) {
          toast.error('Erreur lors de la copie du lien');
        }
      },
    },
  ];

  return (
    <>
      {/* Hidden share card for capture */}
      {fundData && (
        <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none">
          <CollectiveFundShareCard ref={cardRef} fund={fundData} />
        </div>
      )}

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Partager cette cagnotte</SheetTitle>
            <SheetDescription>
              Partagez avec vos proches pour collecter plus rapidement
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="share" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="share">
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </TabsTrigger>
              <TabsTrigger value="templates">
                <Sparkles className="h-4 w-4 mr-2" />
                Modèles
              </TabsTrigger>
              <TabsTrigger value="qrcode">
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="share" className="space-y-4 mt-4">
              {/* Share card preview */}
              {(generating || loadingFundData) ? (
                <div className="flex items-center justify-center py-8 bg-muted/30 rounded-lg">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <span className="text-sm text-muted-foreground">
                    Génération de l'aperçu...
                  </span>
                </div>
              ) : shareImageUrl ? (
                <div className="rounded-lg overflow-hidden shadow-md">
                  <img 
                    src={shareImageUrl} 
                    alt="Aperçu du partage" 
                    className="w-full h-auto"
                  />
                </div>
              ) : null}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {shareOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.name}
                      variant="outline"
                      onClick={option.action}
                      className={`h-auto flex-col gap-2 p-4 ${option.bgColor} transition-colors`}
                    >
                      <div className={`p-3 rounded-full bg-background ${option.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium">{option.name}</span>
                    </Button>
                  );
                })}
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Aperçu du lien :</p>
                <p className="text-xs font-mono text-foreground break-all">{fundUrl}</p>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4 mt-4">
              {/* Template selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">📝 Choisir un modèle de message</label>
                <div className="flex flex-wrap gap-2">
                  {FUND_TEMPLATES.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      {template.emoji} {template.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Message preview */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Aperçu du message</label>
                <div className="p-3 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap max-h-40 overflow-y-auto border">
                  {getShareMessage('whatsapp')}
                </div>
              </div>

              {/* Hashtags */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
                    {suggestedHashtags()}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs flex-shrink-0"
                  onClick={copyHashtags}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copier
                </Button>
              </div>

              {/* Copy message button */}
              <Button
                className="w-full"
                onClick={async () => {
                  await navigator.clipboard.writeText(getShareMessage('instagram'));
                  toast.success('Message copié !');
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copier le message
              </Button>
            </TabsContent>

            <TabsContent value="qrcode" className="space-y-4 mt-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <QRCodeSVG 
                    id="fund-qr-code"
                    value={fundUrl}
                    size={256}
                    level="H"
                    includeMargin
                  />
                </div>

                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">{fundTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    Scannez ce QR code pour accéder à la cagnotte
                  </p>
                </div>

                <Button 
                  onClick={handleDownloadQR}
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le QR Code
                </Button>

                <div className="w-full p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    💡 Astuce : Imprimez ce QR code sur vos invitations ou cartes pour faciliter les contributions
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  );
}