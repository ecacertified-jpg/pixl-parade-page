import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GiphyItem {
  id: string;
  title: string;
  url: string;
  preview: string;
  width?: number;
  height?: number;
}

export function useGiphy(type: "gif" | "sticker" | "text") {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<GiphyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("giphy-search", {
        body: { query: q, type, limit: 24 },
      });
      if (error) throw error;
      setItems((data as any)?.items ?? []);
    } catch (e) {
      console.error("giphy search error", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => search(query), 350);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [query, search]);

  return { query, setQuery, items, loading };
}