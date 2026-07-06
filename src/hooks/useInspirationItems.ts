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
      const list = (data ?? []) as InspirationItem[];
      setItems(list);
      // Fire-and-forget thumbnail backfill for legacy videos so shared
      // links get a proper social preview image.
      backfillMissingVideoThumbnails(list);
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

// -----------------------------------------------------------------
// Thumbnail backfill for legacy inspiration videos
// -----------------------------------------------------------------

const BUCKET = "birthday-message-media";
const backfillAttempted = new Set<string>();

async function extractRemoteVideoThumbnail(videoUrl: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      const timeout = setTimeout(() => resolve(null), 10_000);
      video.onloadeddata = () => {
        try { video.currentTime = Math.min(0.5, (video.duration || 1) * 0.1); } catch { /* noop */ }
      };
      video.onseeked = () => {
        try {
          const w = video.videoWidth || 720;
          const h = video.videoHeight || 1280;
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) { clearTimeout(timeout); resolve(null); return; }
          ctx.drawImage(video, 0, 0, w, h);
          canvas.toBlob((b) => { clearTimeout(timeout); resolve(b); }, "image/jpeg", 0.82);
        } catch { clearTimeout(timeout); resolve(null); }
      };
      video.onerror = () => { clearTimeout(timeout); resolve(null); };
      video.src = videoUrl;
    } catch { resolve(null); }
  });
}

async function backfillThumbnailForItem(item: InspirationItem): Promise<void> {
  if (backfillAttempted.has(item.id)) return;
  backfillAttempted.add(item.id);
  if (item.media_type !== "video" || !item.media_url || item.thumbnail_url) return;
  try {
    const blob = await extractRemoteVideoThumbnail(item.media_url);
    if (!blob) return;
    const path = `inspiration/backfill/${item.id}-${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { upsert: false, contentType: "image/jpeg" });
    if (upErr) return;
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    if (!pub?.publicUrl) return;
    await (supabase as any)
      .from("inspiration_items")
      .update({ thumbnail_url: pub.publicUrl })
      .eq("id", item.id);
  } catch (e) {
    // Silent — backfill is best-effort.
    console.debug("[inspiration] thumbnail backfill skipped", item.id, e);
  }
}

function backfillMissingVideoThumbnails(items: InspirationItem[]) {
  const candidates = items.filter(
    (it) => it.media_type === "video" && it.media_url && !it.thumbnail_url,
  );
  // Throttle: process sequentially to avoid saturating mobile CPU.
  (async () => {
    for (const it of candidates) {
      // eslint-disable-next-line no-await-in-loop
      await backfillThumbnailForItem(it);
    }
  })();
}