import { useEffect, useState } from 'react';
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

export const useBirthdayStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<BirthdayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get stats from the view
        const { data, error: statsError } = await supabase
          .from('user_birthday_stats')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();

        if (statsError) throw statsError;

        if (data) {
          setStats({
            userId: data.user_id,
            userName: data.user_name,
            badgeLevel: data.badge_level,
            badgeName: data.badge_name,
            totalCelebrations: data.total_birthdays_celebrated || 0,
            firstBirthdayOnPlatform: data.first_birthday_on_platform,
            yearsCelebrated: data.years_celebrated || []
          });
        }
      } catch (err: any) {
        console.error('Error fetching birthday stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return { stats, loading, error };
};
