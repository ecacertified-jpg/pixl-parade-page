import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BusinessStats {
  totalSales: number;
  monthlyOrders: number;
  activeProducts: number;
  commission: number;
  netRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  salesByCategory: Array<{
    category: string;
    count: number;
    revenue: number;
  }>;
  dailySales: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
}

export const useBusinessAnalytics = (businessAccountId?: string) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<BusinessStats>({
    totalSales: 0,
    monthlyOrders: 0,
    activeProducts: 0,
    commission: 0,
    netRevenue: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    topProducts: [],
    salesByCategory: [],
    dailySales: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadAnalytics();
    }
  }, [user?.id, businessAccountId]);

  const loadAnalytics = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get business account ID if not provided
      let businessId = businessAccountId;
      if (!businessId) {
        const { data: accountData } = await supabase
          .from('business_accounts')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        businessId = accountData?.id;
      }

      if (!businessId) {
        setLoading(false);
        return;
      }

      // Fetch total sales and order count
      const { data: ordersData, error: ordersError } = await supabase
        .from('business_orders')
        .select('total_amount, created_at, status, order_summary')
        .eq('business_account_id', businessId);

      if (ordersError) throw ordersError;

      // Calculate total sales
      const totalSales = ordersData?.reduce((sum, order) => 
        sum + Number(order.total_amount || 0), 0
      ) || 0;

      // Calculate monthly orders (current month)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyOrders = ordersData?.filter(order => 
        new Date(order.created_at) >= startOfMonth
      ).length || 0;

      // Calculate confirmed orders for conversion rate
      const confirmedOrders = ordersData?.filter(order => 
        order.status === 'completed' || order.status === 'confirmed'
      ).length || 0;

      // Fetch active products count
      const { count: activeProductsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('business_owner_id', user.id)
        .eq('is_active', true);

      const activeProducts = activeProductsCount || 0;

      // Calculate commission and net revenue
      const commission = totalSales * 0.15;
      const netRevenue = totalSales - commission;

      // Calculate average order value
      const averageOrderValue = ordersData && ordersData.length > 0 
        ? totalSales / ordersData.length 
        : 0;

      // Calculate conversion rate (confirmed / total orders)
      const conversionRate = ordersData && ordersData.length > 0
        ? (confirmedOrders / ordersData.length) * 100
        : 0;

      // Calculate top products from order_summary
      const productSales: Record<string, { name: string; sales: number; revenue: number }> = {};
      
      ordersData?.forEach(order => {
        const summary = order.order_summary as any;
        if (summary?.items) {
          summary.items.forEach((item: any) => {
            const productId = item.product_id || item.id;
            const productName = item.name || 'Produit inconnu';
            const quantity = item.quantity || 1;
            const price = Number(item.price || 0);
            
            if (!productSales[productId]) {
              productSales[productId] = {
                name: productName,
                sales: 0,
                revenue: 0
              };
            }
            
            productSales[productId].sales += quantity;
            productSales[productId].revenue += price * quantity;
          });
        }
      });

      const topProducts = Object.entries(productSales)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Calculate sales by category
      const categorySales: Record<string, { count: number; revenue: number }> = {};
      
      const { data: productsData } = await supabase
        .from('products')
        .select('id, category_name, price')
        .eq('business_owner_id', user.id);

      ordersData?.forEach(order => {
        const summary = order.order_summary as any;
        if (summary?.items) {
          summary.items.forEach((item: any) => {
            const product = productsData?.find(p => p.id === item.product_id);
            const category = product?.category_name || 'Non catégorisé';
            const quantity = item.quantity || 1;
            const price = Number(item.price || 0);
            
            if (!categorySales[category]) {
              categorySales[category] = { count: 0, revenue: 0 };
            }
            
            categorySales[category].count += quantity;
            categorySales[category].revenue += price * quantity;
          });
        }
      });

      const salesByCategory = Object.entries(categorySales)
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.revenue - a.revenue);

      // Calculate daily sales for the last 30 days
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const dailySalesMap: Record<string, { sales: number; orders: number }> = {};
      
      ordersData?.forEach(order => {
        const orderDate = new Date(order.created_at);
        if (orderDate >= last30Days) {
          const dateKey = orderDate.toISOString().split('T')[0];
          
          if (!dailySalesMap[dateKey]) {
            dailySalesMap[dateKey] = { sales: 0, orders: 0 };
          }
          
          dailySalesMap[dateKey].sales += Number(order.total_amount || 0);
          dailySalesMap[dateKey].orders += 1;
        }
      });

      const dailySales = Object.entries(dailySalesMap)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setStats({
        totalSales,
        monthlyOrders,
        activeProducts,
        commission,
        netRevenue,
        averageOrderValue,
        conversionRate,
        topProducts,
        salesByCategory,
        dailySales
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetch: loadAnalytics };
};
