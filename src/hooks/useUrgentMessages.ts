import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { OrganizationPageType } from '@/types/organization';

export type UrgentPriority = 'high' | 'medium' | 'low';

export interface UrgentMessage {
  id: string;
  page_type: OrganizationPageType;
  page_id: string;
  message: string;
  event_at: string | null;
  is_active: boolean;
  priority: UrgentPriority;
  display_order: number;
}

export interface UrgentMessageInput {
  message: string;
  event_at: string | null;
  priority: UrgentPriority;
  display_order: number;
}

const SELECT = 'id, page_type, page_id, message, event_at, is_active, priority, display_order';

const PRIORITY_RANK: Record<UrgentPriority, number> = { high: 0, medium: 1, low: 2 };

const sortMessages = (rows: UrgentMessage[]) =>
  [...rows].sort((a, b) => {
    const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (pr !== 0) return pr;
    return a.display_order - b.display_order;
  });

/** Owner-side hook: CRUD list of urgent messages. */
export function useUrgentMessages(pageType: OrganizationPageType, pageId: string) {
  const { user } = useAuth();
  const [items, setItems] = useState<UrgentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('event_urgent_messages')
      .select(SELECT)
      .eq('page_type', pageType)
      .eq('page_id', pageId)
      .eq('is_active', true);
    setItems(sortMessages((data ?? []) as UrgentMessage[]));
    setLoading(false);
  }, [pageType, pageId]);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async (input: UrgentMessageInput) => {
    if (!user) return { error: new Error('not_authenticated') };
    setBusy(true);
    const { data, error } = await (supabase as any)
      .from('event_urgent_messages')
      .insert({
        page_type: pageType,
        page_id: pageId,
        message: input.message.trim(),
        event_at: input.event_at,
        priority: input.priority,
        display_order: input.display_order,
        is_active: true,
        created_by: user.id,
      })
      .select(SELECT)
      .single();
    setBusy(false);
    if (!error && data) setItems((prev) => sortMessages([...prev, data as UrgentMessage]));
    return { error };
  }, [pageType, pageId, user]);

  const update = useCallback(async (id: string, patch: Partial<UrgentMessageInput>) => {
    setBusy(true);
    const { data, error } = await (supabase as any)
      .from('event_urgent_messages')
      .update({
        ...(patch.message !== undefined ? { message: patch.message.trim() } : {}),
        ...(patch.event_at !== undefined ? { event_at: patch.event_at } : {}),
        ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
        ...(patch.display_order !== undefined ? { display_order: patch.display_order } : {}),
      })
      .eq('id', id)
      .select(SELECT)
      .single();
    setBusy(false);
    if (!error && data) {
      setItems((prev) => sortMessages(prev.map((m) => (m.id === id ? (data as UrgentMessage) : m))));
    }
    return { error };
  }, []);

  const remove = useCallback(async (id: string) => {
    setBusy(true);
    const { error } = await (supabase as any)
      .from('event_urgent_messages')
      .update({ is_active: false })
      .eq('id', id);
    setBusy(false);
    if (!error) setItems((prev) => prev.filter((m) => m.id !== id));
    return { error };
  }, []);

  const reorder = useCallback(async (id: string, direction: -1 | 1) => {
    const idx = items.findIndex((m) => m.id === id);
    if (idx < 0) return;
    const swap = items[idx + direction];
    if (!swap) return;
    const a = items[idx];
    await Promise.all([
      update(a.id, { display_order: swap.display_order }),
      update(swap.id, { display_order: a.display_order }),
    ]);
  }, [items, update]);

  return { items, loading, busy, create, update, remove, reorder, reload: load };
}

/** Public read-only hook used on the visitor-facing page. */
export function usePublicUrgentMessages(pageType: OrganizationPageType, pageId: string | undefined) {
  const [items, setItems] = useState<UrgentMessage[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!pageId) return;
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from('event_urgent_messages')
        .select(SELECT)
        .eq('page_type', pageType)
        .eq('page_id', pageId)
        .eq('is_active', true);
      if (!cancelled) setItems(sortMessages((data ?? []) as UrgentMessage[]));
    })();
    return () => { cancelled = true; };
  }, [pageType, pageId, tick]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();
  const visible = items.filter((m) => !m.event_at || new Date(m.event_at).getTime() > now);
  return { messages: visible };
}