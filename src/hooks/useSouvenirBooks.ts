import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SouvenirBook {
  id: string;
  user_id: string;
  year: number;
  status: 'pending' | 'generating' | 'ready' | 'failed';
  pdf_url: string | null;
  page_count: number | null;
  memory_count: number | null;
  error_message: string | null;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useSouvenirBooks() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['souvenir-books', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<SouvenirBook[]> => {
      const { data, error } = await (supabase as any)
        .from('souvenir_books')
        .select('*')
        .order('year', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SouvenirBook[];
    },
    refetchInterval: (data) => {
      const list = (data as any)?.state?.data as SouvenirBook[] | undefined;
      if (list?.some((b) => b.status === 'generating' || b.status === 'pending')) {
        return 4000;
      }
      return false;
    },
  });

  const generate = useMutation({
    mutationFn: async (year: number) => {
      const { data, error } = await supabase.functions.invoke('generate-souvenir-book', {
        body: { year },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Génération lancée — votre livre arrive 📖');
      qc.invalidateQueries({ queryKey: ['souvenir-books', user?.id] });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erreur lors du lancement'),
  });

  return { ...query, generate };
}