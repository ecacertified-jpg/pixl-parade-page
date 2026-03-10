import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ProfileCompletionData {
  needsCompletion: boolean;
  isGoogleUser: boolean;
  initialData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}

const fetchProfileCompletion = async (user: { id: string; user_metadata?: any; phone?: string; app_metadata?: any; identities?: any[] }): Promise<ProfileCompletionData> => {
  // Detect auth provider
  const isGoogleAuth = user.app_metadata?.provider === 'google' ||
    user.identities?.some((i: any) => i.provider === 'google');

  // For phone/email signups, data is already collected during registration
  if (!isGoogleAuth) {
    return { needsCompletion: false, isGoogleUser: false, initialData: {} };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, birthday, city, phone')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return { needsCompletion: false, isGoogleUser: true, initialData: {} };
  }

  const incomplete = !data.first_name || !data.birthday || !data.city || !data.phone;

  return {
    needsCompletion: incomplete,
    isGoogleUser: true,
    initialData: incomplete ? {
      firstName: data.first_name || user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.first_name,
      lastName: data.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || user.user_metadata?.last_name,
      phone: data.phone || user.phone || '',
    } : {},
  };
};

export const useProfileCompletion = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [manuallyComplete, setManuallyComplete] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['profile-completion', user?.id],
    queryFn: () => fetchProfileCompletion(user!),
    enabled: !!user?.id,
    staleTime: 60000,
  });

  const markComplete = useCallback(() => {
    setManuallyComplete(true);
  }, []);

  const refreshCheck = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['profile-completion', user?.id] });
  }, [queryClient, user?.id]);

  return {
    needsCompletion: manuallyComplete ? false : (data?.needsCompletion ?? false),
    isLoading,
    markComplete,
    refreshCheck,
    initialData: data?.initialData ?? {},
    isGoogleUser: data?.isGoogleUser ?? false,
  };
};
