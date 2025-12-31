import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useProfileCompletion = () => {
  const { user } = useAuth();
  const [needsCompletion, setNeedsCompletion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<{
    firstName?: string;
    lastName?: string;
  }>({});

  const checkProfileCompletion = useCallback(async () => {
    if (!user) {
      setNeedsCompletion(false);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, birthday, city')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error checking profile completion:', error);
        setNeedsCompletion(false);
        setIsLoading(false);
        return;
      }

      // Profile is incomplete if birthday OR city is missing
      const incomplete = !data?.birthday || !data?.city;
      setNeedsCompletion(incomplete);

      // Store initial data from Google if available
      if (incomplete) {
        setInitialData({
          firstName: data?.first_name || user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.first_name,
          lastName: data?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || user.user_metadata?.last_name,
        });
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
      setNeedsCompletion(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkProfileCompletion();
  }, [checkProfileCompletion]);

  const markComplete = useCallback(() => {
    setNeedsCompletion(false);
  }, []);

  const refreshCheck = useCallback(() => {
    setIsLoading(true);
    checkProfileCompletion();
  }, [checkProfileCompletion]);

  return { 
    needsCompletion, 
    isLoading, 
    markComplete, 
    refreshCheck,
    initialData 
  };
};
