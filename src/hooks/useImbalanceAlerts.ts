import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ImbalanceAlert {
  id: string;
  user_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  total_received: number;
  total_contributed: number;
  imbalance_ratio: number;
  contributions_received_count: number;
  contributions_given_count: number;
  days_since_last_contribution: number | null;
  recommended_action: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  metadata: any;
  user?: {
    first_name: string;
    last_name: string;
    avatar_url?: string | null;
  };
}

export function useImbalanceAlerts(status?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading, error } = useQuery({
    queryKey: ['imbalance-alerts', status],
    queryFn: async () => {
      let query = supabase
        .from('reciprocity_imbalance_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: alertsData, error } = await query;
      if (error) throw error;

      // Fetch user profiles separately
      const userIds = alertsData?.map(alert => alert.user_id) || [];
      
      if (userIds.length === 0) {
        return [];
      }

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      // Merge alerts with profiles
      const alerts = alertsData?.map(alert => ({
        ...alert,
        user: profilesData?.find(p => p.user_id === alert.user_id) || undefined,
      }));

      return alerts as ImbalanceAlert[];
    },
  });

  const updateAlert = useMutation({
    mutationFn: async ({
      alertId,
      updates,
    }: {
      alertId: string;
      updates: Partial<ImbalanceAlert>;
    }) => {
      const { error } = await supabase
        .from('reciprocity_imbalance_alerts')
        .update(updates)
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imbalance-alerts'] });
      toast({
        title: 'Alerte mise à jour',
        description: 'L\'alerte a été mise à jour avec succès',
      });
    },
    onError: (error) => {
      console.error('Error updating alert:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'alerte',
        variant: 'destructive',
      });
    },
  });

  const reviewAlert = useMutation({
    mutationFn: async ({
      alertId,
      status,
      notes,
    }: {
      alertId: string;
      status: 'reviewed' | 'resolved' | 'dismissed';
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('reciprocity_imbalance_alerts')
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes,
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imbalance-alerts'] });
      toast({
        title: 'Alerte traitée',
        description: 'L\'alerte a été marquée comme traitée',
      });
    },
    onError: (error) => {
      console.error('Error reviewing alert:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de traiter l\'alerte',
        variant: 'destructive',
      });
    },
  });

  return {
    alerts,
    isLoading,
    error,
    updateAlert,
    reviewAlert,
  };
}