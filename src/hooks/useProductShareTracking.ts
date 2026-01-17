import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ShareEventType = 'click' | 'view' | 'add_to_cart' | 'purchase' | 'share_again';

interface TrackShareEventParams {
  shareToken: string;
  eventType: ShareEventType;
  conversionValue?: number;
  metadata?: Record<string, unknown>;
}

interface PlatformPerformance {
  platform: string;
  shares: number;
  clicks: number;
  conversions: number;
  revenue: number;
  clickRate: number;
  conversionRate: number;
}

interface TopShare {
  id: string;
  shareToken: string;
  platform: string;
  createdAt: string;
  clicks: number;
  conversions: number;
  revenue: number;
}

interface SharePerformance {
  totalShares: number;
  totalClicks: number;
  totalViews: number;
  totalConversions: number;
  totalRevenue: number;
  clickRate: number;
  conversionRate: number;
  avgConversionValue: number;
  performanceByPlatform: PlatformPerformance[];
  topPerformingShares: TopShare[];
}

interface ShareDetails {
  id: string;
  productId: string;
  userId: string | null;
  shareToken: string;
  sharePlatform: string;
  templateUsed: string;
  personalMessage: string | null;
  clickCount: number;
  viewCount: number;
  conversionCount: number;
  totalConversionValue: number;
  createdAt: string;
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

function getUTMParams(): { source?: string; medium?: string; campaign?: string; content?: string } {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
    content: params.get('utm_content') || undefined,
  };
}

export function useProductShareTracking() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const trackEvent = useCallback(async (params: TrackShareEventParams): Promise<boolean> => {
    const { shareToken, eventType, conversionValue, metadata } = params;

    try {
      // First get the share details to get share_id and product_id
      const { data: share, error: shareError } = await supabase
        .from('product_shares')
        .select('id, product_id')
        .eq('share_token', shareToken)
        .single();

      if (shareError || !share) {
        console.error('Share not found:', shareError);
        return false;
      }

      const utmParams = getUTMParams();

      // Insert the event using raw insert (types will be regenerated)
      const eventData = {
        share_id: share.id,
        product_id: share.product_id,
        event_type: eventType,
        actor_user_id: user?.id || null,
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
        referrer_url: document.referrer || null,
        landing_page: window.location.pathname,
        utm_source: utmParams.source,
        utm_medium: utmParams.medium,
        utm_campaign: utmParams.campaign,
        utm_content: utmParams.content,
        conversion_value: conversionValue || null,
        metadata: metadata || {},
      };

      // Use any cast temporarily until types are regenerated
      const { error: eventError } = await (supabase
        .from('product_share_events' as 'product_shares')
        .insert(eventData as never));

      if (eventError) {
        console.error('Error inserting share event:', eventError);
        return false;
      }

      // Update the share counters using the database function
      const { error: updateError } = await (supabase.rpc as Function)('increment_share_metrics', {
        p_share_token: shareToken,
        p_event_type: eventType,
        p_conversion_value: conversionValue || 0,
      });

      if (updateError) {
        console.error('Error updating share metrics:', updateError);
        // Event was still recorded, so return true
      }

      return true;
    } catch (error) {
      console.error('Error tracking share event:', error);
      return false;
    }
  }, [user?.id]);

  const getShareByToken = useCallback(async (token: string): Promise<ShareDetails | null> => {
    try {
      const { data, error } = await supabase
        .from('product_shares')
        .select('*')
        .eq('share_token', token)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        productId: data.product_id,
        userId: data.user_id,
        shareToken: data.share_token || '',
        sharePlatform: data.share_platform,
        templateUsed: data.template_used || 'classic',
        personalMessage: data.personal_message,
        clickCount: data.click_count || 0,
        viewCount: data.view_count || 0,
        conversionCount: data.conversion_count || 0,
        totalConversionValue: Number(data.total_conversion_value) || 0,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('Error fetching share by token:', error);
      return null;
    }
  }, []);

  const getPerformance = useCallback(async (productId: string): Promise<SharePerformance | null> => {
    setLoading(true);
    
    try {
      // Get all shares for this product
      const { data: shares, error } = await supabase
        .from('product_shares')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching share performance:', error);
        return null;
      }

      if (!shares || shares.length === 0) {
        return {
          totalShares: 0,
          totalClicks: 0,
          totalViews: 0,
          totalConversions: 0,
          totalRevenue: 0,
          clickRate: 0,
          conversionRate: 0,
          avgConversionValue: 0,
          performanceByPlatform: [],
          topPerformingShares: [],
        };
      }

      // Calculate totals
      const totalShares = shares.length;
      const totalClicks = shares.reduce((sum, s) => sum + (s.click_count || 0), 0);
      const totalViews = shares.reduce((sum, s) => sum + (s.view_count || 0), 0);
      const totalConversions = shares.reduce((sum, s) => sum + (s.conversion_count || 0), 0);
      const totalRevenue = shares.reduce((sum, s) => sum + Number(s.total_conversion_value || 0), 0);

      // Calculate rates
      const clickRate = totalShares > 0 
        ? Math.round((shares.filter(s => (s.click_count || 0) > 0).length / totalShares) * 100 * 10) / 10 
        : 0;
      const conversionRate = totalClicks > 0 
        ? Math.round((totalConversions / totalClicks) * 100 * 10) / 10 
        : 0;
      const avgConversionValue = totalConversions > 0 
        ? Math.round(totalRevenue / totalConversions) 
        : 0;

      // Group by platform
      const platformMap = new Map<string, PlatformPerformance>();
      shares.forEach(share => {
        const platform = share.share_platform;
        const existing = platformMap.get(platform) || {
          platform,
          shares: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          clickRate: 0,
          conversionRate: 0,
        };
        existing.shares++;
        existing.clicks += share.click_count || 0;
        existing.conversions += share.conversion_count || 0;
        existing.revenue += Number(share.total_conversion_value || 0);
        platformMap.set(platform, existing);
      });

      const performanceByPlatform = Array.from(platformMap.values()).map(p => ({
        ...p,
        clickRate: p.shares > 0 ? Math.round((p.clicks / p.shares) * 100 * 10) / 10 : 0,
        conversionRate: p.clicks > 0 ? Math.round((p.conversions / p.clicks) * 100 * 10) / 10 : 0,
      })).sort((a, b) => b.shares - a.shares);

      // Top performing shares (by revenue or clicks)
      const topPerformingShares = shares
        .filter(s => (s.click_count || 0) > 0)
        .sort((a, b) => Number(b.total_conversion_value || 0) - Number(a.total_conversion_value || 0))
        .slice(0, 5)
        .map(s => ({
          id: s.id,
          shareToken: s.share_token || '',
          platform: s.share_platform,
          createdAt: s.created_at,
          clicks: s.click_count || 0,
          conversions: s.conversion_count || 0,
          revenue: Number(s.total_conversion_value || 0),
        }));

      return {
        totalShares,
        totalClicks,
        totalViews,
        totalConversions,
        totalRevenue,
        clickRate,
        conversionRate,
        avgConversionValue,
        performanceByPlatform,
        topPerformingShares,
      };
    } catch (error) {
      console.error('Error calculating share performance:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    trackEvent,
    getShareByToken,
    getPerformance,
    loading,
  };
}
