import { useState } from "react";
import { Sparkles, Gift, RefreshCw, ChevronDown, ChevronUp, ShoppingCart, Heart, Eye } from "lucide-react";
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
  const { recommendations, generalAdvice, loading, error, getRecommendations, clearRecommendations } = useAIRecommendations();
  const { contacts } = useContacts();
  const { getProductFeedback, stats } = useSuggestionFeedback();
  
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {contactName ? `Suggestions pour ${contactName}` : "Recommandations IA"}
              </CardTitle>
              <CardDescription>
                {contactName 
                  ? "Basées sur son profil et votre historique" 
                  : "Des suggestions personnalisées pour vous"}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stats && (stats.accepted_count + stats.rejected_count) > 0 && (
              <Badge variant="secondary" className="text-xs">
                {stats.accepted_count + stats.rejected_count} feedbacks
              </Badge>
            )}
            {recommendations.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Nouvelle recherche
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

        {/* Error */}
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* General Advice */}
        {generalAdvice && (
          <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-primary/20">
            <div className="flex gap-3">
              <span className="text-xl flex-shrink-0">💡</span>
              <p className="font-nunito text-sm text-foreground/90 leading-relaxed">
                <span className="font-semibold text-primary">Conseil :</span> {generalAdvice}
              </p>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {filteredRecommendations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary/60" />
              <span className="font-medium font-nunito">
                {filteredRecommendations.length} suggestions pour vous
              </span>
            </div>
            
            {filteredRecommendations.map((rec, index) => {
              const existingFeedback = rec.product?.id ? getProductFeedback(rec.product.id) : null;
              
              return (
                <div
                  key={index}
                  className={cn(
                    "flex gap-4 p-5 bg-background rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md",
                    existingFeedback === 'accepted' && "border-green-200 bg-green-50/50 dark:bg-green-900/10",
                    existingFeedback === 'saved' && "border-amber-200 bg-amber-50/50 dark:bg-amber-900/10",
                    !existingFeedback && "hover:border-primary/30"
                  )}
                >
                  {rec.product?.image_url && (
                    <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={rec.product.image_url}
                        alt={rec.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="font-poppins font-semibold text-base leading-tight line-clamp-2">{rec.productName}</h5>
                        {rec.product?.price && (
                          <p className="font-poppins text-base text-primary font-bold mt-1">
                            {rec.product.price.toLocaleString()} {rec.product.currency || "XOF"}
                          </p>
                        )}
                      </div>
                      <Badge className={cn("flex-shrink-0", getScoreColor(rec.matchScore))}>
                        {rec.matchScore}% match
                      </Badge>
                    </div>
                    
                    <p className="font-nunito text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                      {rec.reason}
                    </p>
                    
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-primary font-medium mt-1"
                      onClick={() => setSelectedRecommendation(rec)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Voir plus
                    </Button>

                    {/* Feedback Buttons */}
                    {rec.product?.id && (
                      <div className="mt-3">
                        <SuggestionFeedbackButtons
                          productId={rec.product.id}
                          contactId={selectedContact || undefined}
                          occasion={selectedOccasion || undefined}
                          matchScore={rec.matchScore}
                          price={rec.product.price}
                          source="recommendation"
                          size="sm"
                        />
                      </div>
                    )}

                    {/* Action buttons if no feedback yet */}
                    {rec.product && !existingFeedback && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAddToFavorites?.(rec.product!.id)}
                        >
                          <Heart className="h-3 w-3 mr-1" />
                          Favoris
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onAddToCart?.(rec.product)}
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Ajouter
                        </Button>
                      </div>
                    )}
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
              {selectedRecommendation.product?.image_url && (
                <div className="w-full h-48 rounded-xl overflow-hidden bg-muted">
                  <img
                    src={selectedRecommendation.product.image_url}
                    alt={selectedRecommendation.productName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
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
                  onClick={() => {
                    onAddToFavorites?.(selectedRecommendation.product!.id);
                    setSelectedRecommendation(null);
                  }}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Favoris
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    onAddToCart?.(selectedRecommendation.product);
                    setSelectedRecommendation(null);
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
