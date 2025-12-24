import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Sparkles, Music, RefreshCw, Package, Check } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAIRecommendations, Recommendation } from "@/hooks/useAIRecommendations";
import { cn } from "@/lib/utils";

interface CreateSurpriseFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  beneficiaryContactId?: string;
  beneficiaryName?: string;
  occasion?: 'birthday' | 'wedding' | 'promotion' | 'other';
  onSuccess?: () => void;
}

export const CreateSurpriseFundModal = ({
  isOpen,
  onClose,
  beneficiaryContactId,
  beneficiaryName,
  occasion,
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
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
    price: number;
    image_url: string;
    vendor?: string;
  } | null>(null);

  // Hook pour les recommandations IA
  const { 
    recommendations, 
    loading: loadingRecs, 
    getRecommendations, 
    clearRecommendations 
  } = useAIRecommendations();

  // Charger les recommandations quand la modale s'ouvre
  useEffect(() => {
    if (isOpen && beneficiaryContactId) {
      getRecommendations({
        contactId: beneficiaryContactId,
        occasion: occasion,
      });
    }
    return () => {
      if (!isOpen) clearRecommendations();
    };
  }, [isOpen, beneficiaryContactId, occasion]);

  // Pré-remplir le titre quand la modale s'ouvre avec un bénéficiaire
  useEffect(() => {
    if (isOpen && beneficiaryName) {
      if (occasion === 'birthday') {
        setTitle(`Cadeau d'anniversaire pour ${beneficiaryName}`);
        setDescription(`Contribuez au cadeau d'anniversaire de ${beneficiaryName} !`);
      } else if (occasion === 'wedding') {
        setTitle(`Cadeau de mariage pour ${beneficiaryName}`);
      } else if (occasion === 'promotion') {
        setTitle(`Cadeau pour la promotion de ${beneficiaryName}`);
      } else if (beneficiaryName) {
        setTitle(`Cadeau pour ${beneficiaryName}`);
      }
    }
  }, [isOpen, beneficiaryName, occasion]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
      setTargetAmount("");
      setRevealDate(undefined);
      setSurpriseMessage("");
      setSongPrompt("");
      setIsSurprise(false);
      setSelectedProduct(null);
    }
  }, [isOpen]);

  // Gérer la sélection d'un produit
  const handleSelectProduct = (rec: Recommendation) => {
    if (!rec.product) return;
    
    if (selectedProduct?.id === rec.product.id) {
      // Désélectionner
      setSelectedProduct(null);
      setTargetAmount("");
    } else {
      // Sélectionner et pré-remplir le montant
      setSelectedProduct({
        id: rec.product.id,
        name: rec.product.name,
        price: rec.product.price,
        image_url: rec.product.image_url,
        vendor: rec.product.vendor
      });
      setTargetAmount(rec.product.price.toString());
    }
  };

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
          business_product_id: selectedProduct?.id || null,
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
            {beneficiaryName 
              ? `Cagnotte pour ${beneficiaryName}` 
              : `Créer une ${isSurprise ? "Cagnotte Surprise" : "Cagnotte"}`}
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

          {/* Section Suggestions IA */}
          {beneficiaryContactId && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Suggestions pour {beneficiaryName || "ce contact"}
              </Label>
              
              {(() => {
                // Filtrer pour n'afficher que les recommandations avec de vrais produits
                const realProductRecs = recommendations.filter(rec => rec.product !== null);
                
                if (loadingRecs) {
                  return (
                    <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Recherche de suggestions personnalisées...</span>
                    </div>
                  );
                }
                
                if (realProductRecs.length > 0) {
                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
                        {realProductRecs.slice(0, 6).map((rec) => {
                          const isSelected = selectedProduct?.id === rec.product?.id;
                          return (
                            <div
                              key={rec.product?.id || rec.productName}
                              onClick={() => handleSelectProduct(rec)}
                              className={cn(
                                "relative p-2 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md",
                                isSelected
                                  ? "border-primary bg-primary/10 shadow-sm"
                                  : "border-muted hover:border-primary/50"
                              )}
                            >
                              {isSelected && (
                                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                                  <Check className="h-3 w-3" />
                                </div>
                              )}
                              {rec.product?.image_url ? (
                                <img 
                                  src={rec.product.image_url} 
                                  alt={rec.productName}
                                  className="w-full h-20 object-cover rounded mb-2" 
                                />
                              ) : (
                                <div className="w-full h-20 bg-muted/50 rounded mb-2 flex items-center justify-center">
                                  <Package className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                              <p className="text-xs font-medium truncate">{rec.productName}</p>
                              {rec.product?.price && (
                                <p className="text-xs font-semibold text-primary">
                                  {rec.product.price.toLocaleString()} XOF
                                </p>
                              )}
                              {rec.product?.vendor && (
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {rec.product.vendor}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Affichage du produit sélectionné */}
                      {selectedProduct && (
                        <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/30">
                          <Package className="h-5 w-5 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              Produit sélectionné : {selectedProduct.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Le montant cible a été pré-rempli avec le prix du produit
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(null);
                              setTargetAmount("");
                            }}
                          >
                            Retirer
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                }
                
                // L'IA a répondu mais aucun produit réel ne correspond
                if (recommendations.length > 0 && realProductRecs.length === 0) {
                  return (
                    <div className="p-4 bg-muted/30 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">
                        Aucun produit correspondant trouvé. Définissez votre propre montant ci-dessous.
                      </p>
                    </div>
                  );
                }
                
                // Aucune recommandation
                return (
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                      Aucune suggestion disponible pour le moment
                    </p>
                  </div>
                );
              })()}
            </div>
          )}

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
