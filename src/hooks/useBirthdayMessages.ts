import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BirthdayMessage {
  id: string;
  sender_id: string | null;
  sender_name: string | null;
  message_text: string | null;
  media_type: string;
  media_url: string | null;
  media_metadata: any;
  audio_url: string | null;
  card_template_id: string | null;
  tone: string | null;
  moderation_status: string;
  is_hidden: boolean;
  reactions_count: number;
  is_from_fund: boolean | null;
  created_at: string;
}

export type SortMode = "recent" | "oldest";

export function useBirthdayMessages(pageId: string | undefined) {
  const [messages, setMessages] = useState<BirthdayMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");

  const load = useCallback(async () => {
    if (!pageId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("birthday_wishes_messages")
      .select("id, sender_id, sender_name, message_text, media_type, media_url, media_metadata, audio_url, card_template_id, tone, moderation_status, is_hidden, reactions_count, is_from_fund, created_at")
      .eq("birthday_page_id", pageId)
      .eq("is_hidden", false)
      .neq("moderation_status", "unsafe")
      .order("created_at", { ascending: false })
      .limit(200);
    if (!error && data) setMessages(data as any);
    setLoading(false);
  }, [pageId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!pageId) return;
    const channel = supabase
      .channel(`birthday-msgs-${pageId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "birthday_wishes_messages", filter: `birthday_page_id=eq.${pageId}` },
        (payload) => {
          const m = payload.new as any;
          if (m.is_hidden || m.moderation_status === "unsafe") return;
          setMessages(prev => prev.some(x => x.id === m.id) ? prev : [m, ...prev]);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [pageId]);

  const filtered = (() => {
    let arr = messages;
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(m =>
        (m.message_text || "").toLowerCase().includes(q) ||
        (m.sender_name || "").toLowerCase().includes(q)
      );
    }
    if (sort === "oldest") arr = [...arr].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    else arr = [...arr].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return arr;
  })();

  const prepend = (m: BirthdayMessage) =>
    setMessages(prev => prev.some(x => x.id === m.id) ? prev : [m, ...prev]);

  const remove = async (id: string) => {
    const prev = messages;
    setMessages(prev.filter(m => m.id !== id));
    const { error } = await supabase.from("birthday_wishes_messages").delete().eq("id", id);
    if (error) setMessages(prev);
  };

  return { messages: filtered, total: messages.length, loading, search, setSearch, sort, setSort, reload: load, prepend, remove };
}