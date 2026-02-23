import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const COMPLETION_NOTIFICATION_KEY = 'friends_circle_completion_notified_';

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

  // Send completion notification (push + in-app)
  const sendCompletionNotification = useCallback(async () => {
    if (!user?.id) return;

    const notificationKey = `${COMPLETION_NOTIFICATION_KEY}${user.id}`;
    
    // Check if already sent
    if (localStorage.getItem(notificationKey)) {
      console.log('Completion notification already sent');
      return;
    }

    try {
      // Mark as sent immediately to prevent duplicates
      localStorage.setItem(notificationKey, 'true');

      const notificationTitle = '🎉 Bravo ! Cercle d\'amis complété';
      const notificationMessage = 'Votre cercle d\'amis est prêt ! C\'est le moment idéal pour offrir votre premier cadeau à un proche.';

      // 1. Send push notification
      const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_ids: [user.id],
          title: notificationTitle,
          message: notificationMessage,
          type: 'celebration',
          action_url: '/shop'
        }
      });

      if (pushError) {
        console.error('Error sending push notification:', pushError);
      } else {
        console.log('Push notification sent for friend circle completion');
      }

      // 2. Create in-app notification
      const { error: inAppError } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: notificationTitle,
          message: notificationMessage,
          type: 'celebration',
          action_url: '/shop',
          is_read: false,
          metadata: { event: 'friends_circle_completed' }
        });

      if (inAppError) {
        console.error('Error creating in-app notification:', inAppError);
      } else {
        console.log('In-app notification created for friend circle completion');
      }

      // 3. Send SMS/WhatsApp celebration to user's own phone
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('phone, first_name')
        .eq('user_id', user.id)
        .single();

      if (userProfile?.phone) {
        const smsMessage = `🎉 Bravo ${userProfile.first_name || ''} ! Ton cercle d'amis est prêt. Offre ton premier cadeau maintenant 👉 joiedevivre-africa.com/shop`;
        const { error: smsError } = await supabase.functions.invoke('notify-contact-added', {
          body: {
            contact_id: user.id,
            contact_name: userProfile.first_name || 'Utilisateur',
            contact_phone: userProfile.phone,
            birthday: new Date().toISOString(),
            _celebration: true
          }
        });

        if (smsError) {
          console.error('Error sending SMS/WhatsApp celebration:', smsError);
        } else {
          console.log('SMS/WhatsApp celebration sent for circle completion');
        }
      }

    } catch (error) {
      console.error('Error sending completion notification:', error);
      // Remove the flag if sending failed
      localStorage.removeItem(notificationKey);
    }
  }, [user?.id]);

  return {
    ...state,
    snoozeReminder,
    refresh,
    minimumContacts: MINIMUM_CONTACTS,
    sendCompletionNotification,
  };
}
