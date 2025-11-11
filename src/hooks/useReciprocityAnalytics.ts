import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Period = 'today' | '7days' | '30days' | '90days' | 'year';

interface TopContributor {
  user_id: string;
  total_contributions_count: number;
  total_amount_given: number;
  generosity_score: number;
  badge_level: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
}

interface BadgeDistribution {
  badge_level: string;
  count: number;
  avg_score: number;
}

interface ReciprocityRelation {
  donor_id: string;
  beneficiary_id: string;
  times_helped: number;
  total_given: number;
  times_returned: number;
  total_returned: number;
  relationship_type: 'reciprocal' | 'one_way';
}

interface OccasionData {
  occasion: string;
  count: number;
  total_amount: number;
}

interface TrendData {
  date: string;
  contributions_count: number;
  avg_amount: number;
  avg_reciprocity_score: number;
}

interface ReciprocityAnalyticsData {
  globalStats: {
    totalUsersWithScore: number;
    avgGenerosity: number;
    totalContributions: number;
    totalAmountCirculated: number;
    reciprocityRate: number;
  };
  topContributors: TopContributor[];
  badgeDistribution: BadgeDistribution[];
  networkData: ReciprocityRelation[];
  occasionBreakdown: OccasionData[];
  trends: TrendData[];
}

export function useReciprocityAnalytics(period: Period) {
  const [data, setData] = useState<ReciprocityAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const getDateRange = () => {
    const endDate = new Date();
    let startDate = new Date();

    switch(period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  };

  const fetchAnalytics = async () => {
    setLoading(true);

    try {
      const { startDate, endDate } = getDateRange();

      // Fetch global stats
      const { data: globalData } = await supabase
        .from('reciprocity_scores')
        .select('generosity_score, total_contributions_count, total_amount_given, badge_level');

      const totalUsersWithScore = globalData?.length || 0;
      const avgGenerosity = globalData?.reduce((sum, item) => sum + Number(item.generosity_score), 0) / totalUsersWithScore || 0;
      const totalContributions = globalData?.reduce((sum, item) => sum + Number(item.total_contributions_count), 0) || 0;
      const totalAmountCirculated = globalData?.reduce((sum, item) => sum + Number(item.total_amount_given), 0) || 0;
      
      // Calculate reciprocity rate from contributions data
      const { count: totalContributionsCount } = await supabase
        .from('fund_contributions')
        .select('*', { count: 'exact', head: true });
      
      const reciprocityRate = totalContributionsCount && totalUsersWithScore 
        ? (totalContributions / (totalContributionsCount / totalUsersWithScore)) * 100 
        : 0;

      // Fetch top contributors
      const { data: topContributorsData } = await supabase
        .from('reciprocity_scores')
        .select(`
          user_id,
          total_contributions_count,
          total_amount_given,
          generosity_score,
          badge_level,
          profiles!inner(first_name, last_name, avatar_url)
        `)
        .order('generosity_score', { ascending: false })
        .limit(20);

      const topContributors = topContributorsData?.map((item: any) => ({
        user_id: item.user_id,
        total_contributions_count: item.total_contributions_count,
        total_amount_given: item.total_amount_given,
        generosity_score: item.generosity_score,
        badge_level: item.badge_level,
        first_name: item.profiles.first_name,
        last_name: item.profiles.last_name,
        avatar_url: item.profiles.avatar_url,
      })) || [];

      // Fetch badge distribution
      const badgeDistribution: BadgeDistribution[] = [
        { badge_level: 'champion', count: 0, avg_score: 0 },
        { badge_level: 'generous', count: 0, avg_score: 0 },
        { badge_level: 'helper', count: 0, avg_score: 0 },
        { badge_level: 'newcomer', count: 0, avg_score: 0 },
      ];

      globalData?.forEach((item) => {
        const badge = badgeDistribution.find(b => b.badge_level === item.badge_level);
        if (badge) {
          badge.count++;
          badge.avg_score += Number(item.generosity_score);
        }
      });

      badgeDistribution.forEach(badge => {
        if (badge.count > 0) {
          badge.avg_score = badge.avg_score / badge.count;
        }
      });

      // Fetch network data
      const { data: networkData } = await supabase
        .from('reciprocity_tracking')
        .select('donor_id, beneficiary_id, contribution_amount')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const networkMap = new Map<string, ReciprocityRelation>();

      networkData?.forEach((item) => {
        const key = `${item.donor_id}-${item.beneficiary_id}`;
        const reverseKey = `${item.beneficiary_id}-${item.donor_id}`;

        if (!networkMap.has(key)) {
          networkMap.set(key, {
            donor_id: item.donor_id,
            beneficiary_id: item.beneficiary_id,
            times_helped: 0,
            total_given: 0,
            times_returned: 0,
            total_returned: 0,
            relationship_type: 'one_way',
          });
        }

        const relation = networkMap.get(key)!;
        relation.times_helped++;
        relation.total_given += Number(item.contribution_amount);

        if (networkMap.has(reverseKey)) {
          relation.relationship_type = 'reciprocal';
          const reverseRelation = networkMap.get(reverseKey)!;
          relation.times_returned = reverseRelation.times_helped;
          relation.total_returned = reverseRelation.total_given;
        }
      });

      // Fetch occasion breakdown
      const { data: occasionData } = await supabase
        .from('collective_funds')
        .select('occasion')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const { data: contributionsData } = await supabase
        .from('fund_contributions')
        .select('amount, fund_id, collective_funds!inner(occasion)')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const occasionMap = new Map<string, OccasionData>();

      contributionsData?.forEach((item: any) => {
        const occasion = item.collective_funds?.occasion || 'Non spécifié';
        if (!occasionMap.has(occasion)) {
          occasionMap.set(occasion, { occasion, count: 0, total_amount: 0 });
        }
        const data = occasionMap.get(occasion)!;
        data.count++;
        data.total_amount += Number(item.amount);
      });

      // Fetch trends
      const { data: trendsData } = await supabase
        .from('fund_contributions')
        .select('created_at, amount')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      const trendMap = new Map<string, { contributions: number[]; date: string }>();

      trendsData?.forEach((item) => {
        const date = new Date(item.created_at).toLocaleDateString('fr-FR');
        if (!trendMap.has(date)) {
          trendMap.set(date, { contributions: [], date });
        }
        trendMap.get(date)!.contributions.push(Number(item.amount));
      });

      const trends: TrendData[] = Array.from(trendMap.values()).map(({ date, contributions }) => ({
        date,
        contributions_count: contributions.length,
        avg_amount: contributions.reduce((sum, val) => sum + val, 0) / contributions.length,
        avg_reciprocity_score: avgGenerosity,
      }));

      setData({
        globalStats: {
          totalUsersWithScore,
          avgGenerosity,
          totalContributions,
          totalAmountCirculated,
          reciprocityRate,
        },
        topContributors,
        badgeDistribution,
        networkData: Array.from(networkMap.values()).slice(0, 50),
        occasionBreakdown: Array.from(occasionMap.values()),
        trends,
      });
    } catch (error) {
      console.error('Error fetching reciprocity analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, refresh: fetchAnalytics };
}
