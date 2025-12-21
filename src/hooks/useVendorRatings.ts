import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VendorRating {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  user: {
    first_name: string;
    avatar_url: string | null;
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
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['vendor-ratings', businessId],
    queryFn: async () => {
      if (!businessId) return { ratings: [], stats: null };

      // Get all products for this business
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('business_account_id', businessId)
        .eq('is_active', true);

      if (productsError) throw productsError;

      if (!productsData || productsData.length === 0) {
        return { ratings: [], stats: null };
      }

      const productIds = productsData.map(p => p.id);

      // Get ratings for these products with product info
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('product_ratings')
        .select(`
          id,
          rating,
          review_text,
          created_at,
          product_id,
          user_id,
          products:product_id (
            id,
            name,
            image_url
          )
        `)
        .in('product_id', productIds)
        .order('created_at', { ascending: false });

      if (ratingsError) throw ratingsError;

      // Get unique user IDs and fetch profiles from public_profiles view
      const userIds = [...new Set((ratingsData || []).map((r: any) => r.user_id))];

      let profilesMap: Record<string, { first_name: string; avatar_url: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('public_profiles')
          .select('user_id, first_name, avatar_url')
          .in('user_id', userIds);

        profilesData?.forEach(p => {
          profilesMap[p.user_id] = {
            first_name: p.first_name || 'Utilisateur',
            avatar_url: p.avatar_url || null,
          };
        });
      }

      // Combine data
      const formattedRatings: VendorRating[] = (ratingsData || []).map((r: any) => ({
        id: r.id,
        rating: r.rating,
        review_text: r.review_text,
        created_at: r.created_at,
        user: profilesMap[r.user_id] || null,
        product: r.products ? {
          id: r.products.id,
          name: r.products.name,
          image_url: r.products.image_url,
        } : { id: '', name: 'Produit', image_url: null },
      }));

      // Calculate stats
      let stats: VendorRatingStats | null = null;
      if (formattedRatings.length > 0) {
        stats = {
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
      }

      return { ratings: formattedRatings, stats };
    },
    enabled: !!businessId,
  });

  return {
    ratings: data?.ratings || [],
    stats: data?.stats || null,
    loading: isLoading,
    refetch,
  };
};
