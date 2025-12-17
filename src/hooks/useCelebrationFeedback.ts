import { useCallback } from 'react';
import { useNotificationPreferences } from './useNotificationPreferences';
import { 
  triggerCelebrationFeedback, 
  CelebrationFeedbackOptions 
} from '@/utils/celebrationFeedback';

export const useCelebrationFeedback = () => {
  const { preferences } = useNotificationPreferences();

  const triggerFeedback = useCallback((options: CelebrationFeedbackOptions) => {
    triggerCelebrationFeedback(options, {
      soundEnabled: preferences?.sound_enabled ?? true,
      vibrationEnabled: preferences?.vibration_enabled ?? true,
    });
  }, [preferences?.sound_enabled, preferences?.vibration_enabled]);

  return { triggerFeedback };
};
