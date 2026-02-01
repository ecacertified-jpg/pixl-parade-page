import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DeliveryStatus, OrderDeliveryInfo } from '@/types/delivery';
import { toast } from 'sonner';

interface AssignPartnerParams {
  orderId: string;
  partnerId: string;
  deliveryFee?: number;
  deliveryNotes?: string;
  estimatedDeliveryTime?: string;
}

interface UpdateDeliveryStatusParams {
  orderId: string;
  status: DeliveryStatus;
  notes?: string;
  location?: { latitude: number; longitude: number };
}

export function useOrderDelivery() {
  const [loading, setLoading] = useState(false);

  // Assign a delivery partner to an order
  const assignPartner = useCallback(async ({
    orderId,
    partnerId,
    deliveryFee,
    deliveryNotes,
    estimatedDeliveryTime
  }: AssignPartnerParams): Promise<boolean> => {
    try {
      setLoading(true);

      // Update the order with delivery partner info
      const { error: updateError } = await supabase
        .from('business_orders')
        .update({
          delivery_partner_id: partnerId,
          delivery_status: 'assigned',
          delivery_fee: deliveryFee || null,
          delivery_notes: deliveryNotes || null,
          delivery_assigned_at: new Date().toISOString(),
          estimated_delivery_time: estimatedDeliveryTime || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Create initial tracking entry
      const { error: trackingError } = await supabase
        .from('delivery_tracking')
        .insert({
          order_id: orderId,
          partner_id: partnerId,
          status: 'assigned',
          notes: deliveryNotes || 'Livreur assigné à la commande'
        });

      if (trackingError) {
        console.error('Error creating tracking entry:', trackingError);
        // Non-blocking error - continue
      }

      // Send notification to the delivery partner (if they have a user_id)
      const { data: partner } = await supabase
        .from('delivery_partners')
        .select('user_id, company_name')
        .eq('id', partnerId)
        .single();

      if (partner?.user_id) {
        await supabase.from('notifications').insert({
          user_id: partner.user_id,
          title: 'Nouvelle livraison assignée',
          message: `Une nouvelle commande vous a été assignée. Préparez-vous pour la récupérer.`,
          type: 'delivery_assigned',
          action_url: `/deliveries/${orderId}`,
          metadata: { order_id: orderId }
        });
      }

      toast.success('Livreur assigné avec succès');
      return true;
    } catch (err) {
      console.error('Error assigning delivery partner:', err);
      toast.error("Erreur lors de l'assignation du livreur");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update delivery status
  const updateDeliveryStatus = useCallback(async ({
    orderId,
    status,
    notes,
    location
  }: UpdateDeliveryStatusParams): Promise<boolean> => {
    try {
      setLoading(true);

      const updateData: Record<string, any> = {
        delivery_status: status,
        updated_at: new Date().toISOString()
      };

      // Set specific timestamps based on status
      if (status === 'picked_up') {
        updateData.delivery_pickup_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivery_delivered_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('business_orders')
        .update(updateData)
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Get the partner_id for tracking
      const { data: order } = await supabase
        .from('business_orders')
        .select('delivery_partner_id')
        .eq('id', orderId)
        .single();

      if (order?.delivery_partner_id) {
        // Add tracking entry
        await supabase.from('delivery_tracking').insert({
          order_id: orderId,
          partner_id: order.delivery_partner_id,
          status,
          notes,
          location: location ? { latitude: location.latitude, longitude: location.longitude } : null
        });
      }

      toast.success('Statut de livraison mis à jour');
      return true;
    } catch (err) {
      console.error('Error updating delivery status:', err);
      toast.error('Erreur lors de la mise à jour du statut');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove delivery partner from order
  const unassignPartner = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('business_orders')
        .update({
          delivery_partner_id: null,
          delivery_status: 'pending',
          delivery_assigned_at: null,
          delivery_fee: null,
          delivery_notes: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Livreur retiré de la commande');
      return true;
    } catch (err) {
      console.error('Error unassigning partner:', err);
      toast.error('Erreur lors de la désassignation');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get delivery tracking history for an order
  const getTrackingHistory = useCallback(async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('delivery_tracking')
        .select(`
          *,
          delivery_partners (
            company_name,
            contact_name,
            phone
          )
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching tracking history:', err);
      return [];
    }
  }, []);

  return {
    loading,
    assignPartner,
    updateDeliveryStatus,
    unassignPartner,
    getTrackingHistory
  };
}
