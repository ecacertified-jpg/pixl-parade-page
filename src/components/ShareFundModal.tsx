import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Facebook, 
  MessageCircle, 
  Link as LinkIcon,
  Download,
  QrCode,
  Share2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ShareFundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fundId: string;
  fundTitle: string;
  fundDescription?: string;
}

export function ShareFundModal({ 
  open, 
  onOpenChange, 
  fundId, 
  fundTitle,
  fundDescription 
}: ShareFundModalProps) {
  const fundUrl = `${window.location.origin}/fund/${fundId}`;
  const shareText = `🎁 Contribuez à cette cagnotte : ${fundTitle}${fundDescription ? ` - ${fundDescription.substring(0, 80)}` : ''}`;

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
        await navigator.share({
          title: fundTitle,
          text: shareText,
          url: fundUrl,
        });
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
        const message = encodeURIComponent(shareText + '\n' + fundUrl);
        const url = `https://wa.me/?text=${message}`;
        window.open(url, '_blank', 'noopener,noreferrer');
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
          toast.success('Lien copié dans le presse-papier ! 📋');
          onOpenChange(false);
        } catch (error) {
          toast.error('Erreur lors de la copie du lien');
        }
      },
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Partager cette cagnotte</SheetTitle>
          <SheetDescription>
            Partagez avec vos proches pour collecter plus rapidement
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="share" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share">
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </TabsTrigger>
            <TabsTrigger value="qrcode">
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="space-y-4 mt-4">
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
  );
}