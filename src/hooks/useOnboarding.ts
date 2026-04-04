import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface OnboardingStatus {
  shouldShow: boolean;
  firstIncompleteStep: number;
}

const fetchOnboardingStatus = async (userId: string): Promise<OnboardingStatus> => {
  // URL override
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('onboarding') === 'true') {
    return { shouldShow: true, firstIncompleteStep: 0 };
  }

  // Check all steps in parallel
  const [profileRes, favRes, friendRes] = await Promise.all([
    supabase.from('profiles').select('birthday, selected_tastes').eq('user_id', userId).single(),
    supabase.from('user_favorites').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('friend_form_tokens').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed'),
  ]);

  // Step 1: Birthday
  if (!profileRes.data?.birthday) {
    return { shouldShow: true, firstIncompleteStep: 1 };
  }

  // Step 2: Goûts (≥1 taste selected)
  if (!(profileRes.data as any)?.selected_tastes?.length) {
    return { shouldShow: true, firstIncompleteStep: 2 };
  }

  // Step 3: Souhaits (≥3 favorites)
  if ((favRes.count || 0) < 3) {
    return { shouldShow: true, firstIncompleteStep: 3 };
  }

  // Step 4: Amis (≥3 completed friend forms)
  if ((friendRes.count || 0) < 3) {
    return { shouldShow: true, firstIncompleteStep: 4 };
  }

  // All steps done
  return { shouldShow: false, firstIncompleteStep: 0 };
};

export const useOnboarding = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [manuallyCompleted, setManuallyCompleted] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ['onboarding-status', user?.id],
    queryFn: () => fetchOnboardingStatus(user!.id),
    enabled: !!user?.id,
    staleTime: 60000,
    retry: 2,
  });

  const shouldShow = status?.shouldShow ?? false;
  const firstIncompleteStep = status?.firstIncompleteStep ?? 0;

  const [currentStep, setCurrentStepState] = useState<number | null>(null);

  // Initialize currentStep from firstIncompleteStep once loaded
  const effectiveCurrentStep = currentStep ?? firstIncompleteStep;

  const setCurrentStep = useCallback((step: number) => {
    setCurrentStepState(step);
  }, []);

  const completeOnboarding = useCallback(async () => {
    if (user) {
      // Mark onboarding_completed in DB only if all steps are truly done
      const fresh = await fetchOnboardingStatus(user.id);
      if (!fresh.shouldShow) {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('user_id', user.id);
        localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
      }
      queryClient.invalidateQueries({ queryKey: ['onboarding-status', user.id] });
    }
    setManuallyCompleted(true);
  }, [user, queryClient]);

  return {
    shouldShowOnboarding: manuallyCompleted ? false : shouldShow,
    isLoading,
    completeOnboarding,
    currentStep: effectiveCurrentStep,
    setCurrentStep,
    firstIncompleteStep,
  };
};
