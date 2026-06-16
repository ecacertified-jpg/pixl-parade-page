import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type CelebrationPostKind = "text" | "photo" | "video" | "tribute" | "card";
export type CelebrationPageType = "birthday" | "event" | "standalone";

export interface CelebrationPost {
  id: string;
  author_id: string;
  target_user_id: string | null;
  target_contact_id: string | null;
  page_type: CelebrationPageType;
  page_id: string | null;
  kind: CelebrationPostKind;
  content: string | null;
  media_urls: string[];
  music_track_id: string | null;
  is_premium: boolean;
  is_pinned: boolean;
  is_boosted: boolean;
  reactions_count: number;
  messages_count: number;
  views_count: number;
  created_at: string;
  author?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface UseCelebrationFeedOptions {
  pageType?: CelebrationPageType;
  pageId?: string | null;
  limit?: number;
}

const sb = supabase as any;

export function useCelebrationFeed(opts: UseCelebrationFeedOptions = {}) {
  const { user } = useAuth();
  const { pageType, pageId, limit = 30 } = opts;
  const [posts, setPosts] = useState<CelebrationPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    let q = sb
      .from("celebration_posts")
      .select("*")
      .eq("visibility", "public")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    if (pageType) q = q.eq("page_type", pageType);
    if (pageId) q = q.eq("page_id", pageId);
    const { data, error } = await q;
    if (error) {
      console.error("celebration feed", error);
      setLoading(false);
      return;
    }
    const rows = (data || []) as CelebrationPost[];
    // Fetch author profiles
    const ids = Array.from(new Set(rows.map((r) => r.author_id)));
    if (ids.length) {
      const { data: profiles } = await sb
        .from("profiles")
        .select("user_id, first_name, last_name, avatar_url")
        .in("user_id", ids);
      const map = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      rows.forEach((r) => {
        r.author = (map.get(r.author_id) as any) || null;
      });
    }
    setPosts(rows);
    setLoading(false);
  }, [pageType, pageId, limit]);

  useEffect(() => {
    setLoading(true);
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const channel = supabase
      .channel(`celebration_feed_${pageType || "all"}_${pageId || "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "celebration_posts" },
        () => fetchPosts()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts, pageType, pageId]);

  const createPost = useCallback(
    async (input: {
      kind: CelebrationPostKind;
      content?: string;
      media_urls?: string[];
      music_track_id?: string | null;
      target_user_id?: string | null;
      target_contact_id?: string | null;
    }) => {
      if (!user) {
        toast.error("Connecte-toi pour célébrer");
        return null;
      }
      const payload = {
        author_id: user.id,
        kind: input.kind,
        content: input.content || null,
        media_urls: input.media_urls || [],
        music_track_id: input.music_track_id || null,
        target_user_id: input.target_user_id || null,
        target_contact_id: input.target_contact_id || null,
        page_type: pageType || "standalone",
        page_id: pageId || null,
        visibility: "public",
      };
      const { data, error } = await sb
        .from("celebration_posts")
        .insert(payload)
        .select()
        .single();
      if (error) {
        toast.error("Publication impossible");
        console.error(error);
        return null;
      }
      toast.success("💖 Célébration publiée");
      fetchPosts();
      return data;
    },
    [user, pageType, pageId, fetchPosts]
  );

  const deletePost = useCallback(
    async (id: string) => {
      const { error } = await sb.from("celebration_posts").delete().eq("id", id);
      if (error) {
        toast.error("Suppression impossible");
        return;
      }
      setPosts((p) => p.filter((x) => x.id !== id));
    },
    []
  );

  return { posts, loading, createPost, deletePost, refetch: fetchPosts };
}