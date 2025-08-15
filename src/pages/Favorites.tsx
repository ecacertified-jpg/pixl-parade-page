import { useState, useEffect } from "react";
import { ArrowLeft, Heart, Plus, Trash2, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url: string;
  category_id: string;
}

interface Favorite {
  id: string;
  product_id: string;
  notes: string;
  created_at: string;
  product: Product;
}

export default function Favorites() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Mes Favoris | JOIE DE VIVRE";
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          id,
          product_id,
          notes,
          created_at,
          products (
            id,
            name,
            description,
            price,
            currency,
            image_url,
            category_id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedFavorites = data?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        notes: item.notes || '',
        created_at: item.created_at,
        product: item.products ? item.products as any as Product : {
          id: '',
          name: 'Produit introuvable',
          description: '',
          price: 0,
          currency: 'XOF',
          image_url: '',
          category_id: ''
        }
      })) || [];

      setFavorites(formattedFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos favoris",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
      toast({
        title: "Supprimé",
        description: "Article retiré de vos favoris"
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer cet article",
        variant: "destructive"
      });
    }
  };

  const addToCart = (product: Product) => {
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
        <div className="max-w-md mx-auto px-4 py-4">
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
                <div className="relative">
                  <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
                  {/* Ribbon bow */}
                  <div className="absolute -top-1 -right-1 w-3 h-3">
                    <div className="w-full h-full bg-yellow-400 rounded-sm rotate-45 relative">
                      <div className="absolute inset-0 bg-yellow-500 rounded-sm transform -rotate-90"></div>
                    </div>
                  </div>
                </div>
                <h1 className="text-xl font-semibold">Mes Favoris</h1>
              </div>
              <p className="text-sm text-muted-foreground">{favorites.length} article{favorites.length > 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="p-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/cart')}
                className="p-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6.5-5a2 2 0 104 0m-4 0a2 2 0 004 0" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {favorites.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="relative mx-auto mb-6 w-20 h-20">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-red-400 to-orange-400 rounded-full flex items-center justify-center">
                <Heart className="h-10 w-10 text-white fill-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <Gift className="h-4 w-4 text-yellow-800" />
              </div>
            </div>
            <h2 className="text-lg font-semibold mb-3 text-foreground">
              Aucun favori pour l'instant
            </h2>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
              Ajoutez des produits à vos favoris pour que vos amis<br />
              sachent quoi vous offrir !
            </p>
            <Button 
              onClick={() => navigate('/shop')} 
              className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-full font-medium"
            >
              Découvrir les produits
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <Card className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200/50">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-pink-500">💡</span>
                  <span className="text-pink-700">
                    Vos amis peuvent voir cette liste pour mieux vous gâter !
                  </span>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              {favorites.map((favorite) => (
                <Card key={favorite.id} className="overflow-hidden">
                  <div className="flex">
                    <div className="w-24 h-24 bg-muted">
                      {favorite.product.image_url ? (
                        <img 
                          src={favorite.product.image_url} 
                          alt={favorite.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gift className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-sm mb-1">{favorite.product.name}</h3>
                          <p className="text-xs text-muted-foreground mb-2">
                            {favorite.product.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {favorite.product.price.toLocaleString()} {favorite.product.currency}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFavorite(favorite.id)}
                          className="p-1 h-auto text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {favorite.notes && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Note: {favorite.notes}
                        </p>
                      )}
                      
                      <Button
                        size="sm"
                        onClick={() => addToCart(favorite.product)}
                        className="w-full bg-primary hover:bg-primary/90 text-xs"
                      >
                        Ajouter au panier
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        <div className="pb-20" />
      </main>
    </div>
  );
}