import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BirthdayStats {
  userId: string;
  userName: string;
  badgeLevel: string;
  badgeName: string;
  totalCelebrations: number;
  firstBirthdayOnPlatform: string | null;
  yearsCelebrated: number[];
}

const fetchBirthdayStats = async (userId: string): Promise<BirthdayStats | null> => {
  const { data, error } = await supabase
    .from('user_birthday_stats')
    .select('*')
    .eq('auth_user_id', userId)
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    userId: data.user_id,
    userName: data.user_name,
    badgeLevel: data.badge_level,
    badgeName: data.badge_name,
    totalCelebrations: data.total_birthdays_celebrated || 0,
    firstBirthdayOnPlatform: data.first_birthday_on_platform,
    yearsCelebrated: data.years_celebrated || [],
  };
};

export const useBirthdayStats = () => {
  const { user } = useAuth();

  const { data: stats = null, isLoading: loading, error } = useQuery({
    queryKey: ['birthday-stats', user?.id],
    queryFn: () => fetchBirthdayStats(user!.id),
    enabled: !!user?.id,
    staleTime: 60000,
  });

  return { stats, loading, error: error?.message || null };
};
