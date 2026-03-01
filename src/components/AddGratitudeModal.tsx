import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

interface AddGratitudeModalProps {
  isOpen: boolean;
  onClose: () => void;
  fundId: string;
  beneficiaryId: string;
  fundTitle: string;
}

const suggestionTemplates = [
  "Merci pour cette belle occasion de célébrer ensemble ! 🎉",
  "Je suis touché(e) de pouvoir contribuer à ce moment spécial. 💝",
  "C'est avec joie que je participe à cette belle initiative ! ✨",
  "Heureux(se) de faire partie de cette célébration ! 🌟",
];

const gratitudeSchema = z.object({
  message: z.string()
    .trim()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(500, "Le message ne peut pas dépasser 500 caractères"),
  fundId: z.string().uuid("Identifiant de cagnotte invalide"),
  beneficiaryId: z.string().uuid("Identifiant du bénéficiaire invalide"),
});

export const AddGratitudeModal = ({ isOpen, onClose, fundId, beneficiaryId, fundTitle }: AddGratitudeModalProps) => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) return;

    // Validate input
    const result = gratitudeSchema.safeParse({
      message,
      fundId,
      beneficiaryId,
    });

    if (!result.success) {
      toast({
        title: "Validation échouée",
        description: result.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('gratitude_wall')
        .insert({
          fund_id: fundId,
          contributor_id: user.id,
          beneficiary_id: beneficiaryId,
          message_type: 'personal',
          message_text: result.data.message,
          is_public: true,
        });

      if (error) throw error;

      toast({
        title: "Message publié ! 💝",
        description: "Votre message de gratitude a été ajouté au mur.",
      });

      setMessage("");
      onClose();
    } catch (error) {
      console.error('Error adding gratitude message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter votre message. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setMessage("");
    onClose();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Ajouter un message de gratitude
          </DialogTitle>
          <DialogDescription>
            Partagez vos sentiments pour cette belle contribution à "{fundTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Votre message</label>
            <Textarea
              placeholder="Écrivez un message personnel..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <span>Suggestions :</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestionTemplates.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={loading}
          >
            Passer
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || loading}
            className="gap-2"
          >
            <Heart className="h-4 w-4" />
            {loading ? "Publication..." : "Publier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
