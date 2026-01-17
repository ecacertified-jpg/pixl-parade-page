import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GalleryItem {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  thumbnailUrl: string | null;
  title: string | null;
  description: string | null;
  order: number;
}

interface UseVendorGalleryResult {
  items: GalleryItem[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useVendorGallery(businessId: string | undefined): UseVendorGalleryResult {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGallery = async () => {
    if (!businessId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('business_gallery')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const galleryItems: GalleryItem[] = (data || []).map(item => ({
        id: item.id,
        mediaUrl: item.media_url,
        mediaType: item.media_type as 'image' | 'video',
        thumbnailUrl: item.thumbnail_url,
        title: item.title,
        description: item.description,
        order: item.display_order || 0,
      }));

      setItems(galleryItems);
    } catch (err) {
      console.error('Error fetching vendor gallery:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch gallery'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, [businessId]);

  return { items, loading, error, refetch: fetchGallery };
}
