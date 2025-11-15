import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserContext {
  hasCreatedFund: boolean;
  hasPostedRecently: boolean;
  contactsCount: number;
  hasUnthankededGifts: boolean;
  recentGiftsCount: number;
  loading: boolean;
}

export function useUserContext() {
  const [context, setContext] = useState<UserContext>({
    hasCreatedFund: false,
    hasPostedRecently: false,
    contactsCount: 0,
    hasUnthankededGifts: false,
    recentGiftsCount: 0,
    loading: true,
  });

  useEffect(() => {
    loadUserContext();
  }, []);

  const loadUserContext = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has created any collective funds
      const { data: funds } = await supabase
        .from('collective_funds')
        .select('id')
        .eq('creator_id', user.id)
        .limit(1);

      // Check if user has posted in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: recentPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .limit(1);

      // Count contacts
      const { count: contactsCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Check for received gifts without thank you messages (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentGifts } = await supabase
        .from('gifts')
        .select('id')
        .eq('receiver_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { data: thankYouMessages } = await supabase
        .from('gift_thanks')
        .select('gift_id')
        .eq('sender_id', user.id);

      const thankedGiftIds = new Set(thankYouMessages?.map(t => t.gift_id) || []);
      const unthankedGifts = recentGifts?.filter(g => !thankedGiftIds.has(g.id)) || [];

      setContext({
        hasCreatedFund: (funds?.length || 0) > 0,
        hasPostedRecently: (recentPosts?.length || 0) > 0,
        contactsCount: contactsCount || 0,
        hasUnthankededGifts: unthankedGifts.length > 0,
        recentGiftsCount: recentGifts?.length || 0,
        loading: false,
      });
    } catch (error) {
      console.error('Error loading user context:', error);
      setContext(prev => ({ ...prev, loading: false }));
    }
  };

  return { context, refresh: loadUserContext };
}
