import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useUpcomingBirthdays } from '@/hooks/useUpcomingBirthdays';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Cake, ArrowLeft, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SendBirthdayMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const messageSuggestions = [
  "Joyeux anniversaire ! 🎂 Que cette journée soit remplie de bonheur !",
  "Bonne fête ! 🎉 Profite bien de ta journée spéciale !",
  "Tous mes vœux pour cet anniversaire ! 🌟",
  "Joyeux anniversaire mon ami(e) ! 🎈 Que tous tes rêves se réalisent !",
  "Happy Birthday ! 🎊 Passe une merveilleuse journée !",
];

export function SendBirthdayMessageModal({ isOpen, onClose }: SendBirthdayMessageModalProps) {
  const { birthdays, loading } = useUpcomingBirthdays(7);
  const [selectedContact, setSelectedContact] = useState<typeof birthdays[0] | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSelectContact = (contact: typeof birthdays[0]) => {
    setSelectedContact(contact);
    setMessage('');
  };

  const handleBack = () => {
    setSelectedContact(null);
    setMessage('');
  };

  const handleSendMessage = async () => {
    if (!selectedContact || !message.trim()) return;

    try {
      setSending(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      // Insérer le message dans gratitude_wall
      const { error } = await supabase
        .from('gratitude_wall')
        .insert({
          beneficiary_id: selectedContact.id,
          contributor_id: user.id,
          fund_id: null,
          message_text: message.trim(),
          message_type: 'birthday',
          is_public: true,
        });

      if (error) throw error;

      // Animation de confettis
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast({
        title: "Message envoyé ! 🎉",
        description: `Votre message d'anniversaire a été envoyé à ${selectedContact.name}`,
      });

      onClose();
      setSelectedContact(null);
      setMessage('');
    } catch (error) {
      console.error('Error sending birthday message:', error);
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
    setSelectedContact(null);
    setMessage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedContact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mr-2 -ml-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Cake className="h-5 w-5 text-primary" />
            Célébrer un anniversaire
          </DialogTitle>
          <DialogDescription>
            {selectedContact 
              ? `Envoyez un message à ${selectedContact.name}`
              : 'Sélectionnez la personne dont c\'est l\'anniversaire'}
          </DialogDescription>
        </DialogHeader>

        {!selectedContact ? (
          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Chargement...</p>
            ) : birthdays.length === 0 ? (
              <div className="text-center py-8">
                <Cake className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Aucun anniversaire dans les 7 prochains jours 📅
                </p>
              </div>
            ) : (
              birthdays.map((contact) => (
                <Button
                  key={contact.id}
                  variant="outline"
                  className="w-full h-auto py-4 px-4 justify-start gap-4 hover:border-primary/30 hover:bg-primary/5"
                  onClick={() => handleSelectContact(contact)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {contact.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{contact.name}</span>
                      {contact.daysUntil === 0 ? (
                        <Badge variant="default" className="bg-primary">Aujourd'hui</Badge>
                      ) : (
                        <Badge variant="secondary">Dans {contact.daysUntil} jour{contact.daysUntil > 1 ? 's' : ''}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(contact.birthday).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                </Button>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {selectedContact.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedContact.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedContact.daysUntil === 0 ? "Aujourd'hui" : `Dans ${selectedContact.daysUntil} jour${selectedContact.daysUntil > 1 ? 's' : ''}`}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Votre message</label>
              <Textarea
                placeholder="Écrivez votre message d'anniversaire..."
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
                Suggestions rapides
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

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                Retour
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sending}
                className="flex-1"
              >
                {sending ? 'Envoi...' : 'Envoyer le message'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
