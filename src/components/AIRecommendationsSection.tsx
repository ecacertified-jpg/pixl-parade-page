import { useState, useEffect } from "react";
import { Sparkles, Gift, RefreshCw, ChevronDown, ChevronUp, ShoppingCart, Heart, Eye, Loader2 } from "lucide-react";
import { useGenerateProductImage } from "@/hooks/useGenerateProductImage";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAIRecommendations, Recommendation } from "@/hooks/useAIRecommendations";
import { useContacts } from "@/hooks/useContacts";
import { useSuggestionFeedback } from "@/hooks/useSuggestionFeedback";
import { SuggestionFeedbackButtons } from "@/components/SuggestionFeedbackButtons";
import { cn } from "@/lib/utils";

const occasions = [
  { value: "birthday", label: "Anniversaire" },
  { value: "wedding", label: "Mariage" },
  { value: "promotion", label: "Promotion" },
  { value: "academic", label: "Réussite académique" },
  { value: "christmas", label: "Noël" },
  { value: "valentine", label: "Saint-Valentin" },
  { value: "other", label: "Autre occasion" },
];

interface AIRecommendationsSectionProps {
  onAddToCart?: (product: any) => void;
  onAddToFavorites?: (productId: string) => void;
  defaultContactId?: string;
  contactName?: string;
}

