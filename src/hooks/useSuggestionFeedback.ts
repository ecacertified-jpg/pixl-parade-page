import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type FeedbackType = 'accepted' | 'rejected' | 'purchased' | 'saved';

export interface SuggestionFeedback {
  id: string;
  user_id: string;
  recommendation_id: string | null;
  product_id: string | null;
  contact_id: string | null;
  occasion: string | null;
  feedback_type: FeedbackType;
  feedback_reason: string | null;
  match_score: number | null;
  price_at_feedback: number | null;
  source: string;
  created_at: string;
  product?: {
    id: string;
    name: string;
    image_url: string | null;
    price: number;
  };
}

export interface FeedbackStats {
  accepted_count: number;
  rejected_count: number;
  purchased_count: number;
  saved_count: number;
  top_rejection_reasons: { reason: string; count: number }[];
  preferred_categories: { category: string; count: number }[];
}

const REJECTION_REASONS = [
  { value: 'too_expensive', label: 'Trop cher' },
  { value: 'not_their_style', label: 'Pas son style' },
  { value: 'already_gifted', label: 'Déjà offert' },
  { value: 'not_interested', label: 'Pas intéressé' },
  { value: 'other', label: 'Autre' },
];

export function useSuggestionFeedback() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedbackHistory, setFeedbackHistory] = useState<SuggestionFeedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [productFeedbackMap, setProductFeedbackMap] = useState<Map<string, FeedbackType>>(new Map());

  // Charger l'historique des feedbacks
  const fetchFeedbackHistory = useCallback(async (limit = 50) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suggestion_feedback')
        .select(`
          *,
          product:products(id, name, image_url, price)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const typedData = (data || []).map(item => ({
        ...item,
        feedback_type: item.feedback_type as FeedbackType,
      }));

      setFeedbackHistory(typedData);

      // Créer une map pour un accès rapide
      const map = new Map<string, FeedbackType>();
      typedData.forEach(f => {
        if (f.product_id) {
          map.set(f.product_id, f.feedback_type);
        }
      });
      setProductFeedbackMap(map);
    } catch (error) {
      console.error('[useSuggestionFeedback] Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Charger les statistiques
  const fetchStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .rpc('get_user_feedback_stats', { p_user_id: user.id });

      if (error) throw error;

      if (data && data.length > 0) {
        const row = data[0] as any;
        setStats({
          accepted_count: Number(row.accepted_count) || 0,
          rejected_count: Number(row.rejected_count) || 0,
          purchased_count: Number(row.purchased_count) || 0,
          saved_count: Number(row.saved_count) || 0,
          top_rejection_reasons: (Array.isArray(row.top_rejection_reasons) ? row.top_rejection_reasons : []) as { reason: string; count: number }[],
          preferred_categories: (Array.isArray(row.preferred_categories) ? row.preferred_categories : []) as { category: string; count: number }[],
        });
      }
    } catch (error) {
      console.error('[useSuggestionFeedback] Error fetching stats:', error);
    }
  }, [user?.id]);

  // Enregistrer un feedback
  const recordFeedback = async ({
    productId,
    recommendationId,
    contactId,
    occasion,
    feedbackType,
    feedbackReason,
    matchScore,
    priceAtFeedback,
    source = 'recommendation',
  }: {
    productId?: string;
    recommendationId?: string;
    contactId?: string;
    occasion?: string;
    feedbackType: FeedbackType;
    feedbackReason?: string;
    matchScore?: number;
    priceAtFeedback?: number;
    source?: string;
  }) => {
    if (!user?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour enregistrer vos préférences",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('suggestion_feedback')
        .upsert({
          user_id: user.id,
          product_id: productId || null,
          recommendation_id: recommendationId || null,
          contact_id: contactId || null,
          occasion: occasion || null,
          feedback_type: feedbackType,
          feedback_reason: feedbackReason || null,
          match_score: matchScore || null,
          price_at_feedback: priceAtFeedback || null,
          source,
        }, {
          onConflict: 'user_id,product_id,recommendation_id',
        });

      if (error) throw error;

      // Mettre à jour la map locale
      if (productId) {
        setProductFeedbackMap(prev => new Map(prev).set(productId, feedbackType));
      }

      // Rafraîchir l'historique et les stats
      await Promise.all([fetchFeedbackHistory(), fetchStats()]);

      const messages: Record<FeedbackType, string> = {
        accepted: "Préférence enregistrée ! 👍",
        rejected: "Noté, nous éviterons ce type de suggestion",
        purchased: "Achat enregistré ! 🎉",
        saved: "Ajouté à vos favoris",
      };

      toast({
        title: messages[feedbackType],
        duration: 2000,
      });

      return true;
    } catch (error) {
      console.error('[useSuggestionFeedback] Error recording feedback:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer votre feedback",
        variant: "destructive",
      });
      return false;
    }
  };

  // Obtenir le feedback pour un produit spécifique
  const getProductFeedback = (productId: string): FeedbackType | null => {
    return productFeedbackMap.get(productId) || null;
  };

  // Obtenir les produits rejetés (pour l'edge function)
  const getRejectedProductIds = (): string[] => {
    return feedbackHistory
      .filter(f => f.feedback_type === 'rejected' && f.product_id)
      .map(f => f.product_id as string);
  };

  // Obtenir les catégories préférées
  const getPreferredCategories = (): string[] => {
    return stats?.preferred_categories.map(c => c.category) || [];
  };

  // Supprimer un feedback
  const deleteFeedback = async (feedbackId: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('suggestion_feedback')
        .delete()
        .eq('id', feedbackId)
        .eq('user_id', user.id);

      if (error) throw error;

      await Promise.all([fetchFeedbackHistory(), fetchStats()]);

      toast({
        title: "Feedback supprimé",
        duration: 2000,
      });

      return true;
    } catch (error) {
      console.error('[useSuggestionFeedback] Error deleting feedback:', error);
      return false;
    }
  };

  // Réinitialiser toutes les préférences
  const resetAllFeedback = async () => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('suggestion_feedback')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setFeedbackHistory([]);
      setProductFeedbackMap(new Map());
      setStats(null);

      toast({
        title: "Préférences réinitialisées",
        description: "L'IA reprendra ses recommandations à zéro",
      });

      return true;
    } catch (error) {
      console.error('[useSuggestionFeedback] Error resetting feedback:', error);
      return false;
    }
  };

  // Charger les données au montage
  useEffect(() => {
    if (user?.id) {
      fetchFeedbackHistory();
      fetchStats();
    }
  }, [user?.id, fetchFeedbackHistory, fetchStats]);

  return {
    feedbackHistory,
    stats,
    loading,
    recordFeedback,
    getProductFeedback,
    getRejectedProductIds,
    getPreferredCategories,
    deleteFeedback,
    resetAllFeedback,
    refreshFeedback: fetchFeedbackHistory,
    refreshStats: fetchStats,
    REJECTION_REASONS,
  };
}
