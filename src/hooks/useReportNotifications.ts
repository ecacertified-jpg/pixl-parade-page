import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from './useAdmin';
import { toast } from 'sonner';

const reasonLabels: Record<string, string> = {
  spam: 'Spam',
  inappropriate: 'Contenu inapproprié',
  harassment: 'Harcèlement',
  fake_news: 'Fausses informations',
  other: 'Autre',
};

export const useReportNotifications = () => {
  const { isAdmin, loading } = useAdmin();

  useEffect(() => {
    if (loading || !isAdmin) return;

    console.log('📢 [REPORT NOTIFICATIONS] Setting up realtime listener for admin');

    const channel = supabase
      .channel('admin-report-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reported_posts'
        },
        (payload) => {
          console.log('📢 [REPORT NOTIFICATIONS] New report received:', payload);
          
          const report = payload.new;
          const reasonLabel = reasonLabels[report.reason as string] || report.reason;
          
          toast.error('Nouveau signalement', {
            description: `Raison: ${reasonLabel}`,
            duration: 5000,
          });
        }
      )
      .subscribe((status) => {
        console.log('📢 [REPORT NOTIFICATIONS] Subscription status:', status);
      });

    return () => {
      console.log('📢 [REPORT NOTIFICATIONS] Cleaning up realtime listener');
      supabase.removeChannel(channel);
    };
  }, [isAdmin, loading]);
};
