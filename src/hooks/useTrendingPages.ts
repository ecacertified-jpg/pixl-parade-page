import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

export interface TrendingPage {
  page_type: "birthday" | "event" | "profile" | "fund";
  page_id: string;
  page_slug: string | null;
  share_count_7d: number;
  last_shared_at: string;
  /** Optional enriched data fetched from the underlying page table. */
  title?: string | null;
  cover_image_url?: string | null;
  owner_first_name?: string | null;
}

/**
 * Loads the top viral pages of the last 7 days from the
 * `viral_trending_pages` view, then enriches each entry with a title
 * and a cover image so the trending feed can render rich cards.
 */
export function useTrendingPages(limit = 20) {
  const [pages, setPages] = useState<TrendingPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error } = await sb
        .from("viral_trending_pages")
        .select("*")
        .order("share_count_7d", { ascending: false })
        .limit(limit);

      if (cancelled) return;
      if (error || !data) {
        setPages([]);
        setLoading(false);
        return;
      }

      const rows = data as TrendingPage[];
      const birthdayIds = rows.filter((r) => r.page_type === "birthday").map((r) => r.page_id);
      const eventIds = rows.filter((r) => r.page_type === "event").map((r) => r.page_id);

      const [birthdays, events] = await Promise.all([
        birthdayIds.length
          ? sb
              .from("birthday_pages")
              .select("id, slug, title, cover_image_url")
              .in("id", birthdayIds)
          : Promise.resolve({ data: [] }),
        eventIds.length
          ? sb.from("event_pages").select("id, slug, title, cover_image_url").in("id", eventIds)
          : Promise.resolve({ data: [] }),
      ]);

      const byId = new Map<string, any>();
      (birthdays.data || []).forEach((b: any) => byId.set(b.id, b));
      (events.data || []).forEach((e: any) => byId.set(e.id, e));

      const enriched: TrendingPage[] = rows.map((r) => {
        const meta = byId.get(r.page_id);
        return {
          ...r,
          title: meta?.title ?? null,
          cover_image_url: meta?.cover_image_url ?? null,
          page_slug: meta?.slug ?? r.page_slug,
        };
      });

      setPages(enriched);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { pages, loading };
}