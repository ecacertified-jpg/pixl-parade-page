import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCategoryBySlug, CategoryDefinition } from "@/data/product-categories";

export interface CategoryProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  images: string[];
  category: string;
  vendor: string;
  vendorId: string | null;
  vendorLogo: string | null;
  rating: number;
  reviews: number;
  inStock: boolean;
  isExperience: boolean;
  locationName?: string;
  videoUrl?: string | null;
  videoThumbnailUrl?: string | null;
}

interface UseCategoryProductsReturn {
  products: CategoryProduct[];
  category: CategoryDefinition | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => Promise<void>;
}

export function useCategoryProducts(categorySlug: string): UseCategoryProductsReturn {
  const [products, setProducts] = useState<CategoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Résoudre le slug vers la définition de catégorie
  const category = getCategoryBySlug(categorySlug);

  const fetchProducts = async () => {
    if (!category) {
      setError("Catégorie introuvable");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Récupérer les produits filtrés par catégorie
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('category_name', category.name)
        .eq('is_experience', category.isExperience)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Error loading category products:', productsError);
        setError("Erreur lors du chargement des produits");
        setLoading(false);
        return;
      }

      if (!productsData || productsData.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Récupérer les business_account_id uniques
      const businessIds = [...new Set(
        productsData
          .map(p => p.business_account_id)
          .filter(Boolean)
      )] as string[];

      // Récupérer les infos des boutiques
      let businessMap: Record<string, { name: string; logo: string | null }> = {};
      if (businessIds.length > 0) {
        const { data: businessData } = await supabase
          .from('business_public_info')
          .select('id, business_name, logo_url')
          .in('id', businessIds);

        if (businessData) {
          businessMap = businessData.reduce((acc, b) => {
            acc[b.id] = { name: b.business_name, logo: b.logo_url };
            return acc;
          }, {} as Record<string, { name: string; logo: string | null }>);
        }
      }

      // Récupérer les ratings
      const productIds = productsData.map(p => p.id);
      const ratingsMap: Record<string, { sum: number; count: number }> = {};

      if (productIds.length > 0) {
        const { data: ratingsData } = await supabase
          .from('product_ratings')
          .select('product_id, rating')
          .in('product_id', productIds);

        if (ratingsData) {
          ratingsData.forEach(r => {
            if (!ratingsMap[r.product_id]) {
              ratingsMap[r.product_id] = { sum: 0, count: 0 };
            }
            ratingsMap[r.product_id].sum += r.rating;
            ratingsMap[r.product_id].count += 1;
          });
        }
      }

      // Formater les produits
      const formattedProducts: CategoryProduct[] = productsData.map(product => {
        const businessInfo = product.business_account_id 
          ? businessMap[product.business_account_id] 
          : null;
        const ratingInfo = ratingsMap[product.id];
        const avgRating = ratingInfo && ratingInfo.count > 0
          ? ratingInfo.sum / ratingInfo.count
          : 0;

        const mainImage = product.image_url
          || product.video_thumbnail_url
          || "/lovable-uploads/1c257532-9180-4894-83a0-d853a23a3bc1.png";
        const additionalImages = Array.isArray(product.images) 
          ? (product.images as string[]) 
          : [];
        const allImages = [mainImage, ...additionalImages.filter(img => img !== mainImage)];

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
          rating: parseFloat(avgRating.toFixed(1)),
          reviews: ratingInfo?.count || 0,
          inStock: (product.stock_quantity || 0) > 0,
          isExperience: product.is_experience || false,
          locationName: product.location_name || undefined,
          videoUrl: product.video_url || null,
          videoThumbnailUrl: product.video_thumbnail_url || null
        };
      });

      setProducts(formattedProducts);
    } catch (err) {
      console.error('Error fetching category products:', err);
      setError("Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categorySlug]);

  return {
    products,
    category,
    loading,
    error,
    totalCount: products.length,
    refetch: fetchProducts
  };
}
