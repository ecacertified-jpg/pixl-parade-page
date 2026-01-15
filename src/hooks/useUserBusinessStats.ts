import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserBusinessStats {
  totalUsers: number;
  usersWithBusiness: number;
  usersWithoutBusiness: number;
  conversionRate: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  newBusinessLast7Days: number;
  newBusinessLast30Days: number;
  usersWithMultipleBusinesses: number;
  totalBusinessAccounts: number;
  activeBusinesses: number;
  pendingBusinesses: number;
  verifiedBusinesses: number;
  // Stats par pays
  countryStats?: {
    [code: string]: {
      users: number;
      businesses: number;
    };
  };
}

export interface UserWithBusiness {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  country_code: string | null;
  businesses: {
    id: string;
    business_name: string;
    is_active: boolean;
    is_verified: boolean;
    status: string | null;
    country_code: string | null;
  }[];
}

export function useUserBusinessStats(countryCode?: string | null) {
  const [stats, setStats] = useState<UserBusinessStats>({
    totalUsers: 0,
    usersWithBusiness: 0,
    usersWithoutBusiness: 0,
    conversionRate: 0,
    newUsersLast7Days: 0,
    newUsersLast30Days: 0,
    newBusinessLast7Days: 0,
    newBusinessLast30Days: 0,
    usersWithMultipleBusinesses: 0,
    totalBusinessAccounts: 0,
    activeBusinesses: 0,
    pendingBusinesses: 0,
    verifiedBusinesses: 0,
  });
  const [users, setUsers] = useState<UserWithBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch all profiles with country filter
      let profilesQuery = supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, created_at, country_code', { count: 'exact' });
      
      if (countryCode) {
        profilesQuery = profilesQuery.eq('country_code', countryCode);
      }
      
      const { data: profiles, count: totalUsers } = await profilesQuery;

      // Fetch all business accounts with country filter
      let businessQuery = supabase
        .from('business_accounts')
        .select('id, user_id, business_name, is_active, is_verified, status, created_at, country_code', { count: 'exact' });
      
      if (countryCode) {
        businessQuery = businessQuery.eq('country_code', countryCode);
      }
      
      const { data: businesses, count: totalBusinessAccounts } = await businessQuery;

      // Calculate stats
      const businessUserIds = new Set(businesses?.map(b => b.user_id) || []);
      const usersWithBusiness = businessUserIds.size;
      const usersWithoutBusiness = (totalUsers || 0) - usersWithBusiness;
      const conversionRate = totalUsers ? (usersWithBusiness / totalUsers) * 100 : 0;

      // Count users with multiple businesses
      const businessCountByUser = new Map<string, number>();
      businesses?.forEach(b => {
        businessCountByUser.set(b.user_id, (businessCountByUser.get(b.user_id) || 0) + 1);
      });
      const usersWithMultipleBusinesses = Array.from(businessCountByUser.values()).filter(count => count > 1).length;

      // New users last 7/30 days
      const newUsersLast7Days = profiles?.filter(p => p.created_at >= sevenDaysAgo).length || 0;
      const newUsersLast30Days = profiles?.filter(p => p.created_at >= thirtyDaysAgo).length || 0;

      // New businesses last 7/30 days
      const newBusinessLast7Days = businesses?.filter(b => b.created_at >= sevenDaysAgo).length || 0;
      const newBusinessLast30Days = businesses?.filter(b => b.created_at >= thirtyDaysAgo).length || 0;

      // Business status counts
      const activeBusinesses = businesses?.filter(b => b.is_active).length || 0;
      const pendingBusinesses = businesses?.filter(b => !b.is_active).length || 0;
      const verifiedBusinesses = businesses?.filter(b => b.is_verified).length || 0;

      // Calculer stats par pays (seulement si on ne filtre pas par pays)
      let countryStats: { [code: string]: { users: number; businesses: number } } | undefined;
      if (!countryCode) {
        countryStats = {};
        profiles?.forEach(p => {
          const code = p.country_code || 'unknown';
          if (!countryStats![code]) {
            countryStats![code] = { users: 0, businesses: 0 };
          }
          countryStats![code].users++;
        });
        businesses?.forEach(b => {
          const code = b.country_code || 'unknown';
          if (!countryStats![code]) {
            countryStats![code] = { users: 0, businesses: 0 };
          }
          countryStats![code].businesses++;
        });
      }

      setStats({
        totalUsers: totalUsers || 0,
        usersWithBusiness,
        usersWithoutBusiness,
        conversionRate,
        newUsersLast7Days,
        newUsersLast30Days,
        newBusinessLast7Days,
        newBusinessLast30Days,
        usersWithMultipleBusinesses,
        totalBusinessAccounts: totalBusinessAccounts || 0,
        activeBusinesses,
        pendingBusinesses,
        verifiedBusinesses,
        countryStats,
      });

      // Build users with their businesses
      const usersWithBusinessData: UserWithBusiness[] = (profiles || []).map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        created_at: profile.created_at,
        country_code: profile.country_code,
        businesses: (businesses || [])
          .filter(b => b.user_id === profile.user_id)
          .map(b => ({
            id: b.id,
            business_name: b.business_name,
            is_active: b.is_active ?? false,
            is_verified: b.is_verified ?? false,
            status: b.status,
            country_code: b.country_code,
          })),
      }));

      setUsers(usersWithBusinessData);
    } catch (error) {
      console.error('Error fetching user business stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [countryCode]);

  return { stats, users, loading, refresh: fetchStats };
}
