import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const fetchOnboardingStatus = async (userId: string): Promise<boolean> => {
  // Check localStorage first
  const localFlag = localStorage.getItem(`onboarding_completed_${userId}`);
  if (localFlag === 'true') return false;

  // Check URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('onboarding') === 'true') return true;

  // Check if user is newly created (within last 5 minutes)
  const { data: profile } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('id', userId)
    .single();

  if (profile) {
    const diffMinutes = (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60);
    if (diffMinutes < 5) return true;
  }

  return false;
};

export const useOnboarding = () => {
  const { user } = useAuth();
  const [manuallyCompleted, setManuallyCompleted] = useState(false);

  const { data: shouldShow, isLoading } = useQuery({
    queryKey: ['onboarding-status', user?.id],
    queryFn: () => fetchOnboardingStatus(user!.id),
    enabled: !!user?.id,
    staleTime: Infinity,
  });

  const completeOnboarding = useCallback(() => {
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
    }
    setManuallyCompleted(true);
  }, [user]);

  return {
    shouldShowOnboarding: manuallyCompleted ? false : (shouldShow ?? false),
    isLoading,
    completeOnboarding,
  };
};
