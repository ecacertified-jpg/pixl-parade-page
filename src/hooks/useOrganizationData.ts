import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
  OrganizationPageType,
  EventTask, EventVendor, EventBudgetItem, EventGuest, EventOrganizer, EventTable,
} from '@/types/organization';

type AnyTable = any;

function useTable<T>(table: string, pageType: OrganizationPageType | null, pageId: string | null) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!pageType || !pageId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await (supabase as AnyTable)
      .from(table)
      .select('*')
      .eq('page_type', pageType)
      .eq('page_id', pageId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error(`[${table}] fetch failed`, error);
      toast.error('Chargement impossible');
    } else {
      setItems((data ?? []) as T[]);
    }
    setLoading(false);
  }, [table, pageType, pageId]);

  useEffect(() => { refetch(); }, [refetch]);

  const insert = async (payload: Partial<T>) => {
    if (!pageType || !pageId) return null;
    const { data, error } = await (supabase as AnyTable)
      .from(table)
      .insert({ ...payload, page_type: pageType, page_id: pageId })
      .select()
      .single();
    if (error) { toast.error("Ajout impossible"); return null; }
    setItems((prev) => [...prev, data as T]);
    return data as T;
  };

  const update = async (id: string, patch: Partial<T>) => {
    const { data, error } = await (supabase as AnyTable)
      .from(table).update(patch).eq('id', id).select().single();
    if (error) { toast.error('Mise à jour impossible'); return null; }
    setItems((prev) => prev.map((it: any) => (it.id === id ? data : it)) as T[]);
    return data as T;
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as AnyTable).from(table).delete().eq('id', id);
    if (error) { toast.error('Suppression impossible'); return false; }
    setItems((prev) => (prev as any[]).filter((it) => it.id !== id) as T[]);
    return true;
  };

  return { items, loading, refetch, insert, update, remove };
}

export const useEventTasks   = (t: OrganizationPageType | null, id: string | null) => useTable<EventTask>('event_tasks', t, id);
export const useEventVendors = (t: OrganizationPageType | null, id: string | null) => useTable<EventVendor>('event_vendors', t, id);
export const useEventBudget  = (t: OrganizationPageType | null, id: string | null) => useTable<EventBudgetItem>('event_budget_items', t, id);
export const useEventGuests  = (t: OrganizationPageType | null, id: string | null) => useTable<EventGuest>('event_guests', t, id);
export const useEventOrganizers = (t: OrganizationPageType | null, id: string | null) => useTable<EventOrganizer>('event_organizers', t, id);
export const useEventTables    = (t: OrganizationPageType | null, id: string | null) => useTable<EventTable>('event_tables', t, id);