import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  required: boolean;
  isCompleted: boolean;
}

interface BusinessOnboardingState {
  hasProducts: boolean;
  hasDeliveryZones: boolean;
  hasPaymentInfo: boolean;
  hasDescription: boolean;
  hasLogo: boolean;
  hasPushNotifications: boolean;
}

export const useBusinessOnboarding = (businessId?: string) => {
  const { user } = useAuth();
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completionState, setCompletionState] = useState<BusinessOnboardingState>({
    hasProducts: false,
    hasDeliveryZones: false,
    hasPaymentInfo: false,
    hasDescription: false,
    hasLogo: false,
    hasPushNotifications: false,
  });

  // Helper function to check if push notifications are subscribed
  const checkPushSubscription = async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return false;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch {
      return false;
    }
  };

  const checkOnboardingStatus = useCallback(async () => {
    if (!user || !businessId) {
      setIsLoading(false);
      return;
    }

    // Check localStorage first
    const localFlag = localStorage.getItem(`business_onboarding_completed_${businessId}`);
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
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Fetch business data to check completion
    try {
      const { data: business } = await supabase
        .from('business_accounts')
        .select('description, logo_url, delivery_zones, payment_info, created_at')
        .eq('id', businessId)
        .single();

      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('business_id', businessId)
        .limit(1);

      if (business) {
        const deliveryZones = business.delivery_zones as { name: string }[] | null;
        const paymentInfo = business.payment_info as { mobile_money?: string } | null;

        // Check if push notifications are enabled
        const hasPush = await checkPushSubscription();

        const state: BusinessOnboardingState = {
          hasProducts: (products?.length || 0) > 0,
          hasDeliveryZones: (deliveryZones?.length || 0) > 0,
          hasPaymentInfo: !!paymentInfo?.mobile_money,
          hasDescription: !!business.description && business.description.length > 10,
          hasLogo: !!business.logo_url,
          hasPushNotifications: hasPush,
        };

        setCompletionState(state);

        // Check if business is new (created less than 5 minutes ago)
        const createdAt = new Date(business.created_at);
        const now = new Date();
        const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

        if (diffMinutes < 5 && !localFlag) {
          setShouldShowOnboarding(true);
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }

    setIsLoading(false);
  }, [user, businessId]);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  const getSteps = useCallback((): OnboardingStep[] => {
    return [
      {
        id: 'welcome',
        title: 'Bienvenue !',
        description: 'Votre espace business est prêt. Configurons votre boutique ensemble.',
        icon: 'PartyPopper',
        required: false,
        isCompleted: true,
      },
      {
        id: 'profile',
        title: 'Profil boutique',
        description: 'Ajoutez une description et un logo pour attirer les clients.',
        icon: 'Store',
        required: true,
        isCompleted: completionState.hasDescription && completionState.hasLogo,
      },
      {
        id: 'first-product',
        title: 'Premier produit',
        description: 'Ajoutez votre premier produit ou service à vendre.',
        icon: 'Package',
        required: true,
        isCompleted: completionState.hasProducts,
      },
      {
        id: 'delivery',
        title: 'Livraison',
        description: 'Configurez vos zones et frais de livraison.',
        icon: 'Truck',
        required: false,
        isCompleted: completionState.hasDeliveryZones,
      },
      {
        id: 'payment',
        title: 'Paiement',
        description: 'Ajoutez vos informations Mobile Money.',
        icon: 'Wallet',
        required: false,
        isCompleted: completionState.hasPaymentInfo,
      },
      {
        id: 'notifications',
        title: 'Notifications',
        description: 'Activez les notifications pour ne manquer aucune commande.',
        icon: 'Bell',
        required: false,
        isCompleted: completionState.hasPushNotifications,
      },
      {
        id: 'complete',
        title: 'Terminé !',
        description: 'Votre boutique est prête à recevoir des commandes.',
        icon: 'CheckCircle',
        required: false,
        isCompleted: false,
      },
    ];
  }, [completionState]);

  const steps = getSteps();
  const completedCount = steps.filter(s => s.isCompleted && s.id !== 'welcome' && s.id !== 'complete').length;
  const totalSteps = steps.filter(s => s.id !== 'welcome' && s.id !== 'complete').length;
  const progress = Math.round((completedCount / totalSteps) * 100);
  const isOnboardingComplete = progress === 100;

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
    }
  };

  const completeOnboarding = () => {
    if (businessId) {
      localStorage.setItem(`business_onboarding_completed_${businessId}`, 'true');
    }
    setShouldShowOnboarding(false);
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const dismissChecklist = () => {
    if (businessId) {
      localStorage.setItem(`business_checklist_dismissed_${businessId}`, 'true');
    }
  };

  const isChecklistDismissed = () => {
    if (!businessId) return false;
    return localStorage.getItem(`business_checklist_dismissed_${businessId}`) === 'true';
  };

  const refreshState = () => {
    checkOnboardingStatus();
  };

  return {
    shouldShowOnboarding,
    isLoading,
    steps,
    currentStepIndex,
    currentStep: steps[currentStepIndex],
    completedCount,
    totalSteps,
    progress,
    isOnboardingComplete,
    nextStep,
    prevStep,
    goToStep,
    completeOnboarding,
    skipOnboarding,
    dismissChecklist,
    isChecklistDismissed,
    refreshState,
  };
};
