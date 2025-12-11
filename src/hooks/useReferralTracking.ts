import { supabase } from '@/integrations/supabase/client';

interface TrackingMetadata {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  [key: string]: any;
}

export const useReferralTracking = () => {
  const trackReferralEvent = async (
    code: string,
    eventType: 'view' | 'click' | 'signup' | 'conversion',
    metadata?: TrackingMetadata
  ) => {
    try {
      // Get referral code info
      const { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('id, user_id')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (codeError || !codeData) {
        console.error('Invalid referral code:', code);
        return false;
      }

      // Gather context
      const urlParams = new URLSearchParams(window.location.search);
      const trackingData = {
        referral_code_id: codeData.id,
        referrer_id: codeData.user_id,
        event_type: eventType,
        user_agent: navigator.userAgent,
        referrer_url: document.referrer || null,
        landing_page: window.location.href,
        utm_source: urlParams.get('utm_source') || metadata?.utm_source || null,
        utm_medium: urlParams.get('utm_medium') || metadata?.utm_medium || null,
        utm_campaign: urlParams.get('utm_campaign') || metadata?.utm_campaign || null,
        utm_content: urlParams.get('utm_content') || metadata?.utm_content || null,
        utm_term: urlParams.get('utm_term') || metadata?.utm_term || null,
        metadata: metadata || {},
      };

      // Insert tracking event
      const { error: trackError } = await supabase
        .from('referral_tracking')
        .insert(trackingData);

      if (trackError) throw trackError;

      // Update code stats manually
      const updateField = `${eventType}s_count`;
      const { data: currentCode } = await supabase
        .from('referral_codes')
        .select(updateField)
        .eq('id', codeData.id)
        .single();
      
      if (currentCode) {
        await supabase
          .from('referral_codes')
          .update({
            [updateField]: (currentCode[updateField as keyof typeof currentCode] as number) + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq('id', codeData.id);
      }

      return true;
    } catch (error) {
      console.error('Error tracking referral event:', error);
      return false;
    }
  };

  const getActiveReferralCode = (): string | null => {
    // Check URL params first
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');
    if (refParam) return refParam;

    // Check sessionStorage first (more secure), then localStorage for persistence
    const storages = [sessionStorage, localStorage];
    
    for (const storage of storages) {
      const stored = storage.getItem('referral_code');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Validate expiry (max 7 days for security)
          const maxExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
          if (parsed.expires > Date.now() && parsed.expires <= maxExpiry) {
            return parsed.code;
          } else {
            storage.removeItem('referral_code');
          }
        } catch {
          storage.removeItem('referral_code');
        }
      }
    }

    return null;
  };

  const setActiveReferralCode = (code: string) => {
    // Validate code format (alphanumeric only)
    if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
      console.error('Invalid referral code format');
      return;
    }
    
    const data = {
      code: code.substring(0, 50), // Limit code length
      timestamp: Date.now(),
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days (reduced from 30)
    };
    // Use sessionStorage for better security
    sessionStorage.setItem('referral_code', JSON.stringify(data));
  };

  const clearActiveReferralCode = () => {
    sessionStorage.removeItem('referral_code');
    localStorage.removeItem('referral_code');
  };

  return {
    trackReferralEvent,
    getActiveReferralCode,
    setActiveReferralCode,
    clearActiveReferralCode,
  };
};
