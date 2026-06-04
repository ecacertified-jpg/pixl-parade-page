import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ExternalFavorite {
  id: string;
  user_id: string;
  platform: string;
  external_url: string;
  product_name: string;
  image_url: string | null;
  estimated_price: number;
  currency: string;
  country_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useExternalFavorites(countryCode?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["external-favorites", user?.id, countryCode ?? "all"],
    enabled: !!user?.id,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<ExternalFavorite[]> => {
      let q = supabase
        .from("external_favorites")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (countryCode) {
        q = q.or(`country_code.eq.${countryCode},country_code.is.null`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ExternalFavorite[];
    },
  });
}

export function useAddExternalFavorite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      platform: string;
      external_url: string;
      product_name: string;
      image_url?: string | null;
      estimated_price: number;
      currency?: string;
      country_code?: string | null;
      notes?: string | null;
    }) => {
      if (!user) throw new Error("Vous devez être connecté.");
      const { data, error } = await supabase
        .from("external_favorites")
        .insert({
          user_id: user.id,
          platform: input.platform,
          external_url: input.external_url,
          product_name: input.product_name,
          image_url: input.image_url ?? null,
          estimated_price: input.estimated_price,
          currency: input.currency ?? "XOF",
          country_code: input.country_code ?? null,
          notes: input.notes ?? null,
        })
        .select()
        .single();
      if (error) {
        if ((error as any).code === "23505") {
          throw new Error("Ce produit est déjà dans vos souhaits.");
        }
        throw error;
      }
      return data as ExternalFavorite;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-favorites"] });
      toast.success("Produit ajouté à vos souhaits ✨");
    },
    onError: (err: any) => toast.error(err?.message ?? "Échec de l'ajout."),
  });
}

export function useRemoveExternalFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("external_favorites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-favorites"] });
      toast.success("Retiré de vos souhaits.");
    },
    onError: (err: any) => toast.error(err?.message ?? "Échec de la suppression."),
  });
}

export async function fetchExternalProductMeta(url: string): Promise<{
  platform: string;
  name: string | null;
  image_url: string | null;
  price: number | null;
  currency: string;
  url: string;
  partial?: boolean;
  warning?: string;
}> {
  const { data, error } = await supabase.functions.invoke("fetch-external-product-meta", {
    body: { url },
  });
  if (error) {
    // supabase-js v2 puts the raw Response on FunctionsHttpError.context
    let serverMessage: string | null = null;
    try {
      const ctx = (error as any)?.context;
      if (ctx && typeof ctx.json === "function") {
        const body = await ctx.json();
        if (body?.error) serverMessage = String(body.error);
      }
    } catch { /* ignore */ }
    throw new Error(serverMessage ?? error.message ?? "Erreur lors de l'analyse du lien.");
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any;
}