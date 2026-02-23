import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  Mail, 
  Copy, 
  Share2,
  Facebook,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminShareMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareLink: string;
  code: string;
}

export const AdminShareMenu = ({ open, onOpenChange, shareLink, code }: AdminShareMenuProps) => {
  const message = `Rejoins Joie de Vivre ! 🎉✨\n\nClique sur ce lien pour t'inscrire et profiter de la plateforme :\n\n${shareLink}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success('Lien copié !');
  };

  const shareViaWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = 'Rejoins Joie de Vivre ! 🎉';
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  };

  const shareViaSMS = () => {
    window.location.href = `sms:?body=${encodeURIComponent(message)}`;
  };

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank', 'width=600,height=400');
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({ title: 'Joie de Vivre', text: message, url: shareLink }).catch(() => {});
    } else {
      copyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Partager mon lien ({code})</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={shareViaWhatsApp}>
            <MessageCircle className="h-6 w-6 text-green-600" />
            <span className="text-sm">WhatsApp</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={shareViaFacebook}>
            <Facebook className="h-6 w-6 text-blue-700" />
            <span className="text-sm">Facebook</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={shareViaSMS}>
            <Send className="h-6 w-6 text-purple-600" />
            <span className="text-sm">SMS</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={shareViaEmail}>
            <Mail className="h-6 w-6 text-blue-600" />
            <span className="text-sm">Email</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={copyLink}>
            <Copy className="h-6 w-6" />
            <span className="text-sm">Copier le lien</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={shareNative}>
            <Share2 className="h-6 w-6" />
            <span className="text-sm">Plus...</span>
          </Button>
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Votre lien :</p>
          <p className="text-sm font-mono break-all">{shareLink}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
