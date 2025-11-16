import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useBusinessOrderNotifications = (businessAccountId?: string) => {
  useEffect(() => {
    if (!businessAccountId) return;

    console.log('📢 [ORDER NOTIFICATIONS] Setting up realtime listener for business:', businessAccountId);

    const channel = supabase
      .channel('business-order-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'business_orders',
          filter: `business_account_id=eq.${businessAccountId}`
        },
        (payload) => {
          console.log('📢 [ORDER NOTIFICATIONS] New order received:', payload);
          
          const order = payload.new;
          
          toast.success('Nouvelle commande reçue !', {
            description: `Montant: ${order.total_amount} ${order.currency}`,
            duration: 5000,
          });
        }
      )
      .subscribe((status) => {
        console.log('📢 [ORDER NOTIFICATIONS] Subscription status:', status);
      });

    return () => {
      console.log('📢 [ORDER NOTIFICATIONS] Cleaning up realtime listener');
      supabase.removeChannel(channel);
    };
  }, [businessAccountId]);
};
