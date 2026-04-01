import { useState, useEffect } from 'react';
import { Gift, Share2, Copy, Check, Users, User } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCountrySafe } from '@/contexts/CountryContext';

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
  const { user } = useAuth();
  const countryCtx = useCountrySafe();
  const { circles, loading } = useFriendCircles();
  const { toast } = useToast();
  const [selectedCircles, setSelectedCircles] = useState<string[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [contacts, setContacts] = useState<{ id: string; name: string; phone: string | null }[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      if (!user) { setContacts([]); setContactsLoading(false); return; }
      const { data } = await supabase
        .from('contacts')
        .select('id, name, phone')
        .eq('user_id', user.id)
        .order('name');
      setContacts(data || []);
      setContactsLoading(false);
    };
    if (isOpen) fetchContacts();
  }, [isOpen, user]);

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

  const toggleContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
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

  const normalizePhoneForWhatsApp = (phone: string): string => {
    const cleaned = phone.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+')) {
      return cleaned.replace('+', '');
    }
    if (cleaned.startsWith('00')) {
      return cleaned.slice(2);
    }
    // Add country prefix for national numbers
    const prefix = (countryCtx?.country.phonePrefix || '+225').replace('+', '');
    return prefix + cleaned;
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(viralMessage);
    const selectedContactsWithPhone = contacts.filter(
      (c) => selectedContacts.includes(c.id) && c.phone
    );
    // Only target a specific number if exactly 1 contact with phone is selected
    if (selectedContactsWithPhone.length === 1) {
      const normalizedPhone = normalizePhoneForWhatsApp(selectedContactsWithPhone[0].phone!);
      window.open(`https://wa.me/${normalizedPhone}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
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

  const totalCircleMembers = circles
    .filter((c) => selectedCircles.includes(c.id))
    .reduce((sum, c) => sum + c.member_count, 0);
  const totalSelected = totalCircleMembers + selectedContacts.length;

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

        {/* Circles & Contacts list */}
        <div className="space-y-2 max-h-60 overflow-y-auto py-2">
          {(loading || contactsLoading) ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              {/* Circles */}
              {circles.length > 0 && (
                <>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">Cercles</p>
                  {circles.map((circle) => (
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
                  ))}
                </>
              )}

              {/* Individual contacts */}
              {contacts.length > 0 && (
                <>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 mt-3">Vos amis</p>
                  {contacts.map((contact) => (
                    <label
                      key={contact.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/30 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedContacts.includes(contact.id)}
                        onCheckedChange={() => toggleContact(contact.id)}
                      />
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{contact.name}</p>
                        {contact.phone && (
                          <p className="text-xs text-muted-foreground">{contact.phone}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </>
              )}

              {/* Empty state */}
              {circles.length === 0 && contacts.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Aucun ami ajouté.
                  <br />
                  Partagez directement le lien ci-dessous !
                </div>
              )}
            </>
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
