import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logAdminAction } from '@/utils/auditLogger';

export interface AdminOrder {
  id: string;
  business_account_id: string;
  business_name: string;
  business_logo?: string;
  customer_id: string | null;
  customer_name?: string;
  customer_email?: string;
  order_summary: any;
  total_amount: number;
  currency: string;
  status: string;
  payment_method: string;
  delivery_address: string;
  donor_phone: string;
  beneficiary_phone: string;
  fund_id: string | null;
  customer_rating: number | null;
  customer_review_text: string | null;
  refund_reason: string | null;
  refund_requested_at: string | null;
  processed_at: string | null;
  customer_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderFilters {
  businessId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

export interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  delivered: number;
  cancelled: number;
  refunded: number;
  totalRevenue: number;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  processed: 'Traitée',
  delivered: 'Livrée',
  receipt_confirmed: 'Réception confirmée',
  refund_requested: 'Remboursement demandé',
  refunded: 'Remboursée',
  refund_rejected: 'Remboursement refusé',
  cancelled: 'Annulée'
};

export const getOrderStatusLabel = (status: string): string => {
  return ORDER_STATUS_LABELS[status] || status;
};

export const getOrderStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'processed':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    case 'delivered':
    case 'receipt_confirmed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'refund_requested':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    case 'refunded':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    case 'refund_rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

export const useAdminOrders = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>({});
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
    totalRevenue: 0
  });

  const loadOrders = useCallback(async (appliedFilters?: OrderFilters) => {
    try {
      setLoading(true);
      const currentFilters = appliedFilters || filters;

      let query = supabase
        .from('business_orders')
        .select(`
          *,
          business_accounts!inner(
            id,
            business_name,
            logo_url
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (currentFilters.businessId) {
        query = query.eq('business_account_id', currentFilters.businessId);
      }
      if (currentFilters.status) {
        query = query.eq('status', currentFilters.status);
      }
      if (currentFilters.dateFrom) {
        query = query.gte('created_at', currentFilters.dateFrom);
      }
      if (currentFilters.dateTo) {
        query = query.lte('created_at', currentFilters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data
      const transformedOrders: AdminOrder[] = (data || []).map((order: any) => ({
        ...order,
        business_name: order.business_accounts?.business_name || 'Inconnu',
        business_logo: order.business_accounts?.logo_url
      }));

      // Apply search filter client-side
      let filteredOrders = transformedOrders;
      if (currentFilters.searchQuery) {
        const search = currentFilters.searchQuery.toLowerCase();
        filteredOrders = transformedOrders.filter(order => 
          order.id.toLowerCase().includes(search) ||
          order.business_name.toLowerCase().includes(search) ||
          order.donor_phone.includes(search) ||
          order.beneficiary_phone.includes(search) ||
          order.delivery_address.toLowerCase().includes(search)
        );
      }

      setOrders(filteredOrders);

      // Calculate stats
      const statsData: OrderStats = {
        total: filteredOrders.length,
        pending: filteredOrders.filter(o => o.status === 'pending').length,
        confirmed: filteredOrders.filter(o => o.status === 'confirmed' || o.status === 'processed').length,
        delivered: filteredOrders.filter(o => o.status === 'delivered' || o.status === 'receipt_confirmed').length,
        cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
        refunded: filteredOrders.filter(o => o.status === 'refunded').length,
        totalRevenue: filteredOrders
          .filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
          .reduce((sum, o) => sum + o.total_amount, 0)
      };
      setStats(statsData);

    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateOrderStatus = async (orderId: string, newStatus: string, reason?: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) throw new Error('Commande non trouvée');

      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'processed') {
        updateData.processed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('business_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      await logAdminAction(
        'update_order_status',
        'business_order',
        orderId,
        `Statut de la commande modifié: ${order.status} → ${newStatus}${reason ? ` (Raison: ${reason})` : ''}`,
        { 
          old_status: order.status, 
          new_status: newStatus, 
          reason,
          business_id: order.business_account_id,
          amount: order.total_amount
        }
      );

      toast.success('Statut de la commande mis à jour');
      await loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const cancelOrder = async (orderId: string, reason: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) throw new Error('Commande non trouvée');

      const { error } = await supabase
        .from('business_orders')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Create notification for customer if exists
      if (order.customer_id) {
        await supabase.from('notifications').insert({
          user_id: order.customer_id,
          title: 'Commande annulée',
          message: `Votre commande #${orderId.slice(0, 8)} a été annulée. Raison: ${reason}`,
          type: 'order_cancelled',
          action_url: '/orders',
          metadata: { order_id: orderId, reason }
        });
      }

      await logAdminAction(
        'cancel_order',
        'business_order',
        orderId,
        `Commande annulée par un administrateur. Raison: ${reason}`,
        { 
          reason, 
          business_id: order.business_account_id,
          amount: order.total_amount,
          previous_status: order.status
        }
      );

      toast.success('Commande annulée');
      await loadOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error("Erreur lors de l'annulation de la commande");
    }
  };

  const refundOrder = async (orderId: string, refundReason: string, refundAmount?: number) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) throw new Error('Commande non trouvée');

      const { error } = await supabase
        .from('business_orders')
        .update({
          status: 'refunded',
          refund_reason: refundReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Create notification for customer if exists
      if (order.customer_id) {
        await supabase.from('notifications').insert({
          user_id: order.customer_id,
          title: 'Commande remboursée',
          message: `Votre commande #${orderId.slice(0, 8)} a été remboursée. Montant: ${refundAmount || order.total_amount} XOF`,
          type: 'order_refunded',
          action_url: '/orders',
          metadata: { order_id: orderId, refund_amount: refundAmount || order.total_amount, reason: refundReason }
        });
      }

      await logAdminAction(
        'refund_order',
        'business_order',
        orderId,
        `Commande remboursée par un administrateur. Montant: ${refundAmount || order.total_amount} XOF. Raison: ${refundReason}`,
        { 
          refund_reason: refundReason,
          refund_amount: refundAmount || order.total_amount,
          business_id: order.business_account_id,
          original_amount: order.total_amount
        }
      );

      toast.success('Commande remboursée');
      await loadOrders();
    } catch (error) {
      console.error('Error refunding order:', error);
      toast.error('Erreur lors du remboursement');
    }
  };

  const approveRefund = async (orderId: string) => {
    await refundOrder(orderId, 'Demande de remboursement approuvée par un administrateur');
  };

  const rejectRefund = async (orderId: string, reason: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) throw new Error('Commande non trouvée');

      const { error } = await supabase
        .from('business_orders')
        .update({
          status: 'refund_rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      if (order.customer_id) {
        await supabase.from('notifications').insert({
          user_id: order.customer_id,
          title: 'Demande de remboursement refusée',
          message: `Votre demande de remboursement pour la commande #${orderId.slice(0, 8)} a été refusée. Raison: ${reason}`,
          type: 'refund_rejected',
          action_url: '/orders',
          metadata: { order_id: orderId, reason }
        });
      }

      await logAdminAction(
        'reject_refund',
        'business_order',
        orderId,
        `Demande de remboursement refusée. Raison: ${reason}`,
        { reason, business_id: order.business_account_id }
      );

      toast.success('Demande de remboursement refusée');
      await loadOrders();
    } catch (error) {
      console.error('Error rejecting refund:', error);
      toast.error('Erreur lors du refus de remboursement');
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return {
    orders,
    loading,
    filters,
    setFilters,
    stats,
    loadOrders,
    updateOrderStatus,
    cancelOrder,
    refundOrder,
    approveRefund,
    rejectRefund,
    getOrderStatusLabel,
    getOrderStatusColor
  };
};
