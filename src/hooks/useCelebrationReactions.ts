import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const sb = supabase as any;

export const CELEBRATION_EMOJIS = ["❤️", "🎉", "🙏", "👏", "🔥", "😍"];

export interface ReactionSummary {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

export function useCelebrationReactions(postId: string) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ReactionSummary[]>([]);

  const load = useCallback(async () => {
    const { data, error } = await sb
      .from("celebration_reactions")
      .select("emoji, user_id")
      .eq("post_id", postId);
    if (error) return;
    const map = new Map<string, ReactionSummary>();
    for (const e of CELEBRATION_EMOJIS) {
      map.set(e, { emoji: e, count: 0, reactedByMe: false });
    }
    (data || []).forEach((r: any) => {
      const cur = map.get(r.emoji) || { emoji: r.emoji, count: 0, reactedByMe: false };
      cur.count += 1;
      if (user && r.user_id === user.id) cur.reactedByMe = true;
      map.set(r.emoji, cur);
    });
    setSummary(Array.from(map.values()));
  }, [postId, user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`celeb_reactions_${postId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "celebration_reactions", filter: `post_id=eq.${postId}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, load]);

  const toggle = useCallback(
    async (emoji: string) => {
      if (!user) {
        toast.error("Connecte-toi pour réagir");
        return;
      }
      const exists = summary.find((s) => s.emoji === emoji)?.reactedByMe;
      if (exists) {
        await sb
          .from("celebration_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .eq("emoji", emoji);
      } else {
        await sb.from("celebration_reactions").insert({
          post_id: postId,
          user_id: user.id,
          emoji,
        });
      }
      load();
    },
    [user, summary, postId, load]
  );

  return { summary, toggle };
}