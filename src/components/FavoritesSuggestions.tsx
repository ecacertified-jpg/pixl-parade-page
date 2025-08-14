import { useEffect, useState } from "react";
import { Heart, Users, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface FavoriteSuggestion {
  product_id: string;
  product_name: string;
  product_description: string;
  product_price: number;
  product_currency: string;
  product_image_url: string;
  friend_count: number;
  friends_names: string;
}

export function FavoritesSuggestions() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<FavoriteSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSuggestions();
    }
  }, [user]);

  const loadSuggestions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_favorites_suggestions', {
        p_user_id: user.id
      });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          product_id: productId,
          notes: 'Suggéré par des amis'
        });

      if (error) throw error;
      
      // Remove from suggestions
      setSuggestions(prev => prev.filter(s => s.product_id !== productId));
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  if (loading || suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200/50">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-purple-500" />
        <h3 className="font-semibold text-foreground">Suggestions basées sur vos amis</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Ces articles sont populaires parmi vos amis
      </p>
      
      <div className="space-y-3">
        {suggestions.slice(0, 2).map((suggestion) => (
          <div key={suggestion.product_id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
              {suggestion.product_image_url ? (
                <img 
                  src={suggestion.product_image_url} 
                  alt={suggestion.product_name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Heart className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="font-medium text-sm">{suggestion.product_name}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {suggestion.product_price.toLocaleString()} {suggestion.product_currency}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {suggestion.friend_count} ami{suggestion.friend_count > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => addToFavorites(suggestion.product_id)}
              className="text-xs"
            >
              <Heart className="h-3 w-3 mr-1" />
              Ajouter
            </Button>
          </div>
        ))}
      </div>
      
      {suggestions.length > 2 && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          +{suggestions.length - 2} autre{suggestions.length - 2 > 1 ? 's' : ''} suggestion{suggestions.length - 2 > 1 ? 's' : ''}
        </p>
      )}
    </Card>
  );
}