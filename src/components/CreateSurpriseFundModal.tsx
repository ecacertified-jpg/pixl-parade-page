import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Sparkles, Music } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface CreateSurpriseFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  beneficiaryContactId?: string;
  onSuccess?: () => void;
}

export const CreateSurpriseFundModal = ({
  isOpen,
  onClose,
  beneficiaryContactId,
  onSuccess
}: CreateSurpriseFundModalProps) => {
  const { user } = useAuth();
  const [isSurprise, setIsSurprise] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [revealDate, setRevealDate] = useState<Date>();
  const [surpriseMessage, setSurpriseMessage] = useState("");
  const [songPrompt, setSongPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("collective_funds")
        .insert({
          creator_id: user.id,
          beneficiary_contact_id: beneficiaryContactId,
          title,
          description,
          target_amount: parseFloat(targetAmount),
          is_surprise: isSurprise,
          surprise_reveal_date: isSurprise && revealDate ? revealDate.toISOString() : null,
          surprise_message: isSurprise ? surpriseMessage : null,
          surprise_song_prompt: isSurprise && songPrompt ? songPrompt : null,
          status: "active"
        })
        .select()
        .single();

      if (error) throw error;

      // Appeler la fonction edge pour notifications de réciprocité (non-bloquant)
      if (data?.id) {
        try {
          console.log('🔔 Invoking notify-reciprocity for fund:', data.id);
          await supabase.functions.invoke('notify-reciprocity', {
            body: { fund_id: data.id }
          });
          console.log('✅ Notify-reciprocity invoked successfully');
        } catch (reciprocityError) {
          // Ne pas bloquer le flux si la notification échoue
          console.warn('⚠️ Error invoking notify-reciprocity (non-blocking):', reciprocityError);
        }
      }

      toast.success(
        isSurprise 
          ? "🎉 Surprise créée ! Les contributeurs peuvent maintenant participer en secret."
          : "Cagnotte créée avec succès !"
      );
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Error creating fund:", error);
      toast.error("Erreur lors de la création : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSurprise && <Sparkles className="h-5 w-5 text-primary animate-pulse" />}
            Créer une {isSurprise ? "Cagnotte Surprise" : "Cagnotte"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Toggle Mode Surprise */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5">
            <div className="space-y-1">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Mode Surprise Collective
              </Label>
              <p className="text-sm text-muted-foreground">
                Le bénéficiaire ne verra la cagnotte qu'à la date de révélation
              </p>
            </div>
            <Switch
              checked={isSurprise}
              onCheckedChange={setIsSurprise}
            />
          </div>

          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre de la cagnotte *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Cadeau d'anniversaire pour Marie"
              required
            />
          </div>

          {/* Montant cible */}
          <div className="space-y-2">
            <Label htmlFor="amount">Montant à atteindre (XOF) *</Label>
            <Input
              id="amount"
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="50000"
              required
              min="1"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Donnez plus de détails sur le cadeau ou l'occasion..."
              rows={3}
            />
          </div>

          {/* Options Surprise */}
          {isSurprise && (
            <div className="space-y-4 p-4 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              {/* Date de révélation */}
              <div className="space-y-2">
                <Label>Date de révélation *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {revealDate ? format(revealDate, "PPP", { locale: fr }) : "Choisir une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={revealDate}
                      onSelect={setRevealDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Message surprise */}
              <div className="space-y-2">
                <Label htmlFor="surprise-message">Message à révéler le jour J *</Label>
                <Textarea
                  id="surprise-message"
                  value={surpriseMessage}
                  onChange={(e) => setSurpriseMessage(e.target.value)}
                  placeholder="SURPRISE ! Tous tes amis se sont cotisés pour t'offrir ce cadeau..."
                  rows={4}
                  required={isSurprise}
                />
              </div>

              {/* Prompt chant IA */}
              <div className="space-y-2">
                <Label htmlFor="song-prompt" className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Chant IA personnalisé (optionnel)
                </Label>
                <Input
                  id="song-prompt"
                  value={songPrompt}
                  onChange={(e) => setSongPrompt(e.target.value)}
                  placeholder="Ex: Une chanson joyeuse d'anniversaire en français"
                />
                <p className="text-xs text-muted-foreground">
                  Un chant personnalisé sera généré et joué lors de la révélation
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || (isSurprise && !revealDate)}>
              {loading ? "Création..." : isSurprise ? "🎁 Créer la Surprise" : "Créer la Cagnotte"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
