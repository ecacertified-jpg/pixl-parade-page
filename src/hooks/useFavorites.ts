import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';
export type OccasionType = 'birthday' | 'wedding' | 'promotion' | 'achievement' | 'christmas' | 'valentines' | 'other';

export interface EnrichedFavorite {
  id: string;
  user_id: string;
  product_id: string;
  notes: string | null;
  priority_level: PriorityLevel;
  occasion_type: OccasionType | null;
  accept_alternatives: boolean;
  context_usage: string[];
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    image_url: string | null;
    category_id: string | null;
  };
}

export interface FavoriteStats {
  total: number;
  urgent: number;
  estimatedBudget: number;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<EnrichedFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FavoriteStats>({ total: 0, urgent: 0, estimatedBudget: 0 });
  const { toast } = useToast();

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setFavorites([]);
        return;
      }

      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          *,
          products (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedFavorites = (data || []).map((item: any) => ({
        ...item,
        product: item.products
      })) as EnrichedFavorite[];
      setFavorites(enrichedFavorites);

      // Calculate stats
      const urgentCount = enrichedFavorites.filter(f => f.priority_level === 'urgent').length;
      const totalBudget = enrichedFavorites.reduce((sum, f) => sum + (f.product?.price || 0), 0);
      
      setStats({
        total: enrichedFavorites.length,
        urgent: urgentCount,
        estimatedBudget: totalBudget
      });

    } catch (error: any) {
      console.error('Error loading favorites:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les favoris",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePriority = async (favoriteId: string, priority: PriorityLevel) => {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .update({ priority_level: priority })
        .eq('id', favoriteId);

      if (error) throw error;

      await loadFavorites();
      toast({
        title: "Priorité mise à jour",
        description: `Priorité changée en ${priority}`,
      });
    } catch (error: any) {
      console.error('Error updating priority:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la priorité",
        variant: "destructive"
      });
    }
  };

  const updateOccasion = async (favoriteId: string, occasion: OccasionType | null) => {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .update({ occasion_type: occasion })
        .eq('id', favoriteId);

      if (error) throw error;

      await loadFavorites();
      toast({
        title: "Occasion mise à jour",
        description: occasion ? `Occasion changée en ${occasion}` : "Occasion supprimée",
      });
    } catch (error: any) {
      console.error('Error updating occasion:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'occasion",
        variant: "destructive"
      });
    }
  };

  const toggleAlternatives = async (favoriteId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .update({ accept_alternatives: accept })
        .eq('id', favoriteId);

      if (error) throw error;

      await loadFavorites();
    } catch (error: any) {
      console.error('Error toggling alternatives:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les préférences",
        variant: "destructive"
      });
    }
  };

  const updateContextUsage = async (favoriteId: string, contexts: string[]) => {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .update({ context_usage: contexts })
        .eq('id', favoriteId);

      if (error) throw error;

      await loadFavorites();
    } catch (error: any) {
      console.error('Error updating context usage:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le contexte",
        variant: "destructive"
      });
    }
  };

  const updateNotes = async (favoriteId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .update({ notes })
        .eq('id', favoriteId);

      if (error) throw error;

      await loadFavorites();
      toast({
        title: "Notes mises à jour",
        description: "Vos notes ont été enregistrées",
      });
    } catch (error: any) {
      console.error('Error updating notes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les notes",
        variant: "destructive"
      });
    }
  };

  const addFavorite = async (productId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Connexion requise",
          description: "Veuillez vous connecter pour ajouter des favoris",
          variant: "destructive"
        });
        return false;
      }

      // Check if already in favorites
      const existing = favorites.find(f => f.product_id === productId);
      if (existing) {
        toast({
          title: "Déjà dans les favoris",
          description: "Cet article est déjà dans vos favoris",
        });
        return false;
      }

      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          product_id: productId,
          priority_level: 'medium',
          accept_alternatives: true,
          context_usage: []
        });

      if (error) throw error;

      await loadFavorites();
      toast({
        title: "Ajouté aux favoris",
        description: "L'article a été ajouté à votre liste de souhaits",
      });
      return true;
    } catch (error: any) {
      console.error('Error adding favorite:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter aux favoris",
        variant: "destructive"
      });
      return false;
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      await loadFavorites();
      toast({
        title: "Favori supprimé",
        description: "L'article a été retiré de vos favoris",
      });
    } catch (error: any) {
      console.error('Error removing favorite:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le favori",
        variant: "destructive"
      });
    }
  };

  const isFavorite = (productId: string) => {
    return favorites.some(f => f.product_id === productId);
  };

  const getFavoriteId = (productId: string) => {
    return favorites.find(f => f.product_id === productId)?.id;
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  return {
    favorites,
    loading,
    stats,
    addFavorite,
    updatePriority,
    updateOccasion,
    toggleAlternatives,
    updateContextUsage,
    updateNotes,
    removeFavorite,
    isFavorite,
    getFavoriteId,
    refresh: loadFavorites
  };
}