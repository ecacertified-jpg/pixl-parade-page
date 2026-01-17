import { useState } from "react";
import { Copy, Mail, MessageCircle, Share2, X, Facebook, Smartphone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BusinessShareMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  businessName: string;
  businessType?: string;
}

export function BusinessShareMenu({
  open,
  onOpenChange,
  businessId,
  businessName,
  businessType,
}: BusinessShareMenuProps) {
  const [copied, setCopied] = useState(false);

  const businessUrl = `${window.location.origin}/boutique/${businessId}`;
  const shareText = `Découvre ${businessName} sur JOIE DE VIVRE ! ${businessType ? `(${businessType})` : ''} 🎁`;
  const fullMessage = `${shareText}\n\n${businessUrl}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(businessUrl);
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
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(businessUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
    onOpenChange(false);
  };

  const shareViaSMS = () => {
    const url = `sms:?body=${encodeURIComponent(fullMessage)}`;
    window.location.href = url;
    onOpenChange(false);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Découvre ${businessName} sur JOIE DE VIVRE !`);
    const body = encodeURIComponent(fullMessage);
    const url = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = url;
    onOpenChange(false);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${businessName} - JOIE DE VIVRE`,
          text: shareText,
          url: businessUrl,
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
            Partager cette boutique
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-4">
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
            <p className="text-xs text-muted-foreground mb-2">Lien de la boutique</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={businessUrl}
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
