import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
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
  MessageSquare,
  Calendar,
  ChevronRight,
} from 'lucide-react';

const FEMMES_COMMUNITY_URL = 'https://chat.whatsapp.com/GhcUIjooYP8ILBXwpdv3QJ?mode=gi_t';

const FEMMES_MONTH_GROUPS: Array<{ month: string; emoji: string; url: string }> = [
  { month: 'Janvier', emoji: '❄️', url: 'https://chat.whatsapp.com/GZRR4T5OYmBJZ3bhRvcOP3' },
  { month: 'Février', emoji: '💝', url: 'https://chat.whatsapp.com/DDLLe6BhJlBK8ytWXZRCzr' },
  { month: 'Mars', emoji: '🌸', url: 'https://chat.whatsapp.com/Cql7xPvtkfJ63X6CUshOY0' },
  { month: 'Avril', emoji: '🌷', url: 'https://chat.whatsapp.com/FWSvEIqUfkm0xPWiZ7QAXs' },
  { month: 'Mai', emoji: '🌺', url: 'https://chat.whatsapp.com/BRhMGwM4szRAmjEd8JmNI0' },
  { month: 'Juin', emoji: '☀️', url: 'https://chat.whatsapp.com/KyyOsJlAq5G4Kcz54vzqi2' },
  { month: 'Juillet', emoji: '🏖️', url: 'https://chat.whatsapp.com/HDF9h9A9ujl8JfOFlztgoL' },
  { month: 'Août', emoji: '🌻', url: 'https://chat.whatsapp.com/FPlNTzqB6DBGTGttnMF6oe' },
  { month: 'Septembre', emoji: '🍂', url: 'https://chat.whatsapp.com/J38MynWrsV570uEuqyznnH' },
  { month: 'Octobre', emoji: '🎃', url: 'https://chat.whatsapp.com/DKbpEjvBYbMJ2YWTvQJKBK' },
  { month: 'Novembre', emoji: '🍁', url: 'https://chat.whatsapp.com/LPlYFFIA3WK9CTkYHA00zM' },
  { month: 'Décembre', emoji: '🎄', url: 'https://chat.whatsapp.com/Cro3iYje5h38XSL48Ym3aU' },
];

const RENCONTRES_URL = 'https://chat.whatsapp.com/EiybuqFFqyT9uB7fe1m3sm?mode=gi_t';

const FESTIVE_MESSAGES = [
  "🎉 Génial ! Chaque partage rapproche un cadeau !",
  "✨ Wow ! Tes proches vont adorer participer !",
  "🚀 Super ! Plus tu partages, plus tu reçois de surprises !",
  "🎁 Génial ! Un ami de plus qui pourrait te gâter !",
  "🔥 Excellent ! Ta fête prend de l'ampleur !",
  "💜 Parfait ! L'amour se partage et revient au centuple !",
  "🌟 Trop bien ! Ton anniversaire va être inoubliable !",
  "🎊 Youpi ! Le bonheur se multiplie quand on le partage !",
];

const showFestiveToast = () => {
  const msg = FESTIVE_MESSAGES[Math.floor(Math.random() * FESTIVE_MESSAGES.length)];
  // Notifie les autres composants (ex: bulles d'onboarding) pour éviter le chevauchement d'animations
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('jdv:festive-toast', { detail: { duration: 4000 } }));
  }
  toast.success(msg, { duration: 4000 });
  confetti({
    particleCount: 25,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#a855f7', '#ec4899', '#f97316', '#22c55e', '#fbbf24'],
    disableForReducedMotion: true,
  });
};

interface BirthdayPageShareButtonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firstName: string;
  pageUrl: string;
  age?: number | null;
  onShared?: (method: string) => void;
}

