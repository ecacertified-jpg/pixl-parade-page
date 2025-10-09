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
  Send
} from 'lucide-react';

interface ShareMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postContent: string;
  authorName: string;
}

export function ShareMenu({ open, onOpenChange, postId, postContent, authorName }: ShareMenuProps) {
  const postUrl = `${window.location.origin}/post/${postId}`;
  const shareText = `${postContent.substring(0, 100)}${postContent.length > 100 ? '...' : ''} - Partagé par ${authorName} sur JOIE DE VIVRE`;

  // Détection mobile pour WhatsApp
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Fonction pour utiliser le Web Share API natif si disponible
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Publication de ${authorName}`,
          text: shareText,
          url: postUrl,
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
    // Option de partage natif (prioritaire - fonctionne sur tous les navigateurs modernes)
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
        const message = encodeURIComponent(shareText + '\n' + postUrl);
        const url = `https://wa.me/?text=${message}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        toast.success('Ouverture de WhatsApp...');
      },
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      bgColor: 'hover:bg-blue-50',
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');
        toast.success('Ouverture de Facebook...');
      },
    },
    {
      name: 'Twitter / X',
      icon: Twitter,
      color: 'text-sky-600',
      bgColor: 'hover:bg-sky-50',
      action: () => {
        const text = encodeURIComponent(shareText);
        const url = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(postUrl)}`;
        window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');
        toast.success('Ouverture de Twitter...');
      },
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-700',
      bgColor: 'hover:bg-blue-50',
      action: () => {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
        window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');
        toast.success('Ouverture de LinkedIn...');
      },
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'text-blue-500',
      bgColor: 'hover:bg-blue-50',
      action: () => {
        const url = `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        toast.success('Ouverture de Telegram...');
      },
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'text-gray-600',
      bgColor: 'hover:bg-gray-50',
      action: () => {
        const subject = `Publication de ${authorName} sur JOIE DE VIVRE`;
        const body = `${shareText}\n\nVoir la publication : ${postUrl}`;
        const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = url;
        toast.success('Ouverture de votre client email...');
      },
    },
    {
      name: 'Copier le lien',
      icon: LinkIcon,
      color: 'text-primary',
      bgColor: 'hover:bg-primary/10',
      action: async () => {
        try {
          await navigator.clipboard.writeText(postUrl);
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
      <SheetContent side="bottom" className="max-h-[85vh]">
        <SheetHeader className="mb-4">
          <SheetTitle>Partager cette publication</SheetTitle>
          <SheetDescription>
            Choisissez où vous souhaitez partager cette publication
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
          <p className="text-xs text-muted-foreground mb-2">Aperçu du lien :</p>
          <p className="text-xs font-mono text-foreground break-all">{postUrl}</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
