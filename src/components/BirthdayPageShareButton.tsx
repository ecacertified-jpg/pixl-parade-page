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
  Twitter,
  Linkedin,
  Mail,
  Link as LinkIcon,
  MessageCircle,
  Send,
} from 'lucide-react';

interface BirthdayPageShareButtonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firstName: string;
  pageUrl: string;
  age?: number | null;
}

export function BirthdayPageShareButton({ open, onOpenChange, firstName, pageUrl, age }: BirthdayPageShareButtonProps) {
  const shareText = age
    ? `🎉 ${firstName} fête ses ${age} ans ! 🎂 Écris-lui un message, ajoute une photo ou participe au cadeau collectif !`
    : `🎉 Joyeux anniversaire ${firstName} ! 🎂 Écris-lui un message, ajoute une photo ou participe au cadeau collectif !`;

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Anniversaire de ${firstName}`, text: shareText, url: pageUrl });
        toast.success('Partage effectué !');
        onOpenChange(false);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') toast.error('Erreur lors du partage');
      }
    }
  };

  const shareOptions = [
    ...(navigator.share ? [{
      name: 'Partager...',
      icon: LinkIcon,
      color: 'text-primary',
      bgColor: 'hover:bg-primary/10',
      action: nativeShare,
    }] : []),
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-600',
      bgColor: 'hover:bg-green-50',
      action: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + pageUrl)}`, '_blank', 'noopener,noreferrer');
        toast.success('Ouverture de WhatsApp...');
      },
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      bgColor: 'hover:bg-blue-50',
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`, '_blank', 'width=600,height=400,noopener,noreferrer');
      },
    },
    {
      name: 'Twitter / X',
      icon: Twitter,
      color: 'text-sky-600',
      bgColor: 'hover:bg-sky-50',
      action: () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`, '_blank');
      },
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-700',
      bgColor: 'hover:bg-blue-50',
      action: () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`, '_blank');
      },
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'text-blue-500',
      bgColor: 'hover:bg-blue-50',
      action: () => {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
      },
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'text-gray-600',
      bgColor: 'hover:bg-gray-50',
      action: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(`Anniversaire de ${firstName}`)}&body=${encodeURIComponent(shareText + '\n\n' + pageUrl)}`;
      },
    },
    {
      name: 'Copier le lien',
      icon: LinkIcon,
      color: 'text-primary',
      bgColor: 'hover:bg-primary/10',
      action: async () => {
        try {
          await navigator.clipboard.writeText(pageUrl);
          toast.success('Lien copié ! 📋');
          onOpenChange(false);
        } catch { toast.error('Erreur lors de la copie'); }
      },
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh]">
        <SheetHeader className="mb-4">
          <SheetTitle>🎉 Partager la page d'anniversaire</SheetTitle>
          <SheetDescription>
            Invite les proches de {firstName} à lui écrire un message ou participer au cadeau !
          </SheetDescription>
        </SheetHeader>

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

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Aperçu :</p>
          <p className="text-xs font-mono text-foreground break-all">{pageUrl}</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
