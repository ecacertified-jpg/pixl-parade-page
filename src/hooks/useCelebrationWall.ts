import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const sb = supabase as any;

export interface WallMessage {
  id: string;
  post_id: string | null;
  page_type: string;
  page_id: string | null;
  author_id: string;
  author_display_name: string | null;
  content: string;
  is_vip: boolean;
  created_at: string;
  author?: { first_name: string | null; avatar_url: string | null } | null;
}

export function useCelebrationWall(opts: {
  postId?: string | null;
  pageType?: string;
  pageId?: string | null;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<WallMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let q = sb
      .from("celebration_wall_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (opts.postId) q = q.eq("post_id", opts.postId);
    else if (opts.pageType && opts.pageId) {
      q = q.eq("page_type", opts.pageType).eq("page_id", opts.pageId).is("post_id", null);
    }
    const { data, error } = await q;
    if (error) {
      setLoading(false);
      return;
    }
    const rows = (data || []) as WallMessage[];
    const ids = Array.from(new Set(rows.map((r) => r.author_id)));
    if (ids.length) {
      const { data: profiles } = await sb
        .from("profiles")
        .select("user_id, first_name, avatar_url")
        .in("user_id", ids);
      const map = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      rows.forEach((r) => (r.author = (map.get(r.author_id) as any) || null));
    }
    setMessages(rows);
    setLoading(false);
  }, [opts.postId, opts.pageType, opts.pageId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    const key = opts.postId || `${opts.pageType}_${opts.pageId}`;
    const channel = supabase
      .channel(`celeb_wall_${key}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "celebration_wall_messages" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, opts.postId, opts.pageType, opts.pageId]);

  const send = useCallback(
    async (content: string, displayName?: string) => {
      if (!user) {
        toast.error("Connecte-toi pour écrire un message");
        return;
      }
      const trimmed = content.trim();
      if (!trimmed) return;
      const { error } = await sb.from("celebration_wall_messages").insert({
        post_id: opts.postId || null,
        page_type: opts.pageType || "standalone",
        page_id: opts.pageId || null,
        author_id: user.id,
        author_display_name: displayName || null,
        content: trimmed,
      });
      if (error) {
        toast.error("Envoi impossible");
        return;
      }
      toast.success("💌 Message envoyé");
      load();
    },
    [user, opts.postId, opts.pageType, opts.pageId, load]
  );

  return { messages, loading, send };
}