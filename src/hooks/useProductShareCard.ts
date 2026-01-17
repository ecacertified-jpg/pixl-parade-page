import { useState, useCallback } from "react";
import html2canvas from "html2canvas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useProductShareCard() {
  const [generating, setGenerating] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);

  const generateShareCard = useCallback(
    async (
      cardElement: HTMLElement | null,
      productId: string
    ): Promise<string | null> => {
      if (!cardElement) {
        console.error("Card element not found");
        return null;
      }

      setGenerating(true);

      try {
        // 1. Capturer le HTML avec html2canvas
        const canvas = await html2canvas(cardElement, {
          scale: 2, // Haute résolution
          backgroundColor: null,
          useCORS: true, // Pour les images cross-origin
          allowTaint: false,
          logging: false,
        });

        // 2. Convertir en Blob
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

        // 3. Upload vers Supabase Storage
        const fileName = `share-cards/${productId}-${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(fileName, blob, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadError) {
          // Si le bucket n'existe pas, on continue sans l'image
          console.warn("Could not upload share card:", uploadError.message);
          // Fallback: créer une URL blob locale
          const localUrl = URL.createObjectURL(blob);
          setShareImageUrl(localUrl);
          return localUrl;
        }

        // 4. Obtenir l'URL publique
        const { data } = supabase.storage
          .from("products")
          .getPublicUrl(fileName);

        setShareImageUrl(data.publicUrl);
        return data.publicUrl;
      } catch (error) {
        console.error("Error generating share card:", error);
        // Ne pas afficher d'erreur à l'utilisateur, fallback silencieux
        return null;
      } finally {
        setGenerating(false);
      }
    },
    []
  );

  const getShareFile = useCallback(
    async (url: string, productName: string): Promise<File | null> => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new File([blob], `${productName}.png`, { type: "image/png" });
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
