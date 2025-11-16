import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url?: string;
  business_owner_id: string;
  category_id?: string;
  category_name?: string;
  stock?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export function useBusinessProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const loadProducts = async (businessAccountId?: string) => {
    console.log('🔍 [useBusinessProducts] loadProducts called');
    console.log('🔍 [useBusinessProducts] user:', user?.id);
    console.log('🔍 [useBusinessProducts] businessAccountId:', businessAccountId);
    console.log('🔍 [useBusinessProducts] authLoading:', authLoading);
    
    // Don't load if still authenticating
    if (authLoading) {
      console.log('⏳ [useBusinessProducts] Still loading auth, waiting...');
      return;
    }

    if (!user?.id) {
      console.log('❌ [useBusinessProducts] No user ID, setting empty products');
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('📡 [useBusinessProducts] Fetching products for user:', user.id);
      
      let query = supabase
        .from('products')
        .select(`
          *,
          category_name:categories(name),
          business_category:business_categories(name, color, icon)
        `)
        .eq('business_owner_id', user.id);
      
      // Filtrer par business_account_id si fourni
      if (businessAccountId) {
        query = query.eq('business_account_id', businessAccountId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      console.log('📊 [useBusinessProducts] Raw data from DB:', data);
      console.log('🚨 [useBusinessProducts] Error from DB:', error);

      if (error) {
        throw error;
      }

      // Map the data to include category name
      const mappedProducts = (data || []).map(product => ({
        ...product,
        category_name: product.business_category?.name || product.category_name?.name || 'Sans catégorie'
      }));
      
      console.log('✅ [useBusinessProducts] Mapped products:', mappedProducts);
      console.log('📝 [useBusinessProducts] Number of products found:', mappedProducts.length);
      
      setProducts(mappedProducts);
    } catch (error) {
      console.error('❌ [useBusinessProducts] Error loading business products:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos produits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = (businessAccountId?: string) => {
    loadProducts(businessAccountId);
  };

  return {
    products,
    loading: loading || authLoading, // Include auth loading in overall loading state
    refreshProducts,
    loadProducts, // Export loadProducts pour permettre le passage de businessAccountId
  };
}