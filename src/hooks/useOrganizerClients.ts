import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ClientAccountRow {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  claim_token: string;
  birthday_page_id: string | null;
  birthday_page_slug: string | null;
  created_user_id: string | null;
  claimed_at: string | null;
  event_page_id: string | null;
  created_at: string;
  birthday_page?: { slug: string | null } | null;
}

export function useOrganizerClients(eventPageId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['organizer-clients', user?.id, eventPageId ?? 'all'],
    enabled: !!user?.id,
    queryFn: async () => {
      let q = supabase
        .from('client_accounts' as any)
        .select('*, birthday_page:birthday_page_id(slug)')
        .eq('organizer_user_id', user!.id)
        .order('created_at', { ascending: false });
      if (eventPageId) q = q.eq('event_page_id', eventPageId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ClientAccountRow[];
    },
  });

  const create = useMutation({
    mutationFn: async (payload: {
      first_name: string;
      last_name?: string;
      phone?: string;
      email?: string;
      birthday?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('create-client-account', {
        body: { ...payload, event_page_id: eventPageId ?? null },
      });
      if (error) throw error;
      return data as {
        id: string;
        claim_url: string;
        share_message: string;
        birthday_page_slug: string | null;
      };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organizer-clients'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('client_accounts' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organizer-clients'] }),
  });

  return { list, create, remove };
}