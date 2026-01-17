import { useState } from "react";
import { Copy, Mail, MessageCircle, Share2, Facebook, Smartphone, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useBusinessShareTracking, SharePlatform } from "@/hooks/useBusinessShareTracking";

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
  const [sharing, setSharing] = useState(false);
  const { recordShare } = useBusinessShareTracking(businessId);

  const baseUrl = `${window.location.origin}/b/${businessId}`;
  const shareText = `Découvre ${businessName} sur JOIE DE VIVRE ! ${businessType ? `(${businessType})` : ''} 🎁`;

  const getTrackableUrl = async (platform: SharePlatform): Promise<string> => {
    try {
      const token = await recordShare(platform);
      if (token) {
        return `${baseUrl}?ref=${token}`;
      }
    } catch (err) {
      console.error('Error creating trackable URL:', err);
    }
    return baseUrl;
  };

  const copyLink = async () => {
    setSharing(true);
    try {
      const url = await getTrackableUrl('copy');
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien");
    } finally {
      setSharing(false);
    }
  };

  const shareViaWhatsApp = async () => {
    setSharing(true);
    try {
      const url = await getTrackableUrl('whatsapp');
      const message = `${shareText}\n\n${url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
      onOpenChange(false);
    } finally {
      setSharing(false);
    }
  };

  const shareViaFacebook = async () => {
    setSharing(true);
    try {
      const url = await getTrackableUrl('facebook');
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`, "_blank");
      onOpenChange(false);
    } finally {
      setSharing(false);
    }
  };

  const shareViaSMS = async () => {
    setSharing(true);
    try {
      const url = await getTrackableUrl('sms');
      const message = `${shareText}\n\n${url}`;
      window.location.href = `sms:?body=${encodeURIComponent(message)}`;
      onOpenChange(false);
    } finally {
      setSharing(false);
    }
  };

  const shareViaEmail = async () => {
    setSharing(true);
    try {
      const url = await getTrackableUrl('email');
      const subject = encodeURIComponent(`Découvre ${businessName} sur JOIE DE VIVRE !`);
      const body = encodeURIComponent(`${shareText}\n\n${url}`);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      onOpenChange(false);
    } finally {
      setSharing(false);
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      setSharing(true);
      try {
        const url = await getTrackableUrl('native');
        await navigator.share({
          title: `${businessName} - JOIE DE VIVRE`,
          text: shareText,
          url: url,
        });
        onOpenChange(false);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast.error("Erreur lors du partage");
        }
      } finally {
        setSharing(false);
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
              disabled={sharing}
            >
              {sharing ? <Loader2 className="h-6 w-6 animate-spin" /> : <MessageCircle className="h-6 w-6" />}
              <span className="text-xs">WhatsApp</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600"
              onClick={shareViaFacebook}
              disabled={sharing}
            >
              {sharing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Facebook className="h-6 w-6" />}
              <span className="text-xs">Facebook</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-purple-50 hover:border-purple-500 hover:text-purple-600"
              onClick={shareViaSMS}
              disabled={sharing}
            >
              {sharing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Smartphone className="h-6 w-6" />}
              <span className="text-xs">SMS</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-orange-50 hover:border-orange-500 hover:text-orange-600"
              onClick={shareViaEmail}
              disabled={sharing}
            >
              {sharing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Mail className="h-6 w-6" />}
              <span className="text-xs">Email</span>
            </Button>
          </div>

          {/* Copy link section */}
          <div className="border rounded-lg p-3 bg-muted/50">
            <p className="text-xs text-muted-foreground mb-2">Lien de la boutique</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={baseUrl}
                readOnly
                className="flex-1 text-sm bg-background border rounded px-3 py-2 truncate"
              />
              <Button
                size="sm"
                variant={copied ? "default" : "outline"}
                onClick={copyLink}
                className="shrink-0"
                disabled={sharing}
              >
                {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Native share button (mobile) */}
          {typeof navigator !== "undefined" && navigator.share && (
            <Button
              className="w-full"
              variant="gradient"
              onClick={shareNative}
              disabled={sharing}
            >
              {sharing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Share2 className="h-4 w-4 mr-2" />}
              Partager via...
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
