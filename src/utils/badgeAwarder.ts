import { supabase } from '@/integrations/supabase/client';

/**
 * Call the award-badges edge function to check and award badges for a user
 */
export const checkAndAwardBadges = async (userId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('award-badges', {
      body: { userId }
    });

    if (error) {
      console.error('Error checking badges:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Exception while checking badges:', error);
    return { success: false, error };
  }
};

/**
 * Hook into common user actions to trigger badge checks
 */
export const triggerBadgeCheckAfterAction = async (
  action: 'contribution' | 'fund_creation' | 'add_friend' | 'send_thanks',
  userId: string
) => {
  // Delay slightly to allow database updates to complete
  setTimeout(async () => {
    await checkAndAwardBadges(userId);
  }, 1000);
};
