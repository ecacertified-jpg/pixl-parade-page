import { useState, useCallback } from "react";
import html2canvas from "html2canvas";
import { supabase } from "@/integrations/supabase/client";

export function useFundShareCard() {
  const [generating, setGenerating] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);

  const generateShareCard = useCallback(
    async (
      cardElement: HTMLElement | null,
      fundId: string
    ): Promise<string | null> => {
      if (!cardElement) {
        console.error("Card element not found");
        return null;
      }

      setGenerating(true);

      try {
        // 1. Capture HTML with html2canvas
        const canvas = await html2canvas(cardElement, {
          scale: 2, // High resolution
          backgroundColor: null,
          useCORS: true, // For cross-origin images
          allowTaint: false,
          logging: false,
        });

        // 2. Convert to Blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => {
              if (b) resolve(b);
              else reject(new Error("Failed to create blob"));
            },
            "image/png",
            0.9
          );
        });

        // 3. Upload to Supabase Storage
        const fileName = `share-cards/${fundId}-${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from("funds")
          .upload(fileName, blob, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadError) {
          // If bucket doesn't exist, continue without image
          console.warn("Could not upload fund share card:", uploadError.message);
          // Fallback: create local blob URL
          const localUrl = URL.createObjectURL(blob);
          setShareImageUrl(localUrl);
          return localUrl;
        }

        // 4. Get public URL
        const { data } = supabase.storage
          .from("funds")
          .getPublicUrl(fileName);

        setShareImageUrl(data.publicUrl);
        return data.publicUrl;
      } catch (error) {
        console.error("Error generating fund share card:", error);
        // Silent fallback, don't show error to user
        return null;
      } finally {
        setGenerating(false);
      }
    },
    []
  );

  const getShareFile = useCallback(
    async (url: string, fundTitle: string): Promise<File | null> => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const safeName = fundTitle.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
        return new File([blob], `cagnotte-${safeName}.png`, { type: "image/png" });
      } catch (error) {
        console.error("Error fetching share image:", error);
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setShareImageUrl(null);
    setGenerating(false);
  }, []);

  return {
    generating,
    shareImageUrl,
    generateShareCard,
    getShareFile,
    reset,
  };
}
