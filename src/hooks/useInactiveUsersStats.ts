import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface InactiveUserRow {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  lastActivity: string | null;
  daysInactive: number;
  notificationCount: number;
  maxTier: number;
  lastNotifiedAt: string;
  hasReturned: boolean;
  returnDate: string | null;
}

export interface InactiveUsersStats {
  totalNotified: number;
  tier1Count: number;
  tier2Count: number;
  returnedCount: number;
  returnRate: number;
}

export function useInactiveUsersStats() {
  const [data, setData] = useState<InactiveUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InactiveUsersStats>({
    totalNotified: 0,
    tier1Count: 0,
    tier2Count: 0,
    returnedCount: 0,
    returnRate: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get all notifications grouped info
      const { data: notifications, error: notifErr } = await supabase
        .from('inactive_user_notifications')
        .select('user_id, sent_at, tier, days_inactive')
        .order('sent_at', { ascending: false });

      if (notifErr) throw notifErr;
      if (!notifications?.length) {
        setData([]);
        setStats({ totalNotified: 0, tier1Count: 0, tier2Count: 0, returnedCount: 0, returnRate: 0 });
        setLoading(false);
        return;
      }

      // Group by user_id
      const userMap = new Map<string, {
        count: number;
        maxTier: number;
        lastSentAt: string;
        maxDaysInactive: number;
        hasTier1: boolean;
        hasTier2: boolean;
      }>();

      for (const n of notifications) {
        const existing = userMap.get(n.user_id);
        if (!existing) {
          userMap.set(n.user_id, {
            count: 1,
            maxTier: n.tier,
            lastSentAt: n.sent_at,
            maxDaysInactive: n.days_inactive,
            hasTier1: n.tier === 1,
            hasTier2: n.tier === 2,
          });
        } else {
          existing.count++;
          if (n.tier > existing.maxTier) existing.maxTier = n.tier;
          if (n.days_inactive > existing.maxDaysInactive) existing.maxDaysInactive = n.days_inactive;
          if (n.tier === 1) existing.hasTier1 = true;
          if (n.tier === 2) existing.hasTier2 = true;
        }
      }

      const userIds = Array.from(userMap.keys());

      // 2. Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p])
      );

      // 3. Get sessions after last notification for each user
      const { data: sessions } = await supabase
        .from('user_session_logs')
        .select('user_id, started_at')
        .in('user_id', userIds)
        .order('started_at', { ascending: false });

      const sessionMap = new Map<string, string>();
      for (const s of sessions || []) {
        if (!sessionMap.has(s.user_id)) {
          sessionMap.set(s.user_id, s.started_at);
        }
      }

      // 4. Build rows
      let tier1Count = 0;
      let tier2Count = 0;
      let returnedCount = 0;

      const rows: InactiveUserRow[] = userIds.map(uid => {
        const info = userMap.get(uid)!;
        const profile = profileMap.get(uid);
        const latestSession = sessionMap.get(uid);
        const hasReturned = !!latestSession && latestSession > info.lastSentAt;

        if (info.hasTier1) tier1Count++;
        if (info.hasTier2) tier2Count++;
        if (hasReturned) returnedCount++;

        return {
          userId: uid,
          firstName: profile?.first_name || '',
          lastName: profile?.last_name || '',
          avatarUrl: profile?.avatar_url || null,
          lastActivity: latestSession || null,
          daysInactive: info.maxDaysInactive,
          notificationCount: info.count,
          maxTier: info.maxTier,
          lastNotifiedAt: info.lastSentAt,
          hasReturned,
          returnDate: hasReturned ? latestSession! : null,
        };
      });

      rows.sort((a, b) => b.daysInactive - a.daysInactive);

      setData(rows);
      setStats({
        totalNotified: userIds.length,
        tier1Count,
        tier2Count,
        returnedCount,
        returnRate: userIds.length > 0 ? Math.round((returnedCount / userIds.length) * 100) : 0,
      });
    } catch (error) {
      console.error('Error fetching inactive users stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, stats, refetch: fetchData };
}
