import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VendorRating {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
  } | null;
  product: {
    id: string;
    name: string;
    image_url: string | null;
  };
}

export interface VendorRatingStats {
  totalRatings: number;
  averageRating: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
}

export const useVendorRatings = (businessId: string | undefined) => {
  const [ratings, setRatings] = useState<VendorRating[]>([]);
  const [stats, setStats] = useState<VendorRatingStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRatings = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get all products for this business
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('business_account_id', businessId)
        .eq('is_active', true);

      if (productsError) throw productsError;

      if (!productsData || productsData.length === 0) {
        setRatings([]);
        setStats(null);
        setLoading(false);
        return;
      }

      const productIds = productsData.map(p => p.id);

      // Get ratings for these products with user and product info
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('product_ratings')
        .select(`
          id,
          rating,
          review_text,
          created_at,
          product_id,
          user_id,
          profiles:user_id (
            first_name,
            last_name
          ),
          products:product_id (
            id,
            name,
            image_url
          )
        `)
        .in('product_id', productIds)
        .order('created_at', { ascending: false });

      if (ratingsError) throw ratingsError;

      const formattedRatings: VendorRating[] = (ratingsData || []).map((r: any) => ({
        id: r.id,
        rating: r.rating,
        review_text: r.review_text,
        created_at: r.created_at,
        user: r.profiles ? {
          first_name: r.profiles.first_name || 'Utilisateur',
          last_name: r.profiles.last_name || '',
        } : null,
        product: r.products ? {
          id: r.products.id,
          name: r.products.name,
          image_url: r.products.image_url,
        } : { id: '', name: 'Produit', image_url: null },
      }));

      setRatings(formattedRatings);

      // Calculate stats
      if (formattedRatings.length > 0) {
        const calculatedStats: VendorRatingStats = {
          totalRatings: formattedRatings.length,
          averageRating: parseFloat(
            (formattedRatings.reduce((sum, r) => sum + r.rating, 0) / formattedRatings.length).toFixed(1)
          ),
          fiveStarCount: formattedRatings.filter(r => r.rating === 5).length,
          fourStarCount: formattedRatings.filter(r => r.rating === 4).length,
          threeStarCount: formattedRatings.filter(r => r.rating === 3).length,
          twoStarCount: formattedRatings.filter(r => r.rating === 2).length,
          oneStarCount: formattedRatings.filter(r => r.rating === 1).length,
        };
        setStats(calculatedStats);
      } else {
        setStats(null);
      }
    } catch (error) {
      console.error('Error loading vendor ratings:', error);
      setRatings([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadRatings();
  }, [loadRatings]);

  return {
    ratings,
    stats,
    loading,
    refetch: loadRatings,
  };
};
