import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

export type Period = '7days' | '30days' | '90days' | 'year';

export interface PlatformBreakdown {
  platform: string;
  shares: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
}

export interface DailyStat {
  date: string;
  shares: number;
  clicks: number;
  conversions: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  shares: number;
  clicks: number;
  conversions: number;
  value: number;
}

export interface TopBusiness {
  businessId: string;
  businessName: string;
  shares: number;
  clicks: number;
  follows: number;
  orders: number;
  orderValue: number;
}

export interface UTMSource {
  source: string;
  clicks: number;
  conversions: number;
}

export interface DeviceBreakdown {
  device: string;
  clicks: number;
  conversions: number;
}

export interface ShareAnalyticsData {
  totalShares: number;
  totalClicks: number;
  totalViews: number;
  totalConversions: number;
  totalConversionValue: number;
  conversionRate: number;
  platformBreakdown: PlatformBreakdown[];
  dailyStats: DailyStat[];
  topProducts: TopProduct[];
  topBusinesses: TopBusiness[];
  utmSources: UTMSource[];
  deviceBreakdown: DeviceBreakdown[];
}

const defaultData: ShareAnalyticsData = {
  totalShares: 0,
  totalClicks: 0,
  totalViews: 0,
  totalConversions: 0,
  totalConversionValue: 0,
  conversionRate: 0,
  platformBreakdown: [],
  dailyStats: [],
  topProducts: [],
  topBusinesses: [],
  utmSources: [],
  deviceBreakdown: [],
};

