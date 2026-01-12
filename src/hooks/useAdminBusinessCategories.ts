import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logAdminAction } from '@/utils/auditLogger';

export interface BusinessCategory {
  id: string;
  business_owner_id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_active?: boolean;
}

export function useAdminBusinessCategories() {
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const loadCategories = useCallback(async (businessOwnerId: string) => {
    if (!businessOwnerId) return;
    
    setLoading(true);
    try {
      // Fetch categories for this business owner
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('business_categories')
        .select('*')
        .eq('business_owner_id', businessOwnerId)
        .eq('is_active', true)
        .order('name');

      if (categoriesError) throw categoriesError;

      setCategories(categoriesData || []);

      // Fetch product counts per category
      if (categoriesData && categoriesData.length > 0) {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('business_category_id')
          .eq('business_owner_id', businessOwnerId)
          .eq('is_active', true);

        if (!productsError && products) {
          const counts: Record<string, number> = {};
          products.forEach(p => {
            if (p.business_category_id) {
              counts[p.business_category_id] = (counts[p.business_category_id] || 0) + 1;
            }
          });
          setProductCounts(counts);
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (businessOwnerId: string, categoryData: CategoryInput, businessName?: string) => {
    try {
      const { data, error } = await supabase
        .from('business_categories')
        .insert({
          business_owner_id: businessOwnerId,
          name: categoryData.name,
          description: categoryData.description || null,
          color: categoryData.color || '#3b82f6',
          icon: categoryData.icon || 'Package',
          is_active: categoryData.is_active ?? true
        })
        .select()
        .single();

      if (error) throw error;

      await logAdminAction(
        'create_business_category',
        'business_category',
        data.id,
        `Catégorie "${categoryData.name}" créée pour ${businessName || 'le business'}`,
        { category_name: categoryData.name, business_owner_id: businessOwnerId }
      );

      toast.success('Catégorie créée avec succès');
      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Erreur lors de la création de la catégorie');
      throw error;
    }
  }, []);

  const updateCategory = useCallback(async (id: string, updates: Partial<CategoryInput>, categoryName?: string) => {
    try {
      const { data, error } = await supabase
        .from('business_categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await logAdminAction(
        'update_business_category',
        'business_category',
        id,
        `Catégorie "${categoryName || updates.name || id}" modifiée`,
        { updates }
      );

      toast.success('Catégorie modifiée avec succès');
      return data;
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Erreur lors de la modification de la catégorie');
      throw error;
    }
  }, []);

  const deleteCategory = useCallback(async (id: string, categoryName: string) => {
    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('business_categories')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      await logAdminAction(
        'delete_business_category',
        'business_category',
        id,
        `Catégorie "${categoryName}" supprimée`,
        { category_name: categoryName }
      );

      toast.success('Catégorie supprimée avec succès');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erreur lors de la suppression de la catégorie');
      throw error;
    }
  }, []);

  return {
    categories,
    productCounts,
    loading,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory
  };
}