export function AIRecommendationsSection({ 
  onAddToCart, 
  onAddToFavorites, 
  defaultContactId,
  contactName 
}: AIRecommendationsSectionProps) {
  const navigate = useNavigate();
  const { recommendations, generalAdvice, loading, error, getRecommendations, clearRecommendations } = useAIRecommendations();
  const { contacts } = useContacts();
  const { getProductFeedback, stats } = useSuggestionFeedback();
  const { generatedImages, loadingImages, generateImage } = useGenerateProductImage();

  // Générer automatiquement les images pour les produits sans image
  useEffect(() => {
    if (recommendations.length > 0 && !loading) {
      recommendations.forEach((rec, index) => {
        if (!rec.product?.image_url) {
          const key = `rec-${index}-${rec.productName}`;
          generateImage(key, {
            productName: rec.productName,
            description: rec.reason,
            category: rec.product?.categories?.name,
          });
        }
      });
    }
  }, [recommendations, loading]);
  
  const [showFilters, setShowFilters] = useState(!defaultContactId);
  const [selectedContact, setSelectedContact] = useState<string>(defaultContactId || "");
  const [selectedOccasion, setSelectedOccasion] = useState<string>("");
  const [budgetMin, setBudgetMin] = useState<string>("");
  const [budgetMax, setBudgetMax] = useState<string>("");
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);

  const handleGetRecommendations = async () => {
    await getRecommendations({
      contactId: selectedContact || undefined,
      occasion: selectedOccasion || undefined,
      budgetMin: budgetMin ? parseInt(budgetMin) : undefined,
      budgetMax: budgetMax ? parseInt(budgetMax) : undefined,
    });
    setShowFilters(false);
  };

  const handleReset = () => {
    clearRecommendations();
    setSelectedContact("");
    setSelectedOccasion("");
    setBudgetMin("");
    setBudgetMax("");
    setShowFilters(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400";
    if (score >= 60) return "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
    return "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
  };

  // Filtrer les produits déjà rejetés
  const filteredRecommendations = recommendations.filter(rec => {
    if (rec.product?.id) {
      const feedback = getProductFeedback(rec.product.id);
      return feedback !== 'rejected';
    }
    return true;
  });

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Section titre et icône */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl shadow-sm shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-0.5">
              <CardTitle className="font-poppins text-lg sm:text-xl whitespace-nowrap">
                {contactName ? `Suggestions pour ${contactName}` : "Recommandations IA"}
              </CardTitle>
              <CardDescription className="font-nunito text-muted-foreground/80">
                {contactName 
                  ? "Basées sur son profil et votre historique" 
                  : "Des suggestions personnalisées pour vous"}
              </CardDescription>
            </div>
          </div>
          
          {/* Section boutons */}
          <div className="flex items-center gap-2 shrink-0">
            {stats && (stats.accepted_count + stats.rejected_count) > 0 && (
              <Badge variant="secondary" className="text-xs font-nunito">
                {stats.accepted_count + stats.rejected_count} feedbacks
              </Badge>
            )}
            {recommendations.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset}
                className="text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Nouvelle recherche</span>
                <span className="sm:hidden">Refresh</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        {showFilters && (
          <div className="space-y-4 p-4 bg-background/50 rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Critères de recherche</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Pour qui ?</Label>
                <Select value={selectedContact} onValueChange={setSelectedContact}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un proche" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Moi-même</SelectItem>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Occasion</Label>
                <Select value={selectedOccasion} onValueChange={setSelectedOccasion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    {occasions.map((occasion) => (
                      <SelectItem key={occasion.value} value={occasion.value}>
                        {occasion.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Budget min (XOF)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Budget max (XOF)</Label>
                <Input
                  type="number"
                  placeholder="100000"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleGetRecommendations}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Obtenir des recommandations
                </>
              )}
            </Button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/10">
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-primary/20 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-primary/10 rounded-full w-3/4 animate-pulse" />
                  <div className="h-3 bg-primary/10 rounded-full w-1/2 animate-pulse" style={{ animationDelay: '0.1s' }} />
                </div>
              </div>
            </div>
            
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="flex gap-4 p-5 bg-background rounded-xl border shadow-sm animate-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-muted" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm animate-fade-in">
            {error}
          </div>
        )}

        {/* General Advice */}
        {generalAdvice && !loading && (
          <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-primary/20 animate-fade-in">
            <div className="flex gap-3">
              <span className="text-xl flex-shrink-0">💡</span>
              <p className="font-nunito text-sm text-foreground/90 leading-relaxed">
                <span className="font-semibold text-primary">Conseil :</span> {generalAdvice}
              </p>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {filteredRecommendations.length > 0 && !loading && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary/60" />
              <span className="font-medium font-nunito">
                {filteredRecommendations.length} suggestions pour vous
              </span>
            </div>
            
            {filteredRecommendations.map((rec, index) => {
              const existingFeedback = rec.product?.id ? getProductFeedback(rec.product.id) : null;
              const imageKey = `rec-${index}-${rec.productName}`;
              const generatedImage = generatedImages[imageKey];
              const isGeneratingImage = loadingImages[imageKey];
              
              return (
                <div
                  key={index}
                  className={cn(
                    "flex flex-col sm:flex-row gap-4 p-4 sm:p-5 bg-background rounded-xl border shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
                    existingFeedback === 'accepted' && "border-green-200 bg-green-50/50 dark:bg-green-900/10",
                    existingFeedback === 'saved' && "border-amber-200 bg-amber-50/50 dark:bg-amber-900/10",
                    !existingFeedback && "hover:border-primary/30"
                  )}
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    animation: 'fade-in 0.4s ease-out forwards'
                  }}
                >
                  {/* Image Section - Plus grande et responsive */}
                  {rec.product?.image_url ? (
                    <div className="w-full sm:w-32 h-40 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-muted group cursor-pointer" onClick={() => setSelectedRecommendation(rec)}>
                      <img
                        src={rec.product.image_url}
                        alt={rec.productName}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : generatedImage ? (
                    <div className="w-full sm:w-32 h-40 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-muted group cursor-pointer relative" onClick={() => setSelectedRecommendation(rec)}>
                      <img
                        src={generatedImage}
                        alt={rec.productName}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <Badge className="absolute top-2 right-2 text-xs bg-primary/80 text-primary-foreground">
                        <Sparkles className="h-3 w-3 mr-1" />
                        IA
                      </Badge>
                    </div>
                  ) : isGeneratingImage ? (
                    <div className="w-full sm:w-32 h-40 sm:h-32 flex-shrink-0 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                      <span className="text-xs text-muted-foreground font-nunito">Génération...</span>
                    </div>
                  ) : (
                    <div className="w-full sm:w-32 h-40 sm:h-32 flex-shrink-0 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      <Gift className="h-10 w-10 text-primary/40" />
                    </div>
                  )}
                  
                  {/* Content Section */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    {/* Header: Titre, Prix et Badge */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-poppins font-semibold text-base sm:text-lg leading-tight line-clamp-2 text-foreground">
                          {rec.productName}
                        </h5>
                        {rec.product?.price && (
                          <p className="font-poppins text-lg sm:text-xl text-primary font-bold mt-1">
                            {rec.product.price.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">{rec.product.currency || "XOF"}</span>
                          </p>
                        )}
                      </div>
                      <Badge className={cn("flex-shrink-0 text-xs font-medium px-2.5 py-1", getScoreColor(rec.matchScore))}>
                        {rec.matchScore}% match
                      </Badge>
                    </div>
                    
                    {/* Reason - Mieux formatée */}
                    <p className="font-nunito text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                      {rec.reason}
                    </p>
                    
                    {/* Actions Row */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary hover:bg-primary/10 h-8 px-2"
                        onClick={() => setSelectedRecommendation(rec)}
                      >
                        <Eye className="h-4 w-4 mr-1.5" />
                        <span className="text-xs font-medium">Détails</span>
                      </Button>

                      {/* Feedback Buttons */}
                      {rec.product?.id && (
                        <SuggestionFeedbackButtons
                          productId={rec.product.id}
                          contactId={selectedContact || undefined}
                          occasion={selectedOccasion || undefined}
                          matchScore={rec.matchScore}
                          price={rec.product.price}
                          source="recommendation"
                          size="sm"
                        />
                      )}

                      {/* Action buttons if no feedback yet */}
                      {rec.product && !existingFeedback && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs"
                            onClick={() => onAddToFavorites?.(rec.product!.id)}
                          >
                            <Heart className="h-3.5 w-3.5 mr-1" />
                            Favoris
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 px-3 text-xs bg-primary hover:bg-primary/90"
                            onClick={() => onAddToCart?.(rec.product)}
                          >
                            <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                            Ajouter
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRecommendations.length === 0 && !error && !showFilters && (
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucune recommandation pour le moment</p>
            <Button variant="link" onClick={() => setShowFilters(true)}>
              Modifier les critères
            </Button>
          </div>
        )}
      </CardContent>

      {/* Detail Modal */}
      <Dialog open={!!selectedRecommendation} onOpenChange={(open) => !open && setSelectedRecommendation(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-poppins text-lg leading-tight">
              {selectedRecommendation?.productName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRecommendation && (
            <div className="space-y-4">
              {(() => {
                // Trouver l'index pour récupérer l'image générée
                const recIndex = filteredRecommendations.findIndex(r => r.productName === selectedRecommendation.productName);
                const imageKey = `rec-${recIndex}-${selectedRecommendation.productName}`;
                const generatedImage = generatedImages[imageKey];
                const imageUrl = selectedRecommendation.product?.image_url || generatedImage;
                
                return imageUrl ? (
                  <div className="w-full h-48 rounded-xl overflow-hidden bg-muted relative">
                    <img
                      src={imageUrl}
                      alt={selectedRecommendation.productName}
                      className="w-full h-full object-cover"
                    />
                    {!selectedRecommendation.product?.image_url && generatedImage && (
                      <Badge className="absolute top-2 right-2 text-xs bg-primary/80 text-primary-foreground">
                        <Sparkles className="h-3 w-3 mr-1" />
                        IA
                      </Badge>
                    )}
                  </div>
                ) : null;
              })()}
              
              <div className="flex items-center justify-between">
                {selectedRecommendation.product?.price && (
                  <p className="font-poppins text-xl text-primary font-bold">
                    {selectedRecommendation.product.price.toLocaleString()} {selectedRecommendation.product.currency || "XOF"}
                  </p>
                )}
                <Badge className={cn("flex-shrink-0", getScoreColor(selectedRecommendation.matchScore))}>
                  {selectedRecommendation.matchScore}% match
                </Badge>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-poppins font-semibold text-sm text-foreground">Pourquoi ce cadeau ?</h4>
                <p className="font-nunito text-sm text-muted-foreground leading-relaxed">
                  {selectedRecommendation.reason}
                </p>
              </div>

              {selectedRecommendation.product?.description && (
                <div className="space-y-2">
                  <h4 className="font-poppins font-semibold text-sm text-foreground">Description</h4>
                  <p className="font-nunito text-sm text-muted-foreground leading-relaxed">
                    {selectedRecommendation.product.description}
                  </p>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={!selectedRecommendation.product?.id}
                  onClick={() => {
                    if (selectedRecommendation.product?.id) {
                      onAddToFavorites?.(selectedRecommendation.product.id);
                      toast.success("Ajouté aux favoris ❤️", {
                        description: `${selectedRecommendation.productName} a été ajouté à vos favoris`,
                      });
                      setSelectedRecommendation(null);
                    } else {
                      toast.error("Produit non disponible");
                    }
                  }}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Favoris
                </Button>
                <Button
                  className="flex-1"
                  disabled={!selectedRecommendation.product}
                  onClick={() => {
                    if (selectedRecommendation.product) {
                      onAddToCart?.(selectedRecommendation.product);
                      toast.success("Ajouté au panier 🛒", {
                        description: `${selectedRecommendation.productName} a été ajouté`,
                        action: {
                          label: "Voir le panier",
                          onClick: () => navigate('/cart'),
                        },
                      });
                      setSelectedRecommendation(null);
                    } else {
                      toast.error("Produit non disponible");
                    }
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Ajouter au panier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
