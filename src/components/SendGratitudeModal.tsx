import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useContacts } from '@/hooks/useContacts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageCircleHeart, Sparkles, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Checkbox } from '@/components/ui/checkbox';

interface SendGratitudeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CollectiveFund {
  id: string;
  title: string;
}

const messageSuggestions = [
  "Merci pour tout ce que tu fais ! 💝",
  "Je suis reconnaissant(e) de t'avoir dans ma vie 🙏",
  "Merci pour ton soutien constant ! ✨",
  "Ta générosité me touche énormément 💖",
  "Merci d'être toujours là pour moi ! 🌟",
  "Ton amitié est un cadeau précieux 🎁",
];

export function SendGratitudeModal({ isOpen, onClose }: SendGratitudeModalProps) {
  const { contacts, loading: loadingContacts } = useContacts();
  const [selectedContactId, setSelectedContactId] = useState('');
  const [message, setMessage] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [linkToFund, setLinkToFund] = useState(false);
  const [selectedFundId, setSelectedFundId] = useState('');
  const [funds, setFunds] = useState<CollectiveFund[]>([]);
  const [loadingFunds, setLoadingFunds] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  // Charger les cagnottes de l'utilisateur
  useEffect(() => {
    if (linkToFund && isOpen) {
      loadUserFunds();
    }
  }, [linkToFund, isOpen]);

  const loadUserFunds = async () => {
    try {
      setLoadingFunds(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger les cagnottes où l'utilisateur a contribué
      const { data, error } = await supabase
        .from('fund_contributions')
        .select('fund_id, collective_funds(id, title)')
        .eq('contributor_id', user.id);

      if (error) throw error;

      const uniqueFunds = Array.from(
        new Map(
          data
            ?.filter(item => item.collective_funds)
            .map(item => [
              item.collective_funds.id,
              { id: item.collective_funds.id, title: item.collective_funds.title }
            ])
        ).values()
      ) as CollectiveFund[];

      setFunds(uniqueFunds);
    } catch (error) {
      console.error('Error loading funds:', error);
    } finally {
      setLoadingFunds(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedContactId || !message.trim()) return;

    try {
      setSending(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      // Insérer le message dans gratitude_wall
      const { error } = await supabase
        .from('gratitude_wall')
        .insert({
          beneficiary_id: selectedContactId,
          contributor_id: user.id,
          fund_id: linkToFund && selectedFundId ? selectedFundId : null,
          message_text: message.trim(),
          message_type: 'personal',
          is_public: isPublic,
        });

      if (error) throw error;

      // Animation de confettis si message public
      if (isPublic) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      const selectedContact = contacts.find(c => c.id === selectedContactId);
      toast({
        title: "Message envoyé ! 💝",
        description: `Votre message de gratitude a été envoyé à ${selectedContact?.name || 'votre contact'}`,
      });

      handleClose();
    } catch (error) {
      console.error('Error sending gratitude message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedContactId('');
    setMessage('');
    setIsPublic(true);
    setLinkToFund(false);
    setSelectedFundId('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircleHeart className="h-5 w-5 text-pink-500" />
            Envoyer un message de gratitude
          </DialogTitle>
          <DialogDescription>
            Remerciez quelqu'un qui compte pour vous
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Personne à remercier *</Label>
            <Select value={selectedContactId} onValueChange={setSelectedContactId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un contact" />
              </SelectTrigger>
              <SelectContent>
                {loadingContacts ? (
                  <SelectItem value="loading" disabled>Chargement...</SelectItem>
                ) : contacts.length === 0 ? (
                  <SelectItem value="empty" disabled>Aucun contact disponible</SelectItem>
                ) : (
                  contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="link-fund"
              checked={linkToFund}
              onCheckedChange={(checked) => setLinkToFund(checked as boolean)}
            />
            <label
              htmlFor="link-fund"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
            >
              <Gift className="h-4 w-4 text-accent" />
              Lier à une cagnotte existante
            </label>
          </div>

          {linkToFund && (
            <div className="space-y-2 pl-6">
              <Label>Cagnotte associée</Label>
              <Select value={selectedFundId} onValueChange={setSelectedFundId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une cagnotte" />
                </SelectTrigger>
                <SelectContent>
                  {loadingFunds ? (
                    <SelectItem value="loading" disabled>Chargement...</SelectItem>
                  ) : funds.length === 0 ? (
                    <SelectItem value="empty" disabled>Aucune cagnotte disponible</SelectItem>
                  ) : (
                    funds.map((fund) => (
                      <SelectItem key={fund.id} value={fund.id}>
                        {fund.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Votre message *</Label>
            <Textarea
              placeholder="Écrivez votre message de gratitude..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/500
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              Suggestions
            </div>
            <div className="flex flex-wrap gap-2">
              {messageSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setMessage(suggestion)}
                >
                  {suggestion.split(' ').slice(0, 3).join(' ')}...
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="public-toggle" className="text-sm font-medium">
                Rendre public
              </Label>
              <p className="text-xs text-muted-foreground">
                Les messages publics apparaissent sur le mur de gratitude
              </p>
            </div>
            <Switch
              id="public-toggle"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!selectedContactId || !message.trim() || sending}
              className="flex-1"
            >
              {sending ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
