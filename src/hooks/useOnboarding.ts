import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface OnboardingStatus {
  shouldShow: boolean;
  firstIncompleteStep: number;
  dbFurthestStep: number;
}

const fetchOnboardingStatus = async (userId: string): Promise<OnboardingStatus> => {
  // URL override
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('onboarding') === 'true') {
    return { shouldShow: true, firstIncompleteStep: 0, dbFurthestStep: 0 };
  }

  // Check all steps in parallel
  const [profileRes, favRes, bpRes] = await Promise.all([
    supabase.from('profiles').select('birthday, selected_tastes, onboarding_completed, onboarding_furthest_step').eq('user_id', userId).single(),
    supabase.from('user_favorites').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('birthday_pages').select('id, slug, published_at, published_via_onboarding').eq('user_id', userId).eq('is_active', true).maybeSingle(),
  ]);

  const dbFurthestStep = (profileRes.data as any)?.onboarding_furthest_step ?? 0;

  // If onboarding already marked complete in DB, skip entirely
  if ((profileRes.data as any)?.onboarding_completed === true) {
    return { shouldShow: false, firstIncompleteStep: 0, dbFurthestStep };
  }

  // NOTE: Birthday date is captured during pre-auth (PreAuthDiscovery), so we
  // do NOT include a birthday step here anymore.

  // Step 1: Goûts (≥1 taste selected)
  if (!(profileRes.data as any)?.selected_tastes?.length) {
    return { shouldShow: true, firstIncompleteStep: 1, dbFurthestStep };
  }

  // Step 2: Souhaits (≥3 favorites)
  if ((favRes.count || 0) < 3) {
    return { shouldShow: true, firstIncompleteStep: 2, dbFurthestStep };
  }

  // Step 3: Type de page (read from localStorage like the BirthdayPageBuilderModal)
  const storedType = localStorage.getItem(`bp_type_${userId}`);
  if (storedType !== 'self' && storedType !== 'friend' && storedType !== 'other_event') {
    return { shouldShow: true, firstIncompleteStep: 3, dbFurthestStep };
  }

  const page = (bpRes.data as any) || null;

  // Step 4: Première photo
  let firstPhotoCount = 0;
  if (page?.id) {
    const { count } = await supabase
      .from('birthday_page_photos')
      .select('*', { count: 'exact', head: true })
      .eq('birthday_page_id', page.id);
    firstPhotoCount = count || 0;
  }
  if (firstPhotoCount < 1) {
    return { shouldShow: true, firstIncompleteStep: 4, dbFurthestStep };
  }

  // Step 5: Publier + partager
  const hasPage = !!page;
  const isPublished = !!(page?.published_at);
  const { count: shareCount } = await supabase
    .from('onboarding_shares')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (!hasPage || !isPublished || (shareCount || 0) < 3) {
    return { shouldShow: true, firstIncompleteStep: 5, dbFurthestStep };
  }

  // All steps done
  return { shouldShow: false, firstIncompleteStep: 0, dbFurthestStep };
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
  const dbFurthestStep = status?.dbFurthestStep ?? 0;

  // Read the furthest step ever reached from localStorage
  const storedFurthestStep = user?.id
    ? parseInt(localStorage.getItem(`onboarding_step_${user.id}`) || '0', 10)
    : 0;

  const [currentStep, setCurrentStepState] = useState<number | null>(null);

  // Never go backwards: use the max of DB-computed step, stored furthest step, and DB persisted furthest step.
  // Clamp to the new max step (5) to handle legacy values left from when onboarding had more steps.
  const effectiveCurrentStep = currentStep ?? Math.min(
    5,
    Math.max(firstIncompleteStep, storedFurthestStep, dbFurthestStep)
  );

  const setCurrentStep = useCallback((step: number) => {
    setCurrentStepState(step);
    if (user?.id) {
      const key = `onboarding_step_${user.id}`;
      const prev = parseInt(localStorage.getItem(key) || '0', 10);
      if (step > prev) {
        localStorage.setItem(key, String(step));
      }
      // Fire-and-forget DB persistence (cross-device)
      if (step > dbFurthestStep) {
        supabase
          .from('profiles')
          .update({ onboarding_furthest_step: step } as any)
          .eq('user_id', user.id)
          .then(({ error }) => {
            if (error) console.error('Failed to persist onboarding step to DB:', error);
          });
      }
    }
  }, [user?.id, dbFurthestStep]);

  const completeOnboarding = useCallback(async () => {
    if (user) {
      // Mark onboarding_completed in DB only if all steps are truly done
      const fresh = await fetchOnboardingStatus(user.id);
      if (!fresh.shouldShow) {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true, onboarding_furthest_step: 0 } as any)
          .eq('user_id', user.id);
        localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
        localStorage.removeItem(`onboarding_step_${user.id}`);
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
