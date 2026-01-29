import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleAnalytics } from './useGoogleAnalytics';

export interface AcquisitionData {
  user_id: string;
  source: string;
  medium: string;
  campaign: string | null;
  content: string | null;
  referral_code: string | null;
  landing_page: string;
  ai_referrer: string | null;
  social_source: string | null;
  device_type: string;
  is_mobile: boolean;
}

/**
 * Hook to track user acquisition sources from various channels:
 * - UTM parameters (Google Ads, Facebook, etc.)
 * - Referral codes (parrainage)
 * - AI referrers (ChatGPT, Perplexity, Claude)
 * - Social sources (WhatsApp, Instagram, TikTok)
 * - Deep links (/go/*)
 */
export function useAcquisitionTracking() {
  const { trackEvent } = useGoogleAnalytics();
  const acquisitionDataRef = useRef<Partial<AcquisitionData> | null>(null);

  // Capture acquisition data on mount (before user might navigate away)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;
    
    // Detect device type
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const deviceType = isMobile ? 'mobile' : 'desktop';
    
    // Detect AI referrer from various sources
    let aiReferrer: string | null = params.get('ai_ref');
    if (!aiReferrer) {
      const referrer = document.referrer.toLowerCase();
      if (referrer.includes('chat.openai.com') || referrer.includes('chatgpt')) {
        aiReferrer = 'chatgpt';
      } else if (referrer.includes('perplexity.ai')) {
        aiReferrer = 'perplexity';
      } else if (referrer.includes('claude.ai') || referrer.includes('anthropic')) {
        aiReferrer = 'claude';
      } else if (referrer.includes('you.com')) {
        aiReferrer = 'you';
      } else if (referrer.includes('bing.com') && params.get('utm_source') === 'bing_ai') {
        aiReferrer = 'bing_ai';
      } else if (referrer.includes('google.com') && params.get('utm_source') === 'google_ai') {
        aiReferrer = 'google_ai';
      }
    }
    
    // Detect social source
    let socialSource: string | null = params.get('social');
    if (!socialSource) {
      const referrer = document.referrer.toLowerCase();
      if (referrer.includes('whatsapp') || params.get('utm_source') === 'whatsapp') {
        socialSource = 'whatsapp';
      } else if (referrer.includes('instagram') || params.get('utm_source') === 'instagram') {
        socialSource = 'instagram';
      } else if (referrer.includes('tiktok') || params.get('utm_source') === 'tiktok') {
        socialSource = 'tiktok';
      } else if (referrer.includes('facebook') || params.get('utm_source') === 'facebook') {
        socialSource = 'facebook';
      } else if (referrer.includes('t.co') || referrer.includes('twitter')) {
        socialSource = 'twitter';
      } else if (referrer.includes('linkedin')) {
        socialSource = 'linkedin';
      }
    }
    
    // Detect deep link landing pages (/go/*)
    let source = params.get('utm_source') || 'direct';
    let medium = params.get('utm_medium') || 'none';
    
    if (pathname.startsWith('/go/')) {
      source = source === 'direct' ? 'deep_link' : source;
      medium = medium === 'none' ? 'deep_link' : medium;
    }
    
    // Store acquisition data
    acquisitionDataRef.current = {
      source,
      medium,
      campaign: params.get('utm_campaign'),
      content: params.get('utm_content'),
      referral_code: params.get('ref'),
      landing_page: pathname,
      ai_referrer: aiReferrer,
      social_source: socialSource,
      device_type: deviceType,
      is_mobile: isMobile,
    };
    
    // Store in session storage for persistence across page navigations
    sessionStorage.setItem('jdv_acquisition', JSON.stringify(acquisitionDataRef.current));
    
  }, []);

  /**
   * Track acquisition when a user successfully registers
   */
  const trackAcquisition = useCallback(async (userId: string) => {
    // Get stored acquisition data
    let acquisitionData = acquisitionDataRef.current;
    
    // Fallback to session storage if ref is null
    if (!acquisitionData) {
      const stored = sessionStorage.getItem('jdv_acquisition');
      if (stored) {
        acquisitionData = JSON.parse(stored);
      }
    }
    
    if (!acquisitionData) {
      console.warn('[Acquisition] No acquisition data found');
      return;
    }

    const fullData: AcquisitionData = {
      user_id: userId,
      source: acquisitionData.source || 'direct',
      medium: acquisitionData.medium || 'none',
      campaign: acquisitionData.campaign || null,
      content: acquisitionData.content || null,
      referral_code: acquisitionData.referral_code || null,
      landing_page: acquisitionData.landing_page || '/',
      ai_referrer: acquisitionData.ai_referrer || null,
      social_source: acquisitionData.social_source || null,
      device_type: acquisitionData.device_type || 'unknown',
      is_mobile: acquisitionData.is_mobile || false,
    };

    console.log('[Acquisition] Tracking:', fullData);

    // Track in GA4
    trackEvent('acquisition_complete', {
      source: fullData.source,
      medium: fullData.medium,
      campaign: fullData.campaign,
      ai_referrer: fullData.ai_referrer,
      social_source: fullData.social_source,
      landing_page: fullData.landing_page,
    });

    // Note: Acquisition data is tracked via GA4 and session storage
    // To persist to database, create a user_acquisition table or add columns to profiles

    // Clear session storage after tracking
    sessionStorage.removeItem('jdv_acquisition');
    
    return fullData;
  }, [trackEvent]);

  /**
   * Get current acquisition data without tracking
   */
  const getAcquisitionData = useCallback((): Partial<AcquisitionData> | null => {
    if (acquisitionDataRef.current) {
      return acquisitionDataRef.current;
    }
    
    const stored = sessionStorage.getItem('jdv_acquisition');
    if (stored) {
      return JSON.parse(stored);
    }
    
    return null;
  }, []);

  return { 
    trackAcquisition, 
    getAcquisitionData,
  };
}
