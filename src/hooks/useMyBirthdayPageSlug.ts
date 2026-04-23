import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Renvoie le slug de la page d'anniversaire publiée de l'utilisateur courant
 * (année en cours), ou null si aucune page n'est publiée.
 */
export function useMyBirthdayPageSlug() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['my-birthday-page-slug', user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const currentYear = new Date().getFullYear();
      const { data } = await supabase
        .from('birthday_pages')
        .select('slug, published_at')
        .eq('user_id', user!.id)
        .eq('celebration_year', currentYear)
        .eq('is_active', true)
        .maybeSingle();
      if (!data || !data.published_at) return null;
      return data.slug as string;
    },
  });

  return { slug: data ?? null, isLoading };
}