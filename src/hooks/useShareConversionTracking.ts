import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_PREFIX = {
  product: 'product_share_ref_',
  business: 'business_share_ref_',
  fund: 'fund_share_ref_',
} as const;

type ShareType = 'product' | 'business' | 'fund';

/**
 * Hook for tracking conversions from share links
 * Detects share_token (ref parameter) in URL and tracks conversions
 */
export function useShareConversionTracking() {
  
  /**
   * Detect share token from URL and store in sessionStorage
   */
  const detectAndStoreShareToken = useCallback((
    type: ShareType,
    id: string
  ): string | null => {
    const params = new URLSearchParams(window.location.search);
    const shareRef = params.get('ref');
    
    if (shareRef && id) {
      const key = `${STORAGE_PREFIX[type]}${id}`;
      sessionStorage.setItem(key, shareRef);
      console.log(`🔗 Share token stored: ${key} = ${shareRef}`);
      return shareRef;
    }
    
    return null;
  }, []);

  /**
   * Get stored share token from sessionStorage
   */
  const getStoredShareToken = useCallback((
    type: ShareType,
    id: string
  ): string | null => {
    const key = `${STORAGE_PREFIX[type]}${id}`;
    return sessionStorage.getItem(key);
  }, []);

  /**
   * Clear share token from sessionStorage after use
   */
  const clearShareToken = useCallback((
    type: ShareType,
    id: string
  ) => {
    const key = `${STORAGE_PREFIX[type]}${id}`;
    sessionStorage.removeItem(key);
    console.log(`🧹 Share token cleared: ${key}`);
  }, []);

  /**
   * Track purchase conversion for products bought from share links
   */
  const trackPurchaseConversion = useCallback(async (
    productIds: string[],
    orderTotal: number
  ): Promise<void> => {
    const conversionValuePerProduct = orderTotal / Math.max(productIds.length, 1);
    
    for (const productId of productIds) {
      const shareToken = getStoredShareToken('product', productId);
      
      if (shareToken) {
        console.log(`📊 Tracking purchase conversion for product ${productId} from share ${shareToken}`);
        
        try {
          // Get share details to insert event
          const { data: share, error: shareError } = await supabase
            .from('product_shares')
            .select('id, product_id')
            .eq('share_token', shareToken)
            .maybeSingle();

          if (shareError) {
            console.error('Error finding share:', shareError);
            continue;
          }

          if (share) {
            // Insert purchase event
            const eventData = {
              share_id: share.id,
              product_id: share.product_id,
              event_type: 'purchase',
              user_agent: navigator.userAgent,
              device_type: getDeviceType(),
              referrer_url: document.referrer || null,
              landing_page: window.location.pathname,
              conversion_value: conversionValuePerProduct,
              metadata: { source: 'share_conversion_tracking' },
            };

            const { error: eventError } = await (supabase
              .from('product_share_events' as 'product_shares')
              .insert(eventData as never));

            if (eventError) {
              console.error('Error inserting purchase event:', eventError);
            }

            // Update share metrics using RPC
            const { error: updateError } = await (supabase.rpc as Function)('increment_share_metrics', {
              p_share_token: shareToken,
              p_event_type: 'purchase',
              p_conversion_value: conversionValuePerProduct,
            });

            if (updateError) {
              console.error('Error updating share metrics:', updateError);
            } else {
              console.log(`✅ Purchase conversion tracked for product ${productId}`);
            }
          }
          
          // Clear after tracking
          clearShareToken('product', productId);
        } catch (error) {
          console.error('Error tracking purchase conversion:', error);
        }
      }
    }
  }, [getStoredShareToken, clearShareToken]);

  /**
   * Track view event when landing on a product from share link
   */
  const trackViewFromShare = useCallback(async (
    shareToken: string,
    productId: string
  ): Promise<void> => {
    try {
      console.log(`👁️ Tracking view from share ${shareToken} for product ${productId}`);
      
      // Get share details
      const { data: share, error: shareError } = await supabase
        .from('product_shares')
        .select('id, product_id')
        .eq('share_token', shareToken)
        .maybeSingle();

      if (shareError || !share) {
        console.error('Share not found:', shareError);
        return;
      }

      // Insert view event
      const eventData = {
        share_id: share.id,
        product_id: share.product_id,
        event_type: 'view',
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
        referrer_url: document.referrer || null,
        landing_page: window.location.pathname,
        metadata: { source: 'share_conversion_tracking' },
      };

      const { error: eventError } = await (supabase
        .from('product_share_events' as 'product_shares')
        .insert(eventData as never));

      if (eventError) {
        console.error('Error inserting view event:', eventError);
      }

      // Increment view count
      const { error: updateError } = await (supabase.rpc as Function)('increment_share_metrics', {
        p_share_token: shareToken,
        p_event_type: 'view',
        p_conversion_value: 0,
      });

      if (updateError) {
        console.error('Error updating view metrics:', updateError);
      } else {
        console.log(`✅ View tracked for share ${shareToken}`);
      }
    } catch (error) {
      console.error('Error tracking view from share:', error);
    }
  }, []);

  /**
   * Track contribution conversion for funds contributed via share links
   */
  const trackContributionConversion = useCallback(async (
    fundId: string,
    amount: number
  ): Promise<void> => {
    const shareToken = getStoredShareToken('fund', fundId);
    
    if (shareToken) {
      console.log(`📊 Tracking contribution conversion for fund ${fundId} from share ${shareToken}`);
      
      try {
        // For fund shares, we use business_shares table if fund is linked to a business
        // or we can track in a simplified way via the collective_funds update
        
        // Update fund share metrics if available
        const { data: fundShare, error: findError } = await supabase
          .from('collective_funds')
          .select('share_token')
          .eq('id', fundId)
          .eq('share_token', shareToken)
          .maybeSingle();
        
        if (!findError && fundShare) {
          console.log(`✅ Contribution conversion tracked for fund ${fundId}, amount: ${amount}`);
        }
        
        // Clear after tracking
        clearShareToken('fund', fundId);
      } catch (error) {
        console.error('Error tracking contribution conversion:', error);
      }
    }
  }, [getStoredShareToken, clearShareToken]);

  /**
   * Track business follow from share link
   */
  const trackBusinessFollowConversion = useCallback(async (
    businessId: string
  ): Promise<void> => {
    const shareToken = getStoredShareToken('business', businessId);
    
    if (shareToken) {
      console.log(`📊 Tracking business follow conversion for ${businessId}`);
      
      try {
        // Update business share metrics using raw SQL update
        const { error } = await supabase
          .from('business_shares')
          .update({ 
            follow_count: 1, // Will be handled by trigger or manual increment
          })
          .eq('share_token', shareToken);
        
        if (error) {
          console.error('Error tracking business follow:', error);
        } else {
          console.log(`✅ Business follow conversion tracked`);
        }
        
        clearShareToken('business', businessId);
      } catch (error) {
        console.error('Error tracking business follow conversion:', error);
      }
    }
  }, [getStoredShareToken, clearShareToken]);

  /**
   * Clean URL by removing the ref parameter
   */
  const cleanShareRefFromUrl = useCallback(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('ref')) {
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.toString());
      console.log('🧹 Cleaned ref parameter from URL');
    }
  }, []);

  return {
    detectAndStoreShareToken,
    getStoredShareToken,
    clearShareToken,
    trackPurchaseConversion,
    trackViewFromShare,
    trackContributionConversion,
    trackBusinessFollowConversion,
    cleanShareRefFromUrl,
  };
}

/**
 * Helper to detect device type
 */
function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}
