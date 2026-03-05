import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SessionEntry {
  id: string;
  user_id: string;
  started_at: string;
  last_active_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  user_agent: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export interface SessionStats {
  totalSessionsToday: number;
  uniqueUsersToday: number;
  avgDurationMinutes: number;
}

export function useSessionHistory() {
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [stats, setStats] = useState<SessionStats>({
    totalSessionsToday: 0,
    uniqueUsersToday: 0,
    avgDurationMinutes: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      // Fetch last 50 sessions with profile info
      const { data, error } = await supabase
        .from('user_session_logs')
        .select('id, user_id, started_at, last_active_at, ended_at, duration_minutes, user_agent')
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        // Fetch profiles for these users
        const userIds = [...new Set(data.map(s => s.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(
          (profiles || []).map(p => [p.user_id, p])
        );

        const enriched: SessionEntry[] = data.map(s => {
          const profile = profileMap.get(s.user_id);
          return {
            ...s,
            first_name: profile?.first_name || null,
            last_name: profile?.last_name || null,
            avatar_url: profile?.avatar_url || null,
          };
        });

        setSessions(enriched);
      } else {
        setSessions([]);
      }

      // Fetch today's stats
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: todaySessions } = await supabase
        .from('user_session_logs')
        .select('user_id, duration_minutes')
        .gte('started_at', todayStart.toISOString());

      if (todaySessions) {
        const uniqueUsers = new Set(todaySessions.map(s => s.user_id));
        const durations = todaySessions
          .map(s => s.duration_minutes)
          .filter((d): d is number => d !== null && d > 0);
        const avgDuration = durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : 0;

        setStats({
          totalSessionsToday: todaySessions.length,
          uniqueUsersToday: uniqueUsers.size,
          avgDurationMinutes: Math.round(avgDuration * 10) / 10,
        });
      }
    } catch (error) {
      console.error('Error fetching session history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchSessions]);

  return { sessions, stats, loading, refetch: fetchSessions };
}
