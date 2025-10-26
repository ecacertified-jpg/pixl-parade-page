import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Heart, Sparkles, Gift, Send } from "lucide-react";
import disMerciImage from "@/assets/dis-merci.jpeg";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Contributor {
  id: string;
  name: string;
  amount: number;
  avatar_url?: string;
}

interface ThanksModalProps {
  isOpen: boolean;
  onClose: () => void;
  giftId: string;
  giftName: string;
  fundId: string;
  contributors: Contributor[];
  onThanksSent?: () => void;
}

const emojis = ["❤️", "🙏", "🎉", "😊", "💝", "🌟", "🤗", "✨", "💐", "🎁"];

export function ThanksModal({ 
  isOpen, 
  onClose, 
  giftId,
  giftName,
  fundId,
  contributors,
  onThanksSent 
}: ThanksModalProps) {
  const [message, setMessage] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("❤️");
  const [isGroupMessage, setIsGroupMessage] = useState(true);
  const [selectedContributors, setSelectedContributors] = useState<string[]>(
    contributors.map(c => c.id)
  );
  const [isSending, setIsSending] = useState(false);

  const handleToggleContributor = (contributorId: string) => {
    setSelectedContributors(prev => 
      prev.includes(contributorId)
        ? prev.filter(id => id !== contributorId)
        : [...prev, contributorId]
    );
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Veuillez saisir un message de remerciement");
      return;
    }

    if (selectedContributors.length === 0) {
      toast.error("Veuillez sélectionner au moins un contributeur");
      return;
    }

    setIsSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Créer le message de remerciement
      const { data: thanksData, error: thanksError } = await supabase
        .from("gift_thanks")
        .insert({
          gift_id: giftId,
          collective_fund_id: fundId,
          sender_id: user.id,
          message: message.trim(),
          emoji: selectedEmoji,
          is_group_message: isGroupMessage
        })
        .select()
        .single();

      if (thanksError) throw thanksError;

      // Créer les entrées pour chaque destinataire
      const recipientsData = selectedContributors.map(contributorId => ({
        thank_message_id: thanksData.id,
        recipient_id: contributorId
      }));

      const { error: recipientsError } = await supabase
        .from("gift_thanks_recipients")
        .insert(recipientsData);

      if (recipientsError) throw recipientsError;

      // Créer des notifications pour chaque contributeur
      const contributorNames = contributors
        .filter(c => selectedContributors.includes(c.id))
        .map(c => c.name);

      const notificationsData = selectedContributors.map(contributorId => ({
        user_id: contributorId,
        notification_type: "thank_you_received",
        title: "Merci reçu ! 💝",
        message: `Vous avez reçu un message de remerciement pour votre contribution à "${giftName}"`,
        scheduled_for: new Date().toISOString(),
        delivery_methods: ["email", "push", "in_app"],
        metadata: {
          gift_id: giftId,
          fund_id: fundId,
          thanks_id: thanksData.id,
          emoji: selectedEmoji,
          message: message.trim()
        }
      }));

      await supabase.from("scheduled_notifications").insert(notificationsData);

      toast.success(
        isGroupMessage 
          ? `Remerciements envoyés à ${selectedContributors.length} contributeur(s) !`
          : "Remerciements envoyés !"
      );

      onThanksSent?.();
      onClose();
      setMessage("");
      setSelectedEmoji("❤️");
    } catch (error) {
      console.error("Erreur lors de l'envoi des remerciements:", error);
      toast.error("Impossible d'envoyer les remerciements");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">DIS MERCI</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image hero */}
          <div className="rounded-lg overflow-hidden">
            <img 
              src={disMerciImage} 
              alt="Dis Merci - Valeurs émotionnelles" 
              className="w-full h-auto"
            />
          </div>

          {/* Valeurs émotionnelles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
              <Heart className="h-6 w-6 text-primary shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Gratitude</h4>
                <p className="text-xs text-muted-foreground">
                  Exprimez votre reconnaissance sincère
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Émotion partagée</h4>
                <p className="text-xs text-muted-foreground">
                  Créez un moment de connexion authentique
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
              <Gift className="h-6 w-6 text-primary shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Valeur perçue</h4>
                <p className="text-xs text-muted-foreground">
                  Multipliez la joie de recevoir
                </p>
              </div>
            </div>
          </div>

          {/* Cadeau reçu */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Cadeau reçu</p>
            <p className="font-semibold">{giftName}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {contributors.length} contributeur{contributors.length > 1 ? "s" : ""}
            </p>
          </div>

          {/* Type de message */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <Label htmlFor="group-message" className="font-semibold">
                Message groupé
              </Label>
              <p className="text-sm text-muted-foreground">
                Envoyer le même message à tous les contributeurs
              </p>
            </div>
            <Switch
              id="group-message"
              checked={isGroupMessage}
              onCheckedChange={setIsGroupMessage}
            />
          </div>

          {/* Sélecteur d'émojis */}
          <div className="space-y-2">
            <Label>Choisissez un émoji</Label>
            <div className="flex flex-wrap gap-2">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`text-2xl p-2 rounded-lg transition-all ${
                    selectedEmoji === emoji
                      ? "bg-primary/20 scale-110"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Message de remerciement */}
          <div className="space-y-2">
            <Label htmlFor="message">Votre message de remerciement</Label>
            <Textarea
              id="message"
              placeholder="Exprimez votre gratitude avec vos propres mots..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Liste des contributeurs (si message individuel) */}
          {!isGroupMessage && (
            <div className="space-y-2">
              <Label>Sélectionnez les destinataires</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {contributors.map((contributor) => (
                  <label
                    key={contributor.id}
                    className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedContributors.includes(contributor.id)}
                      onChange={() => handleToggleContributor(contributor.id)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{contributor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Contribution: {contributor.amount} XOF
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Récapitulatif */}
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
            <span className="text-sm font-medium">
              Destinataires sélectionnés
            </span>
            <Badge variant="secondary">
              {selectedContributors.length} / {contributors.length}
            </Badge>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSending}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSend}
              className="flex-1 gap-2"
              disabled={isSending || !message.trim() || selectedContributors.length === 0}
            >
              <Send className="h-4 w-4" />
              {isSending ? "Envoi..." : "Envoyer mes remerciements"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
