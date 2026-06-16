import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { OrganizationPageType } from '@/types/organization';

export interface UrgentMessage {
  id: string;
  page_type: OrganizationPageType;
  page_id: string;
  message: string;
  event_at: string | null;
  is_active: boolean;
}

/** Read+write hook for the organizer-side urgent message editor. */
export function useUrgentMessage(pageType: OrganizationPageType, pageId: string) {
  const { user } = useAuth();
  const [data, setData] = useState<UrgentMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('event_urgent_messages')
      .select('id, page_type, page_id, message, event_at, is_active')
      .eq('page_type', pageType)
      .eq('page_id', pageId)
      .eq('is_active', true)
      .maybeSingle();
    setData((data as UrgentMessage) ?? null);
    setLoading(false);
  }, [pageType, pageId]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (message: string, event_at: string | null) => {
    if (!user) return { error: new Error('not_authenticated') };
    setSaving(true);
    // Deactivate any current active row, then insert a fresh one (keeps history).
    await (supabase as any)
      .from('event_urgent_messages')
      .update({ is_active: false })
      .eq('page_type', pageType)
      .eq('page_id', pageId)
      .eq('is_active', true);
    const { data: inserted, error } = await (supabase as any)
      .from('event_urgent_messages')
      .insert({
        page_type: pageType,
        page_id: pageId,
        message: message.trim(),
        event_at,
        is_active: true,
        created_by: user.id,
      })
      .select('id, page_type, page_id, message, event_at, is_active')
      .single();
    setSaving(false);
    if (!error) setData(inserted as UrgentMessage);
    return { error };
  }, [pageType, pageId, user]);

  const deactivate = useCallback(async () => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from('event_urgent_messages')
      .update({ is_active: false })
      .eq('page_type', pageType)
      .eq('page_id', pageId)
      .eq('is_active', true);
    setSaving(false);
    if (!error) setData(null);
    return { error };
  }, [pageType, pageId]);

  return { data, loading, saving, save, deactivate, reload: load };
}

/** Public read-only hook used on the visitor-facing page. */
export function usePublicUrgentMessage(pageType: OrganizationPageType, pageId: string | undefined) {
  const [data, setData] = useState<UrgentMessage | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!pageId) return;
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from('event_urgent_messages')
        .select('id, page_type, page_id, message, event_at, is_active')
        .eq('page_type', pageType)
        .eq('page_id', pageId)
        .eq('is_active', true)
        .maybeSingle();
      if (!cancelled) setData((data as UrgentMessage) ?? null);
    })();
    return () => { cancelled = true; };
  }, [pageType, pageId, tick]);

  // Re-evaluate expiration every 30s so the banner disappears live.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const expired = data?.event_at ? new Date(data.event_at).getTime() <= Date.now() : false;
  return { message: !data || expired ? null : data };
}