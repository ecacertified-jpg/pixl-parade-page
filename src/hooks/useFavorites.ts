import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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

const fetchFavorites = async (userId: string): Promise<EnrichedFavorite[]> => {
  const { data, error } = await supabase
    .from('user_favorites')
    .select(`*, products (*)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((item: any) => ({
    ...item,
    product: item.products,
  })) as EnrichedFavorite[];
};

export function useFavorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const queryKey = ['favorites', userId];

  const { data: favorites = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: () => fetchFavorites(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const stats = useMemo<FavoriteStats>(() => ({
    total: favorites.length,
    urgent: favorites.filter(f => f.priority_level === 'urgent').length,
    estimatedBudget: favorites.reduce((sum, f) => sum + (f.product?.price || 0), 0),
  }), [favorites]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['favorites'] });

  const addMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!userId) throw new Error('Not authenticated');
      const existing = favorites.find(f => f.product_id === productId);
      if (existing) throw new Error('ALREADY_EXISTS');

      const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: userId, product_id: productId, priority_level: 'medium', accept_alternatives: true, context_usage: [] });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Ajouté aux favoris", description: "L'article a été ajouté à votre liste de souhaits" });
    },
    onError: (error: Error) => {
      if (error.message === 'ALREADY_EXISTS') {
        toast({ title: "Déjà dans les favoris", description: "Cet article est déjà dans vos favoris" });
      } else if (error.message === 'Not authenticated') {
        toast({ title: "Connexion requise", description: "Veuillez vous connecter pour ajouter des favoris", variant: "destructive" });
      } else {
        toast({ title: "Erreur", description: "Impossible d'ajouter aux favoris", variant: "destructive" });
      }
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (favoriteId: string) => {
      const { error } = await supabase.from('user_favorites').delete().eq('id', favoriteId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Favori supprimé", description: "L'article a été retiré de vos favoris" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer le favori", variant: "destructive" });
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: async ({ favoriteId, updates }: { favoriteId: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from('user_favorites').update(updates).eq('id', favoriteId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour", variant: "destructive" });
    },
  });

  const updatePriority = async (favoriteId: string, priority: PriorityLevel) => {
    await updateFieldMutation.mutateAsync({ favoriteId, updates: { priority_level: priority } });
    toast({ title: "Priorité mise à jour", description: `Priorité changée en ${priority}` });
  };

  const updateOccasion = async (favoriteId: string, occasion: OccasionType | null) => {
    await updateFieldMutation.mutateAsync({ favoriteId, updates: { occasion_type: occasion } });
    toast({ title: "Occasion mise à jour", description: occasion ? `Occasion changée en ${occasion}` : "Occasion supprimée" });
  };

  const toggleAlternatives = async (favoriteId: string, accept: boolean) => {
    await updateFieldMutation.mutateAsync({ favoriteId, updates: { accept_alternatives: accept } });
  };

  const updateContextUsage = async (favoriteId: string, contexts: string[]) => {
    await updateFieldMutation.mutateAsync({ favoriteId, updates: { context_usage: contexts } });
  };

  const updateNotes = async (favoriteId: string, notes: string) => {
    await updateFieldMutation.mutateAsync({ favoriteId, updates: { notes } });
    toast({ title: "Notes mises à jour", description: "Vos notes ont été enregistrées" });
  };

  const addFavorite = async (productId: string) => {
    try {
      await addMutation.mutateAsync(productId);
      return true;
    } catch {
      return false;
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    await removeMutation.mutateAsync(favoriteId);
  };

  const isFavorite = (productId: string) => favorites.some(f => f.product_id === productId);
  const getFavoriteId = (productId: string) => favorites.find(f => f.product_id === productId)?.id;

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
    refresh: () => invalidate(),
  };
}
