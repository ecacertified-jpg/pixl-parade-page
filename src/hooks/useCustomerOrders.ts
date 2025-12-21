import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image_url?: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  date: Date;
  status: 'pending' | 'processing' | 'delivered' | 'receipt_confirmed' | 'refund_requested' | 'refunded' | 'cancelled';
  totalAmount: number;
  currency: string;
  items: OrderItem[];
  deliveryAddress: string;
  donorPhone: string;
  beneficiaryPhone: string;
  paymentMethod: string;
  businessName?: string;
  customerConfirmedAt?: string;
  customerRating?: number;
}

export const useCustomerOrders = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['customer-orders', user?.id],
    queryFn: async (): Promise<CustomerOrder[]> => {
      if (!user?.id) return [];

      // Fetch business orders where user is the customer
      const { data: businessOrders, error: businessError } = await supabase
        .from('business_orders')
        .select(`
          *,
          business_accounts (
            business_name
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (businessError) {
        console.error('Error fetching business orders:', businessError);
        throw businessError;
      }

      // Transform business orders to unified format
      const orders: CustomerOrder[] = (businessOrders || []).map((order) => {
        const orderSummary = order.order_summary as { items?: OrderItem[] } | null;
        const items = orderSummary?.items || [];
        
        return {
          id: order.id,
          orderNumber: order.id,
          date: new Date(order.created_at),
          status: order.status as CustomerOrder['status'],
          totalAmount: Number(order.total_amount),
          currency: order.currency,
          items,
          deliveryAddress: order.delivery_address,
          donorPhone: order.donor_phone,
          beneficiaryPhone: order.beneficiary_phone,
          paymentMethod: order.payment_method,
          businessName: order.business_accounts?.business_name,
          customerConfirmedAt: order.customer_confirmed_at || undefined,
          customerRating: order.customer_rating || undefined,
        };
      });

      return orders;
    },
    enabled: !!user?.id,
  });
};
