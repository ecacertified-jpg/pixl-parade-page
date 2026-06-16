import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const sb = supabase as any;

export type PremiumKind = "boost" | "vip_badge" | "premium_card" | "digital_gift";

export interface BoostOption {
  hours: number;
  amount_xof: number;
  label: string;
}

export const BOOST_OPTIONS: BoostOption[] = [
  { hours: 24, amount_xof: 1500, label: "24 h" },
  { hours: 72, amount_xof: 3500, label: "3 jours" },
  { hours: 168, amount_xof: 7000, label: "1 semaine" },
];

export const VIP_OPTIONS = [
  { days: 30, amount_xof: 3000, label: "1 mois" },
  { days: 365, amount_xof: 25000, label: "1 an" },
];

const SUPPORT_WAVE_LINK = "https://pay.wave.com/m/Mer8ZpZpQZpQZ"; // placeholder

export function buildWaveLink(amount: number, reference: string) {
  // Project memory: Wave preferred, pre-filled amount
  return `${SUPPORT_WAVE_LINK}?amount=${amount}&ref=${encodeURIComponent(reference)}`;
}

/** Returns the set of user_ids currently VIP (expires_at > now). */
export function useVipSet(userIds: string[]) {
  const [vipSet, setVipSet] = useState<Set<string>>(new Set());
  const key = userIds.slice().sort().join(",");
  useEffect(() => {
    if (!userIds.length) {
      setVipSet(new Set());
      return;
    }
    let active = true;
    sb.from("celebration_vip_subscriptions")
      .select("user_id, expires_at")
      .in("user_id", userIds)
      .gt("expires_at", new Date().toISOString())
      .then(({ data }: any) => {
        if (!active) return;
        setVipSet(new Set((data || []).map((r: any) => r.user_id)));
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return vipSet;
}

export function useCelebrationPremium() {
  const { user } = useAuth();

  const createOrder = useCallback(
    async (params: {
      kind: PremiumKind;
      post_id?: string | null;
      amount_xof: number;
      duration_hours?: number;
      metadata?: Record<string, unknown>;
    }) => {
      if (!user) {
        toast.error("Connecte-toi pour activer cette option premium");
        return null;
      }
      const { data, error } = await sb
        .from("celebration_premium_orders")
        .insert({
          user_id: user.id,
          kind: params.kind,
          post_id: params.post_id || null,
          amount_xof: params.amount_xof,
          duration_hours: params.duration_hours || null,
          metadata: params.metadata || {},
        })
        .select()
        .single();
      if (error) {
        toast.error("Création de la commande impossible");
        console.error(error);
        return null;
      }
      return data;
    },
    [user]
  );

  return { createOrder };
}

export function useDigitalGifts(postId: string) {
  const { user } = useAuth();
  const [gifts, setGifts] = useState<any[]>([]);

  const fetch = useCallback(async () => {
    const { data } = await sb
      .from("celebration_digital_gifts")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false })
      .limit(50);
    setGifts(data || []);
  }, [postId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    const ch = supabase
      .channel(`celebration_gifts_${postId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "celebration_digital_gifts", filter: `post_id=eq.${postId}` },
        () => fetch()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [postId, fetch]);

  const send = useCallback(
    async (gift: { key: string; amount_xof: number }, recipient_user_id?: string | null) => {
      if (!user) {
        toast.error("Connecte-toi pour offrir un cadeau");
        return false;
      }
      // Free gifts insert immediately. Paid gifts also insert; payment is tracked separately via premium order.
      const { error } = await sb.from("celebration_digital_gifts").insert({
        post_id: postId,
        sender_id: user.id,
        recipient_user_id: recipient_user_id || null,
        gift_key: gift.key,
        amount_xof: gift.amount_xof,
      });
      if (error) {
        console.error(error);
        toast.error("Envoi du cadeau impossible");
        return false;
      }
      if (gift.amount_xof > 0) {
        await sb.from("celebration_premium_orders").insert({
          user_id: user.id,
          kind: "digital_gift",
          post_id: postId,
          amount_xof: gift.amount_xof,
          metadata: { gift_key: gift.key },
        });
      }
      return true;
    },
    [user, postId]
  );

  return { gifts, send };
}