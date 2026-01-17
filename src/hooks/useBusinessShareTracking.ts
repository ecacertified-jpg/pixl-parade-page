import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Types
export type SharePlatform = 'whatsapp' | 'facebook' | 'sms' | 'email' | 'copy' | 'native' | 'other';
export type ShareEventType = 'click' | 'view' | 'follow' | 'order' | 'product_view';

interface TrackEventParams {
  shareToken: string;
  eventType: ShareEventType;
  businessId?: string;
  conversionValue?: number;
  metadata?: Record<string, unknown>;
}

interface PlatformPerformance {
  platform: SharePlatform;
  shares: number;
  clicks: number;
  views: number;
  follows: number;
  clickRate: number;
  followRate: number;
}

interface TopShare {
  id: string;
  shareToken: string;
  platform: SharePlatform;
  clicks: number;
  views: number;
  follows: number;
  createdAt: string;
}

export interface BusinessSharePerformance {
  totalShares: number;
  totalClicks: number;
  totalViews: number;
  totalFollows: number;
  totalOrders: number;
  totalOrderValue: number;
  clickRate: number;
  viewRate: number;
  followRate: number;
  byPlatform: PlatformPerformance[];
  topShares: TopShare[];
}

interface ShareDetails {
  id: string;
  businessId: string;
  shareToken: string;
  platform: SharePlatform;
  clickCount: number;
  viewCount: number;
  followCount: number;
}

// Utility functions
function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

function getUTMParams(): { source?: string; medium?: string; campaign?: string } {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
  };
}

