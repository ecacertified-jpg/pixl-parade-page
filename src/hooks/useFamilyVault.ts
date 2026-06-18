import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FamilyVaultShare {
  id: string;
  owner_user_id: string;
  memory_source: 'birthday' | 'event';
  memory_id: string;
  caption: string | null;
  created_at: string;
}

/**
 * Coffre familial privé : souvenirs partagés explicitement avec les membres
 * du cercle « Famille ». Réutilise friend_circles (pas de nouvelle entité).
 */
export function useFamilyVault() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['family-vault', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<FamilyVaultShare[]> => {
      const { data, error } = await (supabase as any)
        .from('family_vault_shares')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as FamilyVaultShare[];
    },
  });

  const share = useMutation({
    mutationFn: async (input: {
      memory_source: 'birthday' | 'event';
      memory_id: string;
      caption?: string;
    }) => {
      if (!user) throw new Error('not_authenticated');
      const { error } = await (supabase as any).from('family_vault_shares').insert({
        owner_user_id: user.id,
        memory_source: input.memory_source,
        memory_id: input.memory_id,
        caption: input.caption ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Ajouté au coffre familial 🏛️');
      qc.invalidateQueries({ queryKey: ['family-vault', user?.id] });
    },
    onError: (e: any) => {
      if (String(e?.message).includes('duplicate')) {
        toast.info('Déjà dans le coffre familial');
      } else {
        toast.error(e?.message ?? 'Erreur');
      }
    },
  });

  const unshare = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('family_vault_shares')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Retiré du coffre');
      qc.invalidateQueries({ queryKey: ['family-vault', user?.id] });
    },
  });

  return { ...query, share, unshare };
}