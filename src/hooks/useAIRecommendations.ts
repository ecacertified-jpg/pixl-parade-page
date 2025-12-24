import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Recommendation {
  productId?: string;
  productName: string;
  reason: string;
  matchScore: number;
  priceRange?: string;
  product?: {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    image_url: string;
    vendor?: string;
    location_name?: string;
    categories?: {
      name: string;
      name_fr: string;
    };
  };
}

interface RecommendationsResponse {
  success: boolean;
  recommendations: Recommendation[];
  generalAdvice: string;
  context: {
    occasion?: string;
    contactName?: string;
    budget?: { min: number; max: number };
  };
}

export function useAIRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [generalAdvice, setGeneralAdvice] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const getRecommendations = async ({
    contactId,
    occasion,
    budgetMin,
    budgetMax,
  }: {
    contactId?: string;
    occasion?: string;
    budgetMin?: number;
    budgetMax?: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Vous devez être connecté pour obtenir des recommandations");
      }

      const response = await fetch(
        `https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/ai-gift-recommendations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            contactId,
            occasion,
            budgetMin,
            budgetMax,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Service surchargé",
            description: "Veuillez réessayer dans quelques instants.",
            variant: "destructive",
          });
          throw new Error("Rate limit exceeded");
        }
        if (response.status === 402) {
          toast({
            title: "Crédits épuisés",
            description: "Les crédits IA sont épuisés.",
            variant: "destructive",
          });
          throw new Error("Payment required");
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la récupération des recommandations");
      }

      const data: RecommendationsResponse = await response.json();

      if (data.success) {
        setRecommendations(data.recommendations);
        setGeneralAdvice(data.generalAdvice);
      } else {
        throw new Error("Échec de la génération des recommandations");
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
      console.error("[useAIRecommendations] Error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearRecommendations = () => {
    setRecommendations([]);
    setGeneralAdvice("");
    setError(null);
  };

  return {
    recommendations,
    generalAdvice,
    loading,
    error,
    getRecommendations,
    clearRecommendations,
  };
}
