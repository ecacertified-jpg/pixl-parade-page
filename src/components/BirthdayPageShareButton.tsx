import { useEffect, useState } from 'react';
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
  Users,
  Share2,
  ArrowLeft,
  Heart,
  Sparkles,
} from 'lucide-react';

const WHATSAPP_GROUPS = [
  {
    name: "JOIE DE VIVRE — Femmes d'Afrique",
    description: 'Une sororité bienveillante pour célébrer, échanger et se soutenir entre femmes.',
    url: 'https://chat.whatsapp.com/GhcUIjooYP8ILBXwpdv3QJ?mode=gi_t',
    emoji: '👩🏽‍🤝‍👩🏿',
  },
  {
    name: 'JOIE DE VIVRE — Rencontres (H/F)',
    description: 'Fais de belles rencontres, élargis ton cercle et trouve des proches qui célébreront ton anniversaire.',
    url: 'https://chat.whatsapp.com/EiybuqFFqyT9uB7fe1m3sm?mode=gi_t',
    emoji: '💞',
  },
  {
    name: 'JOIE DE VIVRE — Couples',
    description: 'Un espace pour les couples qui veulent partager, s’inspirer et fêter chaque moment précieux.',
    url: 'https://chat.whatsapp.com/IJSDnuADB9f6Le9iebhdoo?mode=gi_t',
    emoji: '💑',
  },
];

interface BirthdayPageShareButtonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firstName: string;
  pageUrl: string;
  age?: number | null;
}

export function BirthdayPageShareButton({ open, onOpenChange, firstName, pageUrl, age }: BirthdayPageShareButtonProps) {
  const [view, setView] = useState<'choice' | 'whatsapp_groups' | 'social'>('choice');

  useEffect(() => {
    if (open) setView('choice');
  }, [open]);

  const shareText = age
    ? `🎂🎉 ${firstName} fête ses ${age} ans !\n\nSon anniversaire approche et tu peux lui faire plaisir en 30 secondes :\n👉 Écris-lui un petit mot\n👉 Ajoute une photo souvenir\n👉 Participe au cadeau collectif\n\nClique ici, ça prend 30 secondes ⬇️`
    : `🎂🎉 C'est l'anniversaire de ${firstName} !\n\nTu peux lui faire plaisir en 30 secondes :\n👉 Écris-lui un petit mot\n👉 Ajoute une photo souvenir\n👉 Participe au cadeau collectif\n\nClique ici, ça prend 30 secondes ⬇️`;

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
          await navigator.clipboard.writeText(shareText + '\n\n' + pageUrl);
          toast.success('Message + lien copiés ! 📋');
          onOpenChange(false);
        } catch { toast.error('Erreur lors de la copie'); }
      },
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh]">
        {view === 'choice' && (
          <>
            <SheetHeader className="mb-4">
              <SheetTitle>🎉 Comment veux-tu partager ?</SheetTitle>
              <SheetDescription>
                Choisis le canal idéal pour faire vibrer l'anniversaire de {firstName}.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-3">
              <button
                onClick={() => setView('whatsapp_groups')}
                className="text-left rounded-xl border border-green-200 bg-green-50/60 hover:bg-green-50 transition-colors p-4 flex items-start gap-3"
              >
                <div className="p-3 rounded-full bg-white text-green-600 shrink-0">
                  <Users className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground flex items-center gap-1">
                    Groupes WhatsApp <Sparkles className="h-4 w-4 text-amber-500" />
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Rejoins des communautés bienveillantes JOIE DE VIVRE, tisse de nouvelles amitiés et reçois du soutien pour célébrer ton anniversaire 🎂
                  </p>
                </div>
              </button>

              <button
                onClick={() => setView('social')}
                className="text-left rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors p-4 flex items-start gap-3"
              >
                <div className="p-3 rounded-full bg-white text-primary shrink-0">
                  <Share2 className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground flex items-center gap-1">
                    Réseaux sociaux <Heart className="h-4 w-4 text-pink-500" />
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Partage ta page sur WhatsApp, Facebook, Instagram, X… et invite tous tes proches en un clic à participer.
                  </p>
                </div>
              </button>
            </div>
          </>
        )}

        {view === 'whatsapp_groups' && (
          <>
            <SheetHeader className="mb-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setView('choice')} aria-label="Retour">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="text-left">
                  <SheetTitle>👥 Rejoins nos groupes WhatsApp</SheetTitle>
                  <SheetDescription>
                    Tisse de nouvelles amitiés, partage des moments et entoure-toi de personnes qui célébreront ton anniversaire avec joie 🎉
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <div className="grid gap-3">
              {WHATSAPP_GROUPS.map((g) => (
                <a
                  key={g.url}
                  href={g.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-green-200 bg-green-50/50 hover:bg-green-50 transition-colors p-4 flex items-start gap-3"
                >
                  <div className="text-3xl shrink-0">{g.emoji}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{g.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{g.description}</p>
                  </div>
                  <MessageCircle className="h-5 w-5 text-green-600 shrink-0 mt-1" />
                </a>
              ))}
            </div>
          </>
        )}

        {view === 'social' && (
          <>
            <SheetHeader className="mb-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setView('choice')} aria-label="Retour">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="text-left">
                  <SheetTitle>🎉 Partager la page d'anniversaire</SheetTitle>
                  <SheetDescription>
                    Invite les proches de {firstName} à lui écrire un message ou participer au cadeau !
                  </SheetDescription>
                </div>
              </div>
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
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
