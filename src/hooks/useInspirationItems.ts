import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { InspirationCategory, InspirationMediaType } from "@/features/inspiration/categories";

export interface InspirationItem {
  id: string;
  page_kind: "birthday" | "event" | "global";
  page_id: string | null;
  author_id: string;
  is_admin_post: boolean;
  category: InspirationCategory;
  subcategory: string;
  media_type: InspirationMediaType;
  media_url: string | null;
  thumbnail_url: string | null;
  title: string | null;
  body: string | null;
  share_token: string;
  is_active: boolean;
  views_count: number;
  shares_count: number;
  created_at: string;
}

export function useInspirationItems(pageKind: "birthday" | "event", pageId: string | null | undefined) {
  const [items, setItems] = useState<InspirationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!pageId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("inspiration_items")
      .select("*")
      .eq("is_active", true)
      .or(`and(page_kind.eq.${pageKind},page_id.eq.${pageId}),page_kind.eq.global`)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[inspiration] fetch", error);
    } else {
      setItems((data ?? []) as InspirationItem[]);
    }
    setLoading(false);
  }, [pageKind, pageId]);

  useEffect(() => { refetch(); }, [refetch]);

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from("inspiration_items").delete().eq("id", id);
    if (error) { toast.error("Suppression impossible"); return false; }
    setItems((prev) => prev.filter((it) => it.id !== id));
    return true;
  };

  return { items, loading, refetch, remove };
}

export async function fetchInspirationByToken(token: string): Promise<InspirationItem | null> {
  const { data, error } = await (supabase as any).rpc("get_inspiration_by_token", { _token: token });
  if (error || !data || (Array.isArray(data) && data.length === 0)) return null;
  return (Array.isArray(data) ? data[0] : data) as InspirationItem;
}

export async function incrementInspirationViews(id: string) {
  await (supabase as any).rpc("increment_inspiration_views", { _id: id });
}

export async function incrementInspirationShares(id: string) {
  await (supabase as any).rpc("increment_inspiration_shares", { _id: id });
}