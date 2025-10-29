import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WishlistView {
  id: string;
  viewer_id: string;
  viewed_at: string;
}

export function useWishlistViews() {
  const [views, setViews] = useState<WishlistView[]>([]);
  const [loading, setLoading] = useState(true);

  const loadViews = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setViews([]);
        return;
      }

      const { data, error } = await supabase
        .from('wishlist_views')
        .select('*')
        .eq('wishlist_owner_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setViews(data || []);
    } catch (error) {
      console.error('Error loading wishlist views:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordView = async (ownerId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || user.id === ownerId) return;

      await supabase
        .from('wishlist_views')
        .insert({
          wishlist_owner_id: ownerId,
          viewer_id: user.id
        });
    } catch (error) {
      console.error('Error recording wishlist view:', error);
    }
  };

  useEffect(() => {
    loadViews();
  }, []);

  return {
    views,
    loading,
    recordView,
    refresh: loadViews
  };
}