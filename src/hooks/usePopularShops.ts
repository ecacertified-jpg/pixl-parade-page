import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PopularShop {
  id: string;
  name: string;
  logo: string | null;
  type: string | null;
  rating: number | null;
  ratingCount: number;
  productCount: number;
}

async function fetchPopularShops(): Promise<PopularShop[]> {
  const { data: businesses, error } = await supabase
    .from('business_public_info')
    .select('id, business_name, logo_url, business_type')
    .eq('is_active', true)
    .limit(10);

  if (error) {
    console.error('Error loading popular shops:', error);
    return [];
  }

  if (!businesses || businesses.length === 0) return [];

  const businessIds = businesses.map(b => b.id);

  const { data: productsData } = await supabase
    .from('products')
    .select('id, business_account_id')
    .eq('is_active', true)
    .in('business_account_id', businessIds);

  const productCountMap: Record<string, number> = {};
  const productIdToBusinessMap: Record<string, string> = {};

  if (productsData) {
    productsData.forEach(p => {
      if (p.business_account_id) {
        productCountMap[p.business_account_id] = (productCountMap[p.business_account_id] || 0) + 1;
        productIdToBusinessMap[p.id] = p.business_account_id;
      }
    });
  }

  const productIds = productsData?.map(p => p.id) || [];
  const ratingMap: Record<string, { sum: number; count: number }> = {};

  if (productIds.length > 0) {
    const { data: ratingsData } = await supabase
      .from('product_ratings')
      .select('product_id, rating')
      .in('product_id', productIds);

    if (ratingsData) {
      ratingsData.forEach(r => {
        const businessId = productIdToBusinessMap[r.product_id];
        if (businessId) {
          if (!ratingMap[businessId]) ratingMap[businessId] = { sum: 0, count: 0 };
          ratingMap[businessId].sum += r.rating;
          ratingMap[businessId].count += 1;
        }
      });
    }
  }

  return businesses
    .map(b => {
      const ratingInfo = ratingMap[b.id];
      const avgRating = ratingInfo && ratingInfo.count > 0
        ? ratingInfo.sum / ratingInfo.count
        : null;

      return {
        id: b.id,
        name: b.business_name,
        logo: b.logo_url,
        type: b.business_type,
        rating: avgRating,
        ratingCount: ratingInfo?.count || 0,
        productCount: productCountMap[b.id] || 0,
      };
    })
    .filter(s => s.productCount > 0)
    .sort((a, b) => {
      const scoreA = (a.rating || 0) * 10 + a.ratingCount * 2 + a.productCount;
      const scoreB = (b.rating || 0) * 10 + b.ratingCount * 2 + b.productCount;
      return scoreB - scoreA;
    })
    .slice(0, 6);
}

export function usePopularShops() {
  const { data: popularShops = [], isLoading } = useQuery({
    queryKey: ['popular-shops'],
    queryFn: fetchPopularShops,
    staleTime: 60000,
  });

  return { popularShops, isLoading };
}
