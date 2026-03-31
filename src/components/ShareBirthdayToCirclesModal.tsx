import { useState } from 'react';
import { Gift, Share2, Copy, Check, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useFriendCircles } from '@/hooks/useFriendCircles';
import { getAppBaseUrl } from '@/utils/appUrl';

interface ShareBirthdayToCirclesModalProps {
  isOpen: boolean;
  onClose: () => void;
  birthdaySlug?: string;
  userName: string;
}

export function ShareBirthdayToCirclesModal({
  isOpen,
  onClose,
  birthdaySlug,
  userName,
}: ShareBirthdayToCirclesModalProps) {
  const { circles, loading } = useFriendCircles();
  const { toast } = useToast();
  const [selectedCircles, setSelectedCircles] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const birthdayUrl = birthdaySlug
    ? `${getAppBaseUrl()}/birthday/${birthdaySlug}`
    : '';

  const viralMessage = `🎂 C'est bientôt mon anniversaire ! 🎉\n\nÉcris-moi un petit mot, ajoute une photo souvenir ou participe au cadeau collectif 🎁\n\nClique ici, ça prend 30 secondes ⬇️\n\n${birthdayUrl}`;

  const toggleCircle = (circleId: string) => {
    setSelectedCircles((prev) =>
      prev.includes(circleId)
        ? prev.filter((id) => id !== circleId)
        : [...prev, circleId]
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(viralMessage);
      setCopied(true);
      toast({ title: 'Lien copié ! 📋', description: 'Partagez-le avec vos amis' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de copier', variant: 'destructive' });
    }
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(viralMessage);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `🎂 Anniversaire de ${userName}`,
          text: viralMessage,
          url: birthdayUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const totalSelected = circles
    .filter((c) => selectedCircles.includes(c.id))
    .reduce((sum, c) => sum + c.member_count, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-poppins flex items-center gap-2">
            🎂 Partagez votre page d'anniversaire !
          </DialogTitle>
          <DialogDescription>
            Sélectionnez vos cercles d'amis pour les inviter
          </DialogDescription>
        </DialogHeader>

        {/* Circles list */}
        <div className="space-y-2 max-h-60 overflow-y-auto py-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : circles.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Aucun cercle d'amis créé.
              <br />
              Partagez directement le lien ci-dessous !
            </div>
          ) : (
            circles.map((circle) => (
              <label
                key={circle.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/30 cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={selectedCircles.includes(circle.id)}
                  onCheckedChange={() => toggleCircle(circle.id)}
                />
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: circle.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{circle.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {circle.member_count} ami{circle.member_count > 1 ? 's' : ''}
                  </p>
                </div>
              </label>
            ))
          )}
        </div>

        {totalSelected > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {totalSelected} ami{totalSelected > 1 ? 's' : ''} sélectionné
            {totalSelected > 1 ? 's' : ''}
          </p>
        )}

        {/* Share actions */}
        <div className="space-y-2 pt-2">
          <Button
            className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleShareWhatsApp}
            disabled={!birthdayUrl}
          >
            <Share2 className="h-4 w-4" />
            Partager sur WhatsApp
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleNativeShare}
            disabled={!birthdayUrl}
          >
            <Gift className="h-4 w-4" />
            Partager via…
          </Button>

          <Button
            variant="ghost"
            className="w-full gap-2"
            onClick={handleCopyLink}
            disabled={!birthdayUrl}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copié !' : 'Copier le lien'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