export function useBusinessShareTracking(businessId?: string) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Record a new share
  const recordShare = useCallback(async (platform: SharePlatform): Promise<string | null> => {
    if (!businessId) return null;

    try {
      const { data, error } = await supabase
        .from('business_shares')
        .insert({
          business_id: businessId,
          user_id: user?.id || null,
          share_platform: platform,
          user_agent: navigator.userAgent,
          referrer_url: document.referrer || null,
        })
        .select('share_token')
        .single();

      if (error) {
        console.error('Error recording business share:', error);
        return null;
      }

      return data?.share_token || null;
    } catch (err) {
      console.error('Error recording business share:', err);
      return null;
    }
  }, [businessId, user?.id]);

  // Track an event (click, view, follow, etc.)
  const trackEvent = useCallback(async (params: TrackEventParams): Promise<boolean> => {
    const { shareToken, eventType, businessId: bId, conversionValue, metadata } = params;

    try {
      // First, get the share ID from token
      const { data: shareData, error: shareError } = await supabase
        .from('business_shares')
        .select('id, business_id')
        .eq('share_token', shareToken)
        .single();

      if (shareError || !shareData) {
        console.error('Share not found:', shareToken);
        return false;
      }

      const utm = getUTMParams();

      // Insert the event (cast to any due to types not regenerated yet)
      const { error: eventError } = await (supabase
        .from('business_share_events') as any)
        .insert({
          share_id: shareData.id,
          business_id: bId || shareData.business_id,
          event_type: eventType,
          actor_user_id: user?.id || null,
          user_agent: navigator.userAgent,
          device_type: getDeviceType(),
          referrer_url: document.referrer || null,
          utm_source: utm.source || null,
          utm_medium: utm.medium || null,
          utm_campaign: utm.campaign || null,
          conversion_value: conversionValue || null,
          metadata: metadata || {},
        });

      if (eventError) {
        console.error('Error inserting business share event:', eventError);
        return false;
      }

      // Update share metrics via RPC (cast due to types not regenerated)
      const { error: rpcError } = await (supabase.rpc as any)('increment_business_share_metrics', {
        p_share_id: shareData.id,
        p_event_type: eventType,
        p_conversion_value: conversionValue || 0,
      });

      if (rpcError) {
        console.error('Error updating business share metrics:', rpcError);
      }

      return true;
    } catch (err) {
      console.error('Error tracking business share event:', err);
      return false;
    }
  }, [user?.id]);

  // Get share by token
  const getShareByToken = useCallback(async (token: string): Promise<ShareDetails | null> => {
    try {
      const { data, error } = await supabase
        .from('business_shares')
        .select('id, business_id, share_token, share_platform, click_count, view_count, follow_count')
        .eq('share_token', token)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        businessId: data.business_id,
        shareToken: data.share_token,
        platform: data.share_platform as SharePlatform,
        clickCount: data.click_count || 0,
        viewCount: data.view_count || 0,
        followCount: data.follow_count || 0,
      };
    } catch {
      return null;
    }
  }, []);

  // Get performance metrics for a business
  const getPerformance = useCallback(async (bId: string): Promise<BusinessSharePerformance | null> => {
    setLoading(true);
    try {
      // Cast to any due to types not regenerated yet
      const { data: shares, error } = await (supabase
        .from('business_shares') as any)
        .select('*')
        .eq('business_id', bId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching business shares:', error);
        return null;
      }

      if (!shares || shares.length === 0) {
        return null;
      }

      // Calculate totals
      const totalShares = shares.length;
      const totalClicks = shares.reduce((sum: number, s: any) => sum + (s.click_count || 0), 0);
      const totalViews = shares.reduce((sum: number, s: any) => sum + (s.view_count || 0), 0);
      const totalFollows = shares.reduce((sum: number, s: any) => sum + (s.follow_count || 0), 0);
      const totalOrders = shares.reduce((sum: number, s: any) => sum + (s.order_count || 0), 0);
      const totalOrderValue = shares.reduce((sum: number, s: any) => sum + parseFloat(String(s.total_order_value || '0')), 0);

      // Calculate rates
      const clickRate = totalShares > 0 ? (totalClicks / totalShares) * 100 : 0;
      const viewRate = totalClicks > 0 ? (totalViews / totalClicks) * 100 : 0;
      const followRate = totalViews > 0 ? (totalFollows / totalViews) * 100 : 0;

      // Group by platform
      const platformMap = new Map<SharePlatform, { shares: number; clicks: number; views: number; follows: number }>();
      shares.forEach((s: any) => {
        const platform = s.share_platform as SharePlatform;
        const existing = platformMap.get(platform) || { shares: 0, clicks: 0, views: 0, follows: 0 };
        platformMap.set(platform, {
          shares: existing.shares + 1,
          clicks: existing.clicks + (s.click_count || 0),
          views: existing.views + (s.view_count || 0),
          follows: existing.follows + (s.follow_count || 0),
        });
      });

      const byPlatform: PlatformPerformance[] = Array.from(platformMap.entries())
        .map(([platform, stats]) => ({
          platform,
          ...stats,
          clickRate: stats.shares > 0 ? (stats.clicks / stats.shares) * 100 : 0,
          followRate: stats.views > 0 ? (stats.follows / stats.views) * 100 : 0,
        }))
        .sort((a, b) => b.shares - a.shares);

      // Top shares
      const topShares: TopShare[] = shares
        .filter((s: any) => (s.click_count || 0) > 0)
        .sort((a: any, b: any) => (b.click_count || 0) - (a.click_count || 0))
        .slice(0, 5)
        .map((s: any) => ({
          id: s.id,
          shareToken: s.share_token,
          platform: s.share_platform as SharePlatform,
          clicks: s.click_count || 0,
          views: s.view_count || 0,
          follows: s.follow_count || 0,
          createdAt: s.created_at,
        }));

      return {
        totalShares,
        totalClicks,
        totalViews,
        totalFollows,
        totalOrders,
        totalOrderValue,
        clickRate,
        viewRate,
        followRate,
        byPlatform,
        topShares,
      };
    } catch (err) {
      console.error('Error getting business share performance:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    recordShare,
    trackEvent,
    getShareByToken,
    getPerformance,
    loading,
  };
}

// Standalone function to track event without hook context
export async function trackBusinessShareEvent(params: TrackEventParams): Promise<boolean> {
  const { shareToken, eventType, businessId, conversionValue, metadata } = params;

  try {
    const { data: shareData, error: shareError } = await supabase
      .from('business_shares')
      .select('id, business_id')
      .eq('share_token', shareToken)
      .single();

    if (shareError || !shareData) {
      console.error('Share not found:', shareToken);
      return false;
    }

    const utm = getUTMParams();

    // Cast to any due to types not regenerated yet
    const { error: eventError } = await (supabase
      .from('business_share_events') as any)
      .insert({
        share_id: shareData.id,
        business_id: businessId || shareData.business_id,
        event_type: eventType,
        actor_user_id: null,
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
        referrer_url: document.referrer || null,
        utm_source: utm.source || null,
        utm_medium: utm.medium || null,
        utm_campaign: utm.campaign || null,
        conversion_value: conversionValue || null,
        metadata: metadata || {},
      });

    if (eventError) {
      console.error('Error inserting business share event:', eventError);
      return false;
    }

    await (supabase.rpc as any)('increment_business_share_metrics', {
      p_share_id: shareData.id,
      p_event_type: eventType,
      p_conversion_value: conversionValue || 0,
    });

    return true;
  } catch (err) {
    console.error('Error tracking business share event:', err);
    return false;
  }
}
