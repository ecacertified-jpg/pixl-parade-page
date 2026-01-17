import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface LatestProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string | null;
}

interface FollowedShop {
  id: string;
  businessId: string;
  businessName: string;
  businessType: string | null;
  logoUrl: string | null;
  description: string | null;
  followedAt: string;
  latestProducts: LatestProduct[];
  totalProductCount: number;
}

interface UseFollowedShopsReturn {
  shops: FollowedShop[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  unfollowShop: (businessId: string, businessName: string) => Promise<void>;
}

export function useFollowedShops(): UseFollowedShopsReturn {
  const { user } = useAuth();
  const [shops, setShops] = useState<FollowedShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFollowedShops = useCallback(async () => {
    if (!user) {
      setShops([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Get all follows for the user
      const { data: follows, error: followsError } = await supabase
        .from('business_follows')
        .select('id, business_id, created_at')
        .eq('follower_id', user.id)
        .order('created_at', { ascending: false });

      if (followsError) throw followsError;

      if (!follows || follows.length === 0) {
        setShops([]);
        setLoading(false);
        return;
      }

      const businessIds = follows.map(f => f.business_id);

      // 2. Get business info
      const { data: businesses, error: businessError } = await supabase
        .from('business_public_info')
        .select('id, business_name, business_type, logo_url, description')
        .in('id', businessIds);

      if (businessError) throw businessError;

      // 3. Get products for each business (latest 3 per business)
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, price, currency, image_url, business_account_id')
        .in('business_account_id', businessIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Group products by business
      const productsByBusiness: Record<string, typeof products> = {};
      const productCountByBusiness: Record<string, number> = {};

      products?.forEach(product => {
        const bizId = product.business_account_id;
        if (bizId) {
          if (!productsByBusiness[bizId]) {
            productsByBusiness[bizId] = [];
          }
          productsByBusiness[bizId].push(product);
          productCountByBusiness[bizId] = (productCountByBusiness[bizId] || 0) + 1;
        }
      });

      // 4. Build the final shop list
      const businessMap = new Map(businesses?.map(b => [b.id, b]) || []);
      const followMap = new Map(follows.map(f => [f.business_id, f]));

      const formattedShops: FollowedShop[] = businessIds
        .map(bizId => {
          const business = businessMap.get(bizId);
          const follow = followMap.get(bizId);
          
          if (!business || !follow) return null;

          const bizProducts = productsByBusiness[bizId] || [];
          const latestProducts: LatestProduct[] = bizProducts.slice(0, 3).map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            currency: p.currency || 'F',
            imageUrl: p.image_url
          }));

          return {
            id: follow.id,
            businessId: bizId,
            businessName: business.business_name,
            businessType: business.business_type,
            logoUrl: business.logo_url,
            description: business.description,
            followedAt: follow.created_at,
            latestProducts,
            totalProductCount: productCountByBusiness[bizId] || 0
          };
        })
        .filter((shop): shop is FollowedShop => shop !== null);

      setShops(formattedShops);
    } catch (err) {
      console.error('Error fetching followed shops:', err);
      setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFollowedShops();
  }, [fetchFollowedShops]);

  const unfollowShop = useCallback(async (businessId: string, businessName: string) => {
    if (!user) {
      toast.error('Connectez-vous pour gérer vos abonnements');
      return;
    }

    try {
      const { error } = await supabase
        .from('business_follows')
        .delete()
        .eq('business_id', businessId)
        .eq('follower_id', user.id);

      if (error) throw error;

      // Update local state
      setShops(prev => prev.filter(shop => shop.businessId !== businessId));
      toast.success(`Vous ne suivez plus ${businessName}`);
    } catch (err) {
      console.error('Error unfollowing shop:', err);
      toast.error('Une erreur est survenue');
    }
  }, [user]);

  return {
    shops,
    loading,
    error,
    refetch: fetchFollowedShops,
    unfollowShop
  };
}
