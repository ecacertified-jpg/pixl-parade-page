import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MemoryCapsuleMediaRef {
  source: 'birthday' | 'event';
  photoId: string;
  thumbnailUrl: string | null;
}

export interface MemoryCapsule {
  id: string;
  user_id: string;
  title: string;
  message: string;
  media_refs: MemoryCapsuleMediaRef[];
  unlock_date: string; // YYYY-MM-DD
  recipients: string[];
  is_unlocked: boolean;
  created_at: string;
}

export function useMemoryCapsules() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['memory-capsules', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<MemoryCapsule[]> => {
      const { data, error } = await (supabase as any)
        .from('memory_capsules')
        .select('*')
        .order('unlock_date', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        ...row,
        media_refs: Array.isArray(row.media_refs) ? row.media_refs : [],
        recipients: Array.isArray(row.recipients) ? row.recipients : [],
      }));
    },
  });

  const seal = useMutation({
    mutationFn: async (input: {
      title: string;
      message: string;
      media_refs: MemoryCapsuleMediaRef[];
      unlock_date: string;
      recipients: string[];
    }) => {
      if (!user) throw new Error('not_authenticated');
      const { error } = await (supabase as any).from('memory_capsules').insert({
        user_id: user.id,
        title: input.title,
        message: input.message,
        media_refs: input.media_refs as any,
        unlock_date: input.unlock_date,
        recipients: input.recipients as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Capsule scellée 🔒');
      qc.invalidateQueries({ queryKey: ['memory-capsules', user?.id] });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erreur lors du scellement'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('memory_capsules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Capsule supprimée');
      qc.invalidateQueries({ queryKey: ['memory-capsules', user?.id] });
    },
  });

  return { ...query, seal, remove };
}