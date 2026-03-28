import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const fetchOnboardingStatus = async (userId: string): Promise<boolean> => {
  // Fast cache check
  const localFlag = localStorage.getItem(`onboarding_completed_${userId}`);
  if (localFlag === 'true') return false;

  // URL override
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('onboarding') === 'true') return true;

  // Source of truth: database flag
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('user_id', userId)
    .single();

  // Profile not yet created (race condition) → new user → show onboarding
  if (!profile) return true;

  if (profile.onboarding_completed === false) return true;

  // Cache for next visit
  if (profile?.onboarding_completed === true) {
    localStorage.setItem(`onboarding_completed_${userId}`, 'true');
  }

  return false;
};

const getSavedStep = (userId: string): number => {
  const saved = localStorage.getItem(`onboarding_step_${userId}`);
  return saved ? parseInt(saved, 10) : 0;
};

export const useOnboarding = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [manuallyCompleted, setManuallyCompleted] = useState(false);
  const [currentStep, setCurrentStepState] = useState(() =>
    user ? getSavedStep(user.id) : 0
  );

  const { data: shouldShow, isLoading } = useQuery({
    queryKey: ['onboarding-status', user?.id],
    queryFn: () => fetchOnboardingStatus(user!.id),
    enabled: !!user?.id,
    staleTime: 300000,
    retry: 2,
  });

  const setCurrentStep = useCallback((step: number) => {
    setCurrentStepState(step);
    if (user) {
      localStorage.setItem(`onboarding_step_${user.id}`, String(step));
    }
  }, [user]);

  const completeOnboarding = useCallback(async () => {
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
      localStorage.removeItem(`onboarding_step_${user.id}`);
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true } as any)
        .eq('user_id', user.id);
      queryClient.invalidateQueries({ queryKey: ['onboarding-status', user.id] });
    }
    setManuallyCompleted(true);
  }, [user, queryClient]);

  return {
    shouldShowOnboarding: manuallyCompleted ? false : (shouldShow ?? false),
    isLoading,
    completeOnboarding,
    currentStep,
    setCurrentStep,
  };
};
