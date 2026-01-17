import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GalleryMediaItem {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  thumbnailUrl: string | null;
  title: string | null;
  description: string | null;
  order: number;
  createdAt: string;
}

interface UseBusinessGalleryManagerResult {
  items: GalleryMediaItem[];
  loading: boolean;
  error: Error | null;
  uploading: boolean;
  uploadProgress: number;
  
  // CRUD operations
  addMedia: (file: File, mediaType: 'image' | 'video') => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateOrder: (orderedIds: string[]) => Promise<void>;
  updateItemDetails: (id: string, updates: { title?: string; description?: string }) => Promise<void>;
  refetch: () => void;
}

const MAX_GALLERY_ITEMS = 20;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export function useBusinessGalleryManager(businessId: string | undefined): UseBusinessGalleryManagerResult {
  const [items, setItems] = useState<GalleryMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchGallery = useCallback(async () => {
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

      if (fetchError) throw fetchError;

      const galleryItems: GalleryMediaItem[] = (data || []).map(item => ({
        id: item.id,
        mediaUrl: item.media_url,
        mediaType: item.media_type as 'image' | 'video',
        thumbnailUrl: item.thumbnail_url,
        title: item.title,
        description: item.description,
        order: item.display_order || 0,
        createdAt: item.created_at || new Date().toISOString(),
      }));

      setItems(galleryItems);
    } catch (err) {
      console.error('Error fetching business gallery:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch gallery'));
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const addMedia = async (file: File, mediaType: 'image' | 'video') => {
    if (!businessId) {
      toast.error('Aucun business sélectionné');
      return;
    }

    if (items.length >= MAX_GALLERY_ITEMS) {
      toast.error(`Maximum ${MAX_GALLERY_ITEMS} médias autorisés dans la galerie`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Le fichier ne doit pas dépasser 50 MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${businessId}/${crypto.randomUUID()}.${fileExt}`;
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('business-gallery')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('business-gallery')
        .getPublicUrl(uploadData.path);

      setUploadProgress(95);

      // Generate thumbnail for videos
      let thumbnailUrl: string | null = null;
      if (mediaType === 'video') {
        thumbnailUrl = await generateVideoThumbnail(urlData.publicUrl);
      }

      // Insert into database
      const newOrder = items.length;
      const { error: insertError } = await supabase
        .from('business_gallery')
        .insert({
          business_id: businessId,
          media_url: urlData.publicUrl,
          media_type: mediaType,
          thumbnail_url: thumbnailUrl,
          display_order: newOrder,
          is_active: true,
        });

      if (insertError) throw insertError;

      setUploadProgress(100);
      toast.success(`${mediaType === 'image' ? 'Image' : 'Vidéo'} ajoutée à la galerie`);
      await fetchGallery();
    } catch (err) {
      console.error('Error adding media:', err);
      toast.error("Erreur lors de l'ajout du média");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeItem = async (id: string) => {
    if (!businessId) return;

    try {
      const item = items.find(i => i.id === id);
      if (!item) return;

      // Remove from storage
      if (item.mediaUrl.includes('business-gallery')) {
        const path = item.mediaUrl.split('business-gallery/')[1];
        if (path) {
          await supabase.storage.from('business-gallery').remove([path]);
        }
      }

      // Soft delete in database
      const { error } = await supabase
        .from('business_gallery')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast.success('Média supprimé');
      await fetchGallery();
    } catch (err) {
      console.error('Error removing media:', err);
      toast.error('Erreur lors de la suppression');
    }
  };

  const updateOrder = async (orderedIds: string[]) => {
    if (!businessId) return;

    try {
      // Update local state immediately for smooth UX
      const newItems = orderedIds.map((id, index) => {
        const item = items.find(i => i.id === id);
        return item ? { ...item, order: index } : null;
      }).filter((item): item is GalleryMediaItem => item !== null);
      
      setItems(newItems);

      // Batch update in database
      const updates = orderedIds.map((id, index) => 
        supabase
          .from('business_gallery')
          .update({ display_order: index })
          .eq('id', id)
      );

      await Promise.all(updates);
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error("Erreur lors de la réorganisation");
      // Refetch to restore correct order
      await fetchGallery();
    }
  };

  const updateItemDetails = async (id: string, updates: { title?: string; description?: string }) => {
    if (!businessId) return;

    try {
      const { error } = await supabase
        .from('business_gallery')
        .update({
          title: updates.title,
          description: updates.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setItems(prev => prev.map(item => 
        item.id === id 
          ? { ...item, title: updates.title ?? item.title, description: updates.description ?? item.description }
          : item
      ));

      toast.success('Détails mis à jour');
    } catch (err) {
      console.error('Error updating item details:', err);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  return {
    items,
    loading,
    error,
    uploading,
    uploadProgress,
    addMedia,
    removeItem,
    updateOrder,
    updateItemDetails,
    refetch: fetchGallery,
  };
}

// Helper function to generate video thumbnail
async function generateVideoThumbnail(videoUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.muted = true;
    video.currentTime = 1;

    video.onloadeddata = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 180;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              const fileName = `thumbnails/${crypto.randomUUID()}.jpg`;
              const { data, error } = await supabase.storage
                .from('business-gallery')
                .upload(fileName, blob, {
                  cacheControl: '3600',
                  contentType: 'image/jpeg',
                });

              if (!error && data) {
                const { data: urlData } = supabase.storage
                  .from('business-gallery')
                  .getPublicUrl(data.path);
                resolve(urlData.publicUrl);
              } else {
                resolve(null);
              }
            } catch {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        }, 'image/jpeg', 0.8);
      } else {
        resolve(null);
      }
    };

    video.onerror = () => resolve(null);
    setTimeout(() => resolve(null), 10000);
  });
}