export function BirthdayPageShareButton({ open, onOpenChange, firstName, pageUrl, age, onShared }: BirthdayPageShareButtonProps) {
  const [view, setView] = useState<
    'choice' | 'whatsapp_groups' | 'femmes' | 'femmes_months' | 'social'
  >('choice');

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
        showFestiveToast();
        onShared?.('native');
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
        showFestiveToast();
        onShared?.('whatsapp');
      },
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      bgColor: 'hover:bg-blue-50',
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`, '_blank', 'width=600,height=400,noopener,noreferrer');
        onShared?.('facebook');
        showFestiveToast();
      },
    },
    {
      name: 'Twitter / X',
      icon: Twitter,
      color: 'text-sky-600',
      bgColor: 'hover:bg-sky-50',
      action: () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`, '_blank');
        onShared?.('twitter');
        showFestiveToast();
      },
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-700',
      bgColor: 'hover:bg-blue-50',
      action: () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`, '_blank');
        onShared?.('linkedin');
        showFestiveToast();
      },
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'text-blue-500',
      bgColor: 'hover:bg-blue-50',
      action: () => {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
        onShared?.('telegram');
        showFestiveToast();
      },
    },
    {
      name: 'SMS',
      icon: MessageSquare,
      color: 'text-foreground',
      bgColor: 'hover:bg-muted',
      action: () => {
        window.location.href = `sms:?&body=${encodeURIComponent(shareText + '\n' + pageUrl)}`;
        onShared?.('sms');
        showFestiveToast();
      },
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'text-gray-600',
      bgColor: 'hover:bg-gray-50',
      action: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(`Anniversaire de ${firstName}`)}&body=${encodeURIComponent(shareText + '\n\n' + pageUrl)}`;
        onShared?.('email');
        showFestiveToast();
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
          showFestiveToast();
          onShared?.('copy');
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
              <button
                onClick={() => setView('femmes')}
                className="text-left rounded-xl border border-pink-200 bg-pink-50/60 hover:bg-pink-50 transition-colors p-4 flex items-start gap-3"
              >
                <div className="text-3xl shrink-0">👩🏽‍🤝‍👩🏿</div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">JOIE DE VIVRE — Femmes d'Afrique</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Une sororité bienveillante : communauté générale + groupe de ton mois de naissance.
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-pink-600 shrink-0 mt-1" />
              </button>

              <a
                href={RENCONTRES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-green-200 bg-green-50/50 hover:bg-green-50 transition-colors p-4 flex items-start gap-3"
              >
                <div className="text-3xl shrink-0">💞</div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">JOIE DE VIVRE — Rencontres (H/F)</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Fais de belles rencontres, élargis ton cercle et trouve des proches qui célébreront ton anniversaire.
                  </p>
                </div>
                <MessageCircle className="h-5 w-5 text-green-600 shrink-0 mt-1" />
              </a>
            </div>
          </>
        )}

        {view === 'femmes' && (
          <>
            <SheetHeader className="mb-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setView('whatsapp_groups')} aria-label="Retour">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="text-left">
                  <SheetTitle>👩🏽‍🤝‍👩🏿 JOIE DE VIVRE — Femmes d'Afrique</SheetTitle>
                  <SheetDescription>
                    Choisis le groupe que tu veux rejoindre.
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <div className="grid gap-3">
              <a
                href={FEMMES_COMMUNITY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-green-200 bg-green-50/50 hover:bg-green-50 transition-colors p-4 flex items-start gap-3"
              >
                <div className="text-3xl shrink-0">🌍</div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Communauté</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Tous les anniversaires — le grand groupe pour échanger toute l'année.
                  </p>
                </div>
                <MessageCircle className="h-5 w-5 text-green-600 shrink-0 mt-1" />
              </a>

              <button
                onClick={() => setView('femmes_months')}
                className="text-left rounded-xl border border-pink-200 bg-pink-50/60 hover:bg-pink-50 transition-colors p-4 flex items-start gap-3"
              >
                <div className="text-3xl shrink-0">🎂</div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Ton mois de célébration</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Rejoins le groupe des femmes nées dans ton mois d'anniversaire.
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-pink-600 shrink-0 mt-1" />
              </button>
            </div>
          </>
        )}

        {view === 'femmes_months' && (
          <>
            <SheetHeader className="mb-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setView('femmes')} aria-label="Retour">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="text-left">
                  <SheetTitle>🎂 Ton mois de célébration</SheetTitle>
                  <SheetDescription>
                    Choisis le mois de ton anniversaire pour rejoindre le bon groupe.
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[55vh] overflow-y-auto pr-1">
              {FEMMES_MONTH_GROUPS.map((g) => (
                <a
                  key={g.url}
                  href={g.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-pink-200 bg-pink-50/50 hover:bg-pink-50 transition-colors p-3 flex flex-col items-center gap-1 text-center"
                >
                  <div className="text-2xl">{g.emoji}</div>
                  <p className="text-sm font-semibold text-foreground">{g.month}</p>
                  <MessageCircle className="h-4 w-4 text-green-600" />
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
