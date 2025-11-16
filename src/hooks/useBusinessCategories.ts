import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface BusinessCategory {
  id: string;
  business_owner_id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useBusinessCategories = () => {
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadCategories = async () => {
    if (!user?.id) {
      setCategories([]);
      setProductCounts({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_categories')
        .select('*')
        .eq('business_owner_id', user.id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);

      // Load product counts for each category
      if (data && data.length > 0) {
        const counts: Record<string, number> = {};
        for (const category of data) {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('business_category_id', category.id);
          counts[category.id] = count || 0;
        }
        setProductCounts(counts);
      }
    } catch (error) {
      console.error('Error loading business categories:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos catégories',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (category: Omit<BusinessCategory, 'id' | 'business_owner_id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('business_categories')
        .insert({
          business_owner_id: user.id,
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon,
          is_active: category.is_active
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Catégorie créée avec succès'
      });

      await loadCategories();
      return data;
    } catch (error: any) {
      console.error('Error creating category:', error);
      
      if (error.code === '23505') {
        toast({
          title: 'Erreur',
          description: 'Une catégorie avec ce nom existe déjà',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de créer la catégorie',
          variant: 'destructive'
        });
      }
      return null;
    }
  };

  const updateCategory = async (id: string, updates: Partial<BusinessCategory>) => {
    try {
      const { error } = await supabase
        .from('business_categories')
        .update(updates)
        .eq('id', id)
        .eq('business_owner_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Catégorie mise à jour avec succès'
      });

      await loadCategories();
      return true;
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la catégorie',
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      // Soft delete
      const { error } = await supabase
        .from('business_categories')
        .update({ is_active: false })
        .eq('id', id)
        .eq('business_owner_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Catégorie supprimée avec succès'
      });

      await loadCategories();
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la catégorie',
        variant: 'destructive'
      });
      return false;
    }
  };

  useEffect(() => {
    loadCategories();
  }, [user?.id]);

  return {
    categories,
    productCounts,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories: loadCategories
  };
};