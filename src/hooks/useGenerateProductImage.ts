import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GenerateImageParams {
  productName: string;
  description?: string;
  category?: string;
}

export function useGenerateProductImage() {
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  const [errorImages, setErrorImages] = useState<Record<string, boolean>>({});

  const generateImage = useCallback(async (key: string, params: GenerateImageParams, force = false) => {
    // Éviter les doublons sauf si force = true
    if (!force && (generatedImages[key] || loadingImages[key] || errorImages[key])) return;

    setLoadingImages(prev => ({ ...prev, [key]: true }));
    setErrorImages(prev => ({ ...prev, [key]: false }));

    try {
      const { data, error } = await supabase.functions.invoke('generate-product-image', {
        body: params,
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImages(prev => ({ ...prev, [key]: data.imageUrl }));
      } else if (data?.error) {
        console.error('Image generation error:', data.error);
        setErrorImages(prev => ({ ...prev, [key]: true }));
      }
    } catch (err) {
      console.error('Image generation failed:', err);
      setErrorImages(prev => ({ ...prev, [key]: true }));
    } finally {
      setLoadingImages(prev => ({ ...prev, [key]: false }));
    }
  }, [generatedImages, loadingImages, errorImages]);

  const regenerateImage = useCallback((key: string, params: GenerateImageParams) => {
    return generateImage(key, params, true);
  }, [generateImage]);

  return { generatedImages, loadingImages, errorImages, generateImage, regenerateImage };
}
