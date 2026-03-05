import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ShopProduct {
  id: string | number;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  images?: string[];
  category: string;
  vendor: string;
  vendorId: string | null;
  vendorLogo: string | null;
  distance: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  isExperience?: boolean;
  categoryName?: string;
  locationName?: string;
  businessAddress?: string;
  videoUrl?: string | null;
  videoThumbnailUrl?: string | null;
  countryCode: string | null;
  businessLatitude: number | null;
  businessLongitude: number | null;
  distanceKm: number | null;
}

async function fetchShopProducts(): Promise<ShopProduct[]> {
  // Step 1: Fetch products (limit 200)
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(200);

  if (productsError) {
    console.error('Error loading products:', productsError);
    return [];
  }

  if (!productsData || productsData.length === 0) return [];

  // Step 2: Extract IDs
  const businessIds = [...new Set(
    productsData.map(p => p.business_account_id).filter(Boolean)
  )] as string[];
  const productIds = productsData.map(p => p.id);

  // Step 3: Parallel fetch business + ratings
  const [businessResult, ratingsResult] = await Promise.all([
    businessIds.length > 0
      ? supabase
          .from('business_accounts')
          .select('id, business_name, logo_url, latitude, longitude, country_code, address')
          .in('id', businessIds)
      : Promise.resolve({ data: null, error: null }),
    productIds.length > 0
      ? supabase
          .from('product_ratings')
          .select('product_id, rating')
          .in('product_id', productIds)
      : Promise.resolve({ data: null, error: null }),
  ]);

  // Build business map
  const businessMap: Record<string, {
    name: string; logo: string | null; latitude: number | null; longitude: number | null; countryCode: string | null; address: string | null;
  }> = {};
  if (businessResult.data) {
    businessResult.data.forEach(b => {
      businessMap[b.id] = {
        name: b.business_name, logo: b.logo_url, latitude: b.latitude, longitude: b.longitude, countryCode: b.country_code, address: b.address
      };
    });
  }

  // Build ratings map
  const ratingsMap: Record<string, { sum: number; count: number }> = {};
  if (ratingsResult.data) {
    ratingsResult.data.forEach(r => {
      if (!ratingsMap[r.product_id]) {
        ratingsMap[r.product_id] = { sum: 0, count: 0 };
      }
      ratingsMap[r.product_id].sum += r.rating;
      ratingsMap[r.product_id].count += 1;
    });
  }

  // Format products (without distance calculation - that stays in Shop.tsx)
  return productsData.map(product => {
    const businessInfo = product.business_account_id ? businessMap[product.business_account_id] : null;
    const ratingInfo = ratingsMap[product.id];
    const avgRating = ratingInfo && ratingInfo.count > 0
      ? ratingInfo.sum / ratingInfo.count
      : 0;
    const reviewCount = ratingInfo?.count || 0;

    const mainImage = product.image_url
      || product.video_thumbnail_url
      || "/lovable-uploads/1c257532-9180-4894-83a0-d853a23a3bc1.png";
    const additionalImages = Array.isArray(product.images) ? (product.images as string[]) : [];
    const allImages = [mainImage, ...additionalImages.filter(img => img !== mainImage)];

    const effectiveCountryCode = businessInfo?.countryCode || product.country_code || null;
    const businessLat = businessInfo?.latitude || null;
    const businessLng = businessInfo?.longitude || null;

    return {
      id: product.id,
      name: product.name,
      description: product.description || "Description non disponible",
      price: product.price,
      currency: product.currency || "F",
      image: mainImage,
      images: allImages,
      category: product.category_name || "Produit",
      vendor: businessInfo?.name || "Boutique",
      vendorId: product.business_account_id || null,
      vendorLogo: businessInfo?.logo || null,
      distance: "Distance inconnue",
      rating: parseFloat(avgRating.toFixed(1)),
      reviews: reviewCount,
      inStock: (product.stock_quantity || 0) > 0,
      isExperience: product.is_experience || false,
      categoryName: product.category_name,
      locationName: product.location_name || "Non spécifié",
      businessAddress: businessInfo?.address || "",
      videoUrl: product.video_url || null,
      videoThumbnailUrl: product.video_thumbnail_url || null,
      countryCode: effectiveCountryCode,
      businessLatitude: businessLat,
      businessLongitude: businessLng,
      distanceKm: null,
    };
  });
}

export function useShopProducts() {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['shop-products'],
    queryFn: fetchShopProducts,
    staleTime: 30000,
  });

  // Realtime subscription for cache invalidation
  useEffect(() => {
    const channel = supabase
      .channel('shop-products-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, () => {
        queryClient.invalidateQueries({ queryKey: ['shop-products'] });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, () => {
        queryClient.invalidateQueries({ queryKey: ['shop-products'] });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'products' }, () => {
        queryClient.invalidateQueries({ queryKey: ['shop-products'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { products, isLoading };
}
