import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface InvitationStats {
  total_sent: number;
  accepted: number;
  pending: number;
  expired: number;
  acceptance_rate: number;
  total_points: number;
  avg_acceptance_days: number;
  current_badge: {
    key: string;
    name: string;
    icon: string;
    color_primary: string;
    level: number;
  } | null;
  next_badge: {
    key: string;
    name: string;
    required: number;
  } | null;
  progress_to_next: number;
  monthly_trend: Array<{ month: string; count: number }>;
}

const REFERRAL_BADGES = [
  { key: 'ambassador_bronze', name: 'Ambassadeur Bronze', required: 5, level: 1, icon: 'Users', color: '#CD7F32' },
  { key: 'ambassador_silver', name: 'Ambassadeur Argent', required: 10, level: 2, icon: 'Users', color: '#C0C0C0' },
  { key: 'ambassador_gold', name: 'Ambassadeur Or', required: 20, level: 3, icon: 'Award', color: '#FFD700' },
  { key: 'ambassador_platinum', name: 'Ambassadeur Platine', required: 50, level: 4, icon: 'Crown', color: '#E5E4E2' },
  { key: 'ambassador_legend', name: 'Légende', required: 100, level: 5, icon: 'Gem', color: '#9C27B0' },
];

export function useInvitationStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<InvitationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Get stats from PostgreSQL function
      const { data: statsData, error: statsError } = await supabase.rpc('get_invitation_stats', {
        user_uuid: user.id
      });

      if (statsError) throw statsError;

      const basicStats = (statsData as any) || {
        total_sent: 0,
        accepted: 0,
        pending: 0,
        expired: 0,
        acceptance_rate: 0,
        total_points: 0,
        avg_acceptance_days: 0,
      };

      // Calculate current badge and progress
      const acceptedCount = Number(basicStats.accepted || 0);
      let currentBadge = null;
      let nextBadge = null;
      let progressToNext = 0;

      for (let i = REFERRAL_BADGES.length - 1; i >= 0; i--) {
        if (acceptedCount >= REFERRAL_BADGES[i].required) {
          currentBadge = {
            key: REFERRAL_BADGES[i].key,
            name: REFERRAL_BADGES[i].name,
            icon: REFERRAL_BADGES[i].icon,
            color_primary: REFERRAL_BADGES[i].color,
            level: REFERRAL_BADGES[i].level,
          };
          
          if (i < REFERRAL_BADGES.length - 1) {
            nextBadge = {
              key: REFERRAL_BADGES[i + 1].key,
              name: REFERRAL_BADGES[i + 1].name,
              required: REFERRAL_BADGES[i + 1].required,
            };
            progressToNext = (acceptedCount / REFERRAL_BADGES[i + 1].required) * 100;
          }
          break;
        }
      }

      // If no badge yet, show progress to first badge
      if (!currentBadge && REFERRAL_BADGES.length > 0) {
        nextBadge = {
          key: REFERRAL_BADGES[0].key,
          name: REFERRAL_BADGES[0].name,
          required: REFERRAL_BADGES[0].required,
        };
        progressToNext = (acceptedCount / REFERRAL_BADGES[0].required) * 100;
      }

      // Get monthly trend (last 6 months)
      const { data: invitations, error: invError } = await supabase
        .from('invitations')
        .select('invited_at')
        .eq('inviter_id', user.id)
        .gte('invited_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
        .order('invited_at', { ascending: true });

      if (invError) throw invError;

      // Group by month
      const monthlyMap = new Map<string, number>();
      invitations?.forEach(inv => {
        const date = new Date(inv.invited_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
      });

      // Create array for last 6 months
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        monthlyTrend.push({
          month: monthName,
          count: monthlyMap.get(monthKey) || 0,
        });
      }

      setStats({
        total_sent: Number(basicStats.total_sent || 0),
        accepted: Number(basicStats.accepted || 0),
        pending: Number(basicStats.pending || 0),
        expired: Number(basicStats.expired || 0),
        acceptance_rate: Number(basicStats.acceptance_rate || 0),
        total_points: Number(basicStats.total_points || 0),
        avg_acceptance_days: Number(basicStats.avg_acceptance_days || 0),
        current_badge: currentBadge,
        next_badge: nextBadge,
        progress_to_next: progressToNext,
        monthly_trend: monthlyTrend,
      });
    } catch (err) {
      console.error('Error fetching invitation stats:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return { stats, loading, error, refetch: fetchStats };
}
