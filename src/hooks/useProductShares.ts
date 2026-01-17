import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type SharePlatform = 'whatsapp' | 'facebook' | 'sms' | 'email' | 'native' | 'copy_link';

interface ProductShareStats {
  totalShares: number;
  whatsappShares: number;
  facebookShares: number;
  smsShares: number;
  emailShares: number;
  nativeShares: number;
  linkCopies: number;
  sharesThisWeek: number;
  sharesToday: number;
}

interface RecordShareOptions {
  template?: string;
  message?: string;
}

interface UseProductSharesReturn {
  stats: ProductShareStats | null;
  loading: boolean;
  recordShare: (platform: SharePlatform, options?: RecordShareOptions) => Promise<string | null>;
  refetch: () => void;
}

const defaultStats: ProductShareStats = {
  totalShares: 0,
  whatsappShares: 0,
  facebookShares: 0,
  smsShares: 0,
  emailShares: 0,
  nativeShares: 0,
  linkCopies: 0,
  sharesThisWeek: 0,
  sharesToday: 0,
};

export function useProductShares(productId: string): UseProductSharesReturn {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProductShareStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!productId) {
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch count of all shares for this product
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Get all shares for this product (using count aggregation)
      const { count: totalCount, error: totalError } = await supabase
        .from('product_shares')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId);

      if (totalError) {
        console.error('Error fetching product shares:', totalError);
        setStats(defaultStats);
        setLoading(false);
        return;
      }

      // Get shares this week
      const { count: weekCount } = await supabase
        .from('product_shares')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId)
        .gte('created_at', weekAgo.toISOString());

      // Get shares today
      const { count: todayCount } = await supabase
        .from('product_shares')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId)
        .gte('created_at', todayStart.toISOString());

      // Get breakdown by platform
      const { data: platformData } = await supabase
        .from('product_shares')
        .select('share_platform')
        .eq('product_id', productId);

      const platformCounts = {
        whatsapp: 0,
        facebook: 0,
        sms: 0,
        email: 0,
        native: 0,
        copy_link: 0,
      };

      if (platformData) {
        platformData.forEach((item) => {
          const platform = item.share_platform as SharePlatform;
          if (platform in platformCounts) {
            platformCounts[platform]++;
          }
        });
      }

      setStats({
        totalShares: totalCount || 0,
        whatsappShares: platformCounts.whatsapp,
        facebookShares: platformCounts.facebook,
        smsShares: platformCounts.sms,
        emailShares: platformCounts.email,
        nativeShares: platformCounts.native,
        linkCopies: platformCounts.copy_link,
        sharesThisWeek: weekCount || 0,
        sharesToday: todayCount || 0,
      });
    } catch (error) {
      console.error('Error fetching product share stats:', error);
      setStats(defaultStats);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const recordShare = useCallback(async (
    platform: SharePlatform,
    options?: RecordShareOptions
  ): Promise<string | null> => {
    if (!productId) return null;

    try {
      // Optimistically update stats
      setStats((prev) => {
        if (!prev) return { ...defaultStats, totalShares: 1, [`${platform}Shares`]: 1 };
        
        const platformKey = platform === 'copy_link' ? 'linkCopies' : `${platform}Shares`;
        return {
          ...prev,
          totalShares: prev.totalShares + 1,
          sharesThisWeek: prev.sharesThisWeek + 1,
          sharesToday: prev.sharesToday + 1,
          [platformKey]: (prev[platformKey as keyof ProductShareStats] as number || 0) + 1,
        };
      });

      // Insert the share record with template and message
      const { data, error } = await supabase
        .from('product_shares')
        .insert({
          product_id: productId,
          user_id: user?.id || null,
          share_platform: platform,
          template_used: options?.template || 'classic',
          personal_message: options?.message || null,
          user_agent: navigator.userAgent,
          referrer_url: document.referrer || null,
        })
        .select('share_token')
        .single();

      if (error) {
        console.error('Error recording share:', error);
        // Revert optimistic update on error
        fetchStats();
        return null;
      }

      return data?.share_token || null;
    } catch (error) {
      console.error('Error recording share:', error);
      fetchStats();
      return null;
    }
  }, [productId, user?.id, fetchStats]);

  return {
    stats,
    loading,
    recordShare,
    refetch: fetchStats,
  };
}
