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
  const { user } = useAuth();
  const { toast } = useToast();

  const loadProducts = async () => {
    if (!user?.id) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category_name:categories(name)
        `)
        .eq('business_owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Map the data to include category name
      const mappedProducts = (data || []).map(product => ({
        ...product,
        category_name: product.category_name?.name || 'Sans catégorie'
      }));
      
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error loading business products:', error);
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
    loadProducts();
  }, [user]);

  return {
    products,
    loading,
    refreshProducts
  };
}