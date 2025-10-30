import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useOnboarding = () => {
  const { user } = useAuth();
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Check localStorage first for quick response
      const localFlag = localStorage.getItem(`onboarding_completed_${user.id}`);
      if (localFlag === 'true') {
        setShouldShowOnboarding(false);
        setIsLoading(false);
        return;
      }

      // Check URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      const onboardingParam = urlParams.get('onboarding');
      
      if (onboardingParam === 'true') {
        setShouldShowOnboarding(true);
        setIsLoading(false);
        return;
      }

      // Check if user is newly created (within last 5 minutes)
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('id', user.id)
          .single();

        if (profile) {
          const createdAt = new Date(profile.created_at);
          const now = new Date();
          const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
          
          // If account created less than 5 minutes ago and no local flag
          if (diffMinutes < 5 && !localFlag) {
            setShouldShowOnboarding(true);
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }

      setIsLoading(false);
    };

    checkOnboardingStatus();
  }, [user]);

  const completeOnboarding = () => {
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
    }
    setShouldShowOnboarding(false);
  };

  return {
    shouldShowOnboarding,
    isLoading,
    completeOnboarding,
  };
};
