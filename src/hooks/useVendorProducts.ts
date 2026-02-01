import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProductVideoData {
  id: string;
  url: string;
  thumbnail_url: string | null;
  source: 'direct' | 'youtube' | 'vimeo';
  title?: string;
  order: number;
}

interface VendorProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  images?: string[];
  category: string;
  vendor: string;
  businessAccountId: string;
  inStock: boolean;
  isExperience: boolean;
  categoryName: string;
  locationName: string;
  videoUrl: string | null;
  videoThumbnailUrl: string | null;
  videoUploadedAt: string | null;
  videos: ProductVideoData[];
  createdAt: string;
}

interface VendorInfo {
  id: string;
  businessName: string;
  description: string | null;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  businessType: string | null;
  deliveryZones: any;
  openingHours: any;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  websiteUrl: string | null;
}

export function useVendorProducts(businessId: string | undefined) {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadVendorData = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Charger les infos du prestataire via la vue sécurisée (exclut phone, email, payment_info)
      const { data: businessData, error: businessError } = await supabase
        .from('business_public_info')
        .select('id, business_name, description, logo_url, business_type, delivery_zones, opening_hours, country_code, latitude, longitude, website_url, address')
        .eq('id', businessId)
        .single();

      if (businessError) {
        throw new Error('Prestataire non trouvé');
      }

      setVendor({
        id: businessData.id,
        businessName: businessData.business_name,
        description: businessData.description,
        logoUrl: businessData.logo_url,
        email: null, // Removed from public view for security
        phone: null, // Removed from public view for security
        address: businessData.address,
        businessType: businessData.business_type,
        deliveryZones: businessData.delivery_zones,
        openingHours: businessData.opening_hours,
        countryCode: businessData.country_code || 'CI',
        latitude: businessData.latitude || null,
        longitude: businessData.longitude || null,
        websiteUrl: businessData.website_url || null,
      });

      // Charger les produits du prestataire
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('business_account_id', businessId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsError) {
        throw productsError;
      }

      const formattedProducts: VendorProduct[] = (productsData || []).map(product => {
        // Parse videos from JSONB
        let parsedVideos: ProductVideoData[] = [];
        if (product.videos && Array.isArray(product.videos)) {
          parsedVideos = (product.videos as unknown as ProductVideoData[]).sort((a, b) => a.order - b.order);
        } else if (product.video_url) {
          // Fallback for old format
          parsedVideos = [{
            id: 'legacy',
            url: product.video_url,
            thumbnail_url: product.video_thumbnail_url,
            source: 'direct',
            order: 0
          }];
        }

        return {
          id: product.id,
          name: product.name,
          description: product.description || "Description non disponible",
          price: product.price,
          currency: product.currency || "F",
          image: product.video_thumbnail_url || product.image_url || "/lovable-uploads/1c257532-9180-4894-83a0-d853a23a3bc1.png",
          images: product.images as string[] | undefined,
          category: product.category_name || "Produit",
          vendor: businessData.business_name,
          businessAccountId: businessId,
          inStock: (product.stock_quantity || 0) > 0,
          isExperience: product.is_experience || false,
          categoryName: product.category_name || "",
          locationName: product.location_name || "Non spécifié",
          videoUrl: product.video_url || null,
          videoThumbnailUrl: product.video_thumbnail_url || null,
          videoUploadedAt: product.video_uploaded_at || null,
          videos: parsedVideos,
          createdAt: product.created_at
        };
      });

      setProducts(formattedProducts);
    } catch (err) {
      console.error('Error loading vendor data:', err);
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadVendorData();
  }, [loadVendorData]);

  return {
    products,
    vendor,
    loading,
    error,
    refetch: loadVendorData
  };
}