export function useShareAnalytics() {
  const [data, setData] = useState<ShareAnalyticsData>(defaultData);
  const [loading, setLoading] = useState(false);

  const getDateRange = (period: Period) => {
    const end = endOfDay(new Date());
    let start: Date;
    
    switch (period) {
      case '7days':
        start = startOfDay(subDays(new Date(), 7));
        break;
      case '30days':
        start = startOfDay(subDays(new Date(), 30));
        break;
      case '90days':
        start = startOfDay(subDays(new Date(), 90));
        break;
      case 'year':
        start = startOfDay(subDays(new Date(), 365));
        break;
      default:
        start = startOfDay(subDays(new Date(), 30));
    }
    
    return { start, end };
  };

  const fetchAnalytics = useCallback(async (period: Period = '30days') => {
    setLoading(true);
    try {
      const { start, end } = getDateRange(period);
      const startStr = start.toISOString();
      const endStr = end.toISOString();

      // Fetch product shares
      const { data: productShares } = await supabase
        .from('product_shares')
        .select('*')
        .gte('created_at', startStr)
        .lte('created_at', endStr);

      // Fetch business shares
      const { data: businessShares } = await supabase
        .from('business_shares')
        .select('*')
        .gte('created_at', startStr)
        .lte('created_at', endStr);

      // Fetch product share events
      const { data: productEvents } = await supabase
        .from('product_share_events')
        .select('*')
        .gte('created_at', startStr)
        .lte('created_at', endStr);

      // Fetch business share events
      const { data: businessEvents } = await supabase
        .from('business_share_events')
        .select('*')
        .gte('created_at', startStr)
        .lte('created_at', endStr);

      // Fetch products for names
      const productIds = [...new Set((productShares || []).map(s => s.product_id))];
      const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds.length > 0 ? productIds : ['00000000-0000-0000-0000-000000000000']);

      // Fetch businesses for names
      const businessIds = [...new Set((businessShares || []).map(s => s.business_id))];
      const { data: businesses } = await supabase
        .from('business_accounts')
        .select('id, business_name')
        .in('id', businessIds.length > 0 ? businessIds : ['00000000-0000-0000-0000-000000000000']);

      // Calculate totals
      const allShares = [...(productShares || []), ...(businessShares || [])];
      const allEvents = [...(productEvents || []), ...(businessEvents || [])];
      
      const totalShares = allShares.length;
      const totalClicks = allShares.reduce((sum, s) => sum + (s.click_count || 0), 0);
      const totalViews = allShares.reduce((sum, s) => sum + (s.view_count || 0), 0);
      
      const conversionEvents = allEvents.filter(e => 
        e.event_type === 'conversion' || e.event_type === 'purchase' || e.event_type === 'order'
      );
      const totalConversions = conversionEvents.length;
      const totalConversionValue = conversionEvents.reduce((sum, e) => {
        const value = (e as any).conversion_value || 0;
        return sum + value;
      }, 0);
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      // Platform breakdown
      const platformMap = new Map<string, PlatformBreakdown>();
      allShares.forEach(share => {
        const platform = share.share_platform || 'unknown';
        const existing = platformMap.get(platform) || {
          platform,
          shares: 0,
          clicks: 0,
          conversions: 0,
          conversionRate: 0
        };
        existing.shares += 1;
        existing.clicks += share.click_count || 0;
        platformMap.set(platform, existing);
      });
      
      // Add conversions to platform breakdown
      allEvents.forEach(event => {
        if (event.event_type === 'conversion' || event.event_type === 'purchase' || event.event_type === 'order') {
          // Find the share for this event
          const share = allShares.find(s => s.id === event.share_id);
          if (share) {
            const platform = share.share_platform || 'unknown';
            const existing = platformMap.get(platform);
            if (existing) {
              existing.conversions += 1;
            }
          }
        }
      });
      
      // Calculate conversion rates
      platformMap.forEach(p => {
        p.conversionRate = p.clicks > 0 ? (p.conversions / p.clicks) * 100 : 0;
      });
      
      const platformBreakdown = Array.from(platformMap.values())
        .sort((a, b) => b.shares - a.shares);

      // Daily stats
      const dailyMap = new Map<string, DailyStat>();
      allShares.forEach(share => {
        const date = format(new Date(share.created_at), 'yyyy-MM-dd');
        const existing = dailyMap.get(date) || { date, shares: 0, clicks: 0, conversions: 0 };
        existing.shares += 1;
        existing.clicks += share.click_count || 0;
        dailyMap.set(date, existing);
      });
      
      allEvents.forEach(event => {
        if (event.event_type === 'conversion' || event.event_type === 'purchase' || event.event_type === 'order') {
          const date = format(new Date(event.created_at), 'yyyy-MM-dd');
          const existing = dailyMap.get(date);
          if (existing) {
            existing.conversions += 1;
          }
        }
      });
      
      const dailyStats = Array.from(dailyMap.values())
        .sort((a, b) => a.date.localeCompare(b.date));

      // Top products
      const productMap = new Map<string, TopProduct>();
      (productShares || []).forEach(share => {
        const productId = share.product_id;
        const product = (products || []).find(p => p.id === productId);
        const existing = productMap.get(productId) || {
          productId,
          productName: product?.name || 'Produit inconnu',
          shares: 0,
          clicks: 0,
          conversions: 0,
          value: 0
        };
        existing.shares += 1;
        existing.clicks += share.click_count || 0;
        existing.conversions += share.conversion_count || 0;
        existing.value += (share as any).conversion_value || 0;
        productMap.set(productId, existing);
      });
      
      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.shares - a.shares)
        .slice(0, 10);

      // Top businesses
      const businessMap = new Map<string, TopBusiness>();
      (businessShares || []).forEach(share => {
        const businessId = share.business_id;
        const business = (businesses || []).find(b => b.id === businessId);
        const existing = businessMap.get(businessId) || {
          businessId,
          businessName: business?.business_name || 'Business inconnu',
          shares: 0,
          clicks: 0,
          follows: 0,
          orders: 0,
          orderValue: 0
        };
        existing.shares += 1;
        existing.clicks += share.click_count || 0;
        existing.follows += share.follow_count || 0;
        existing.orders += share.order_count || 0;
        existing.orderValue += share.total_order_value || 0;
        businessMap.set(businessId, existing);
      });
      
      const topBusinesses = Array.from(businessMap.values())
        .sort((a, b) => b.shares - a.shares)
        .slice(0, 10);

      // UTM Sources
      const utmMap = new Map<string, UTMSource>();
      allEvents.forEach(event => {
        const source = event.utm_source || 'direct';
        const existing = utmMap.get(source) || { source, clicks: 0, conversions: 0 };
        if (event.event_type === 'click') {
          existing.clicks += 1;
        }
        if (event.event_type === 'conversion' || event.event_type === 'purchase' || event.event_type === 'order') {
          existing.conversions += 1;
        }
        utmMap.set(source, existing);
      });
      
      const utmSources = Array.from(utmMap.values())
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      // Device breakdown
      const deviceMap = new Map<string, DeviceBreakdown>();
      allEvents.forEach(event => {
        const device = event.device_type || 'unknown';
        const existing = deviceMap.get(device) || { device, clicks: 0, conversions: 0 };
        if (event.event_type === 'click') {
          existing.clicks += 1;
        }
        if (event.event_type === 'conversion' || event.event_type === 'purchase' || event.event_type === 'order') {
          existing.conversions += 1;
        }
        deviceMap.set(device, existing);
      });
      
      const deviceBreakdown = Array.from(deviceMap.values())
        .sort((a, b) => b.clicks - a.clicks);

      setData({
        totalShares,
        totalClicks,
        totalViews,
        totalConversions,
        totalConversionValue,
        conversionRate,
        platformBreakdown,
        dailyStats,
        topProducts,
        topBusinesses,
        utmSources,
        deviceBreakdown,
      });
    } catch (error) {
      console.error('Error fetching share analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, fetchAnalytics };
}
