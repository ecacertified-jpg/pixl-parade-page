import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Heart, Share2, AlertCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "@/hooks/useFavorites";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { FavoriteStatsBar } from "@/components/favorites/FavoriteStatsBar";
import { FavoriteFilters } from "@/components/favorites/FavoriteFilters";
import { EnrichedFavoriteCard } from "@/components/favorites/EnrichedFavoriteCard";

export default function Favorites() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    favorites,
    loading,
    stats,
    updatePriority,
    updateOccasion,
    toggleAlternatives,
    updateContextUsage,
    updateNotes,
    removeFavorite,
  } = useFavorites();

  const { preferences, completionScore } = useUserPreferences();

  const [selectedOccasion, setSelectedOccasion] = useState('all');
  const [sortBy, setSortBy] = useState('priority');

  // Filter and sort favorites
  const filteredAndSorted = favorites
    .filter(fav => {
      if (selectedOccasion === 'all') return true;
      return fav.occasion_type === selectedOccasion;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority_level] - priorityOrder[b.priority_level];
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'price_desc':
          return (b.product?.price || 0) - (a.product?.price || 0);
        case 'price_asc':
          return (a.product?.price || 0) - (b.product?.price || 0);
        default:
          return 0;
      }
    });

  const handleAddToCart = async (productId: string) => {
    const favorite = favorites.find(f => f.product?.id === productId);
    if (!favorite?.product) return;

    const product = favorite.product;

    // Add to localStorage cart
    const savedCart = localStorage.getItem('cart');
    const cartItems = savedCart ? JSON.parse(savedCart) : [];
    
    const existingItemIndex = cartItems.findIndex((item: any) => item.product_id === product.id);
    
    if (existingItemIndex > -1) {
      cartItems[existingItemIndex].quantity += 1;
    } else {
      cartItems.push({
        product_id: product.id,
        quantity: 1,
        price: product.price,
        name: product.name,
        image_url: product.image_url || '',
        currency: product.currency
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cartItems));
    window.dispatchEvent(new Event('cartUpdated'));

    toast({
      title: "Ajouté au panier",
      description: `${product.name} a été ajouté à votre panier`
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
                <h1 className="text-xl font-semibold">Ma Liste de Souhaits</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Gérez vos articles préférés et aidez vos proches à vous gâter
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/cart')}>
                <ShoppingCart className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Mes Préférences Card */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3 flex-1">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">Mes Préférences</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Complétez vos préférences pour que vos amis puissent mieux vous gâter !
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <Progress value={completionScore} className="flex-1 h-2" />
                      <span className="text-sm font-medium text-primary">{completionScore}%</span>
                    </div>
                    {completionScore < 100 && (
                      <div className="flex items-start gap-2 mt-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                          Plus votre profil est complet, plus vos amis sauront quoi vous offrir
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <Button onClick={() => navigate('/preferences')} size="sm">
                  {completionScore < 100 ? 'Compléter' : 'Modifier'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <FavoriteStatsBar 
            total={stats.total}
            urgent={stats.urgent}
            estimatedBudget={stats.estimatedBudget}
          />

          {/* Filters */}
          <FavoriteFilters
            selectedOccasion={selectedOccasion}
            onOccasionChange={setSelectedOccasion}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {favorites.length === 0 
                ? "Aucun favori pour le moment" 
                : "Aucun résultat pour ces filtres"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {favorites.length === 0
                ? "Explorez notre boutique et créez votre liste de souhaits !"
                : "Essayez de modifier vos filtres pour voir plus d'articles"}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/shop')}>
                Découvrir la boutique
              </Button>
              {favorites.length > 0 && (
                <Button variant="outline" onClick={() => { setSelectedOccasion('all'); setSortBy('priority'); }}>
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {filteredAndSorted.map((favorite) => (
              <EnrichedFavoriteCard
                key={favorite.id}
                favorite={favorite}
                onUpdatePriority={updatePriority}
                onUpdateOccasion={updateOccasion}
                onToggleAlternatives={toggleAlternatives}
                onUpdateContextUsage={updateContextUsage}
                onUpdateNotes={updateNotes}
                onRemove={removeFavorite}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}

        <div className="pb-20" />
      </main>
    </div>
  );
}