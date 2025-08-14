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
                <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
                <h1 className="text-xl font-semibold">Mes Favoris</h1>
              </div>
              <p className="text-sm text-muted-foreground">{favorites.length} article{favorites.length > 1 ? 's' : ''}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/shop')}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Aucun favori pour le moment</h2>
            <p className="text-muted-foreground mb-6">
              Parcourez notre boutique et ajoutez vos articles préférés !
            </p>
            <Button onClick={() => navigate('/shop')} className="gap-2">
              <Plus className="h-4 w-4" />
              Explorer la boutique
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