import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export function useUserProfile(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function getUserDisplayName(profile: UserProfile | null | undefined): string {
  if (!profile) return 'Utilisateur';
  
  const firstName = profile.first_name || '';
  const lastName = profile.last_name || '';
  
  return `${firstName} ${lastName}`.trim() || 'Utilisateur';
}

export function getUserInitials(profile: UserProfile | null | undefined, fallback: string = 'U'): string {
  const displayName = getUserDisplayName(profile);
  
  if (displayName === 'Utilisateur') return fallback;
  
  return displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
