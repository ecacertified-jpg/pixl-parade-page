import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProductRating {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    first_name: string;
    last_name: string;
  };
}

export interface RatingStats {
  product_id: string;
  rating_count: number;
  average_rating: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
}

export const useProductRatings = (productId: string) => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<ProductRating[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [userRating, setUserRating] = useState<ProductRating | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRatings = async () => {
    if (!productId) return;

    try {
      setLoading(true);

      // Load all ratings WITHOUT the problematic join
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('product_ratings')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (ratingsError) throw ratingsError;

      // Get unique user IDs
      const userIds = [...new Set((ratingsData || []).map(r => r.user_id))];

      // Fetch user profiles separately
      let profilesMap: Record<string, { first_name: string; last_name: string }> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);

        profilesData?.forEach(p => {
          profilesMap[p.user_id] = {
            first_name: p.first_name || '',
            last_name: p.last_name || '',
          };
        });
      }

      // Combine data
      const formattedRatings: ProductRating[] = (ratingsData || []).map((r) => ({
        id: r.id,
        product_id: r.product_id,
        user_id: r.user_id,
        rating: r.rating,
        review_text: r.review_text,
        created_at: r.created_at,
        updated_at: r.updated_at,
        user: profilesMap[r.user_id] || undefined,
      }));

      setRatings(formattedRatings);

      // Calculate stats
      if (formattedRatings.length > 0) {
        const stats: RatingStats = {
          product_id: productId,
          rating_count: formattedRatings.length,
          average_rating: parseFloat(
            (formattedRatings.reduce((sum, r) => sum + r.rating, 0) / formattedRatings.length).toFixed(1)
          ),
          five_star_count: formattedRatings.filter(r => r.rating === 5).length,
          four_star_count: formattedRatings.filter(r => r.rating === 4).length,
          three_star_count: formattedRatings.filter(r => r.rating === 3).length,
          two_star_count: formattedRatings.filter(r => r.rating === 2).length,
          one_star_count: formattedRatings.filter(r => r.rating === 1).length,
        };
        setStats(stats);
      } else {
        setStats(null);
      }

      // Check if user has already rated
      if (user) {
        const userRatingData = formattedRatings.find(r => r.user_id === user.id);
        setUserRating(userRatingData || null);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async (rating: number, reviewText?: string) => {
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabase
      .from('product_ratings')
      .upsert({
        product_id: productId,
        user_id: user.id,
        rating,
        review_text: reviewText || null,
      })
      .select()
      .single();

    if (error) throw error;

    await loadRatings();
    return data;
  };

  const deleteRating = async () => {
    if (!user || !userRating) return;

    const { error } = await supabase
      .from('product_ratings')
      .delete()
      .eq('id', userRating.id);

    if (error) throw error;

    await loadRatings();
  };

  useEffect(() => {
    loadRatings();
  }, [productId, user]);

  return {
    ratings,
    stats,
    userRating,
    loading,
    submitRating,
    deleteRating,
    refreshRatings: loadRatings,
  };
};
