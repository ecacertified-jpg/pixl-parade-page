import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const MINIMUM_CONTACTS = 2;
const SNOOZE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface FriendsCircleReminderState {
  shouldShowReminder: boolean;
  contactsCount: number;
  isLoading: boolean;
  isProfileComplete: boolean;
}

export function useFriendsCircleReminder() {
  const { user } = useAuth();
  const [state, setState] = useState<FriendsCircleReminderState>({
    shouldShowReminder: false,
    contactsCount: 0,
    isLoading: true,
    isProfileComplete: false,
  });

  const getSnoozeKey = useCallback(() => {
    return `friends_circle_snoozed_until_${user?.id}`;
  }, [user?.id]);

  const isSnoozed = useCallback(() => {
    if (!user?.id) return false;
    const snoozedUntil = localStorage.getItem(getSnoozeKey());
    if (!snoozedUntil) return false;
    return Date.now() < parseInt(snoozedUntil, 10);
  }, [user?.id, getSnoozeKey]);

  const snoozeReminder = useCallback(() => {
    if (!user?.id) return;
    const snoozeUntil = Date.now() + SNOOZE_DURATION;
    localStorage.setItem(getSnoozeKey(), snoozeUntil.toString());
    setState(prev => ({ ...prev, shouldShowReminder: false }));
  }, [user?.id, getSnoozeKey]);

  const checkReminderStatus = useCallback(async () => {
    if (!user?.id) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Check if profile is complete (has birthday and city)
      const { data: profile } = await supabase
        .from('profiles')
        .select('birthday, city')
        .eq('user_id', user.id)
        .single();

      const isProfileComplete = !!(profile?.birthday && profile?.city);

      // Count user's contacts
      const { count } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const contactsCount = count || 0;
      const needsMoreContacts = contactsCount < MINIMUM_CONTACTS;
      const snoozed = isSnoozed();

      setState({
        shouldShowReminder: isProfileComplete && needsMoreContacts && !snoozed,
        contactsCount,
        isLoading: false,
        isProfileComplete,
      });
    } catch (error) {
      console.error('Error checking friends circle reminder status:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user?.id, isSnoozed]);

  useEffect(() => {
    checkReminderStatus();
  }, [checkReminderStatus]);

  const refresh = useCallback(() => {
    checkReminderStatus();
  }, [checkReminderStatus]);

  return {
    ...state,
    snoozeReminder,
    refresh,
    minimumContacts: MINIMUM_CONTACTS,
  };
}
