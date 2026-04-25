import { useEffect, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  image_url: string | null;
  category_name: string | null;
  location_name: string | null;
  business_accounts?: {
    business_name: string;
    address: string | null;
  } | null;
}

const PAGE_SIZE = 24;
const SELECT_COLS =
  "id, name, price, currency, image_url, category_name, location_name, business_accounts!products_business_id_fkey(business_name, address)";

/** Petit hook de debounce local pour limiter les requêtes pendant la frappe. */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Liste paginée des produits du pays courant (mode catalogue par défaut).
 * Une seule requête Supabase par page, indexée par `country_code`.
 */
export function useCatalogProducts(countryCode: string) {
  return useInfiniteQuery({
    queryKey: ["wishlist-catalog", countryCode],
    enabled: !!countryCode,
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("products")
        .select(SELECT_COLS)
        .eq("is_active", true)
        .eq("country_code", countryCode)
        .order("popularity_score", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return (data ?? []) as unknown as CatalogProduct[];
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length,
    placeholderData: (prev) => prev,
  });
}

/**
 * Recherche serveur (nom OU catégorie) sur l'ensemble du catalogue du pays.
 * Activée uniquement quand `query` ≥ 2 caractères.
 */
export function useCatalogSearch(countryCode: string, query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["wishlist-catalog-search", countryCode, trimmed.toLowerCase()],
    enabled: !!countryCode && trimmed.length >= 2,
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const escaped = trimmed.replace(/[%,]/g, " ");
      const { data, error } = await supabase
        .from("products")
        .select(SELECT_COLS)
        .eq("is_active", true)
        .eq("country_code", countryCode)
        .or(`name.ilike.%${escaped}%,category_name.ilike.%${escaped}%`)
        .order("popularity_score", { ascending: false, nullsFirst: false })
        .limit(120);
      if (error) throw error;
      return (data ?? []) as unknown as CatalogProduct[];
    },
  });
}