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

  const loadProducts = async () => {
    console.log('🔍 [useBusinessProducts] loadProducts called');
    console.log('🔍 [useBusinessProducts] user:', user?.id);
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
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category_name:categories(name)
        `)
        .eq('business_owner_id', user.id)
        .order('created_at', { ascending: false });

      console.log('📊 [useBusinessProducts] Raw data from DB:', data);
      console.log('🚨 [useBusinessProducts] Error from DB:', error);

      if (error) {
        throw error;
      }

      // Map the data to include category name
      const mappedProducts = (data || []).map(product => ({
        ...product,
        category_name: product.category_name?.name || 'Sans catégorie'
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

  const refreshProducts = () => {
    loadProducts();
  };

  useEffect(() => {
    // Only load products when auth is ready and user is available
    if (!authLoading) {
      loadProducts();
    }
  }, [user, authLoading]);

  return {
    products,
    loading: loading || authLoading, // Include auth loading in overall loading state
    refreshProducts
  };
}