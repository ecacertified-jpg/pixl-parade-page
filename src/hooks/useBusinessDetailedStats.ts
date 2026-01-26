import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessPerformance {
  id: string;
  name: string;
  type: string;
  revenue: number;
  orders: number;
  products: number;
  avgOrderValue: number;
  rating: number;
  isVerified: boolean;
  isActive: boolean;
}

export interface RevenueByType {
  type: string;
  revenue: number;
  orders: number;
  businessCount: number;
  percentage: number;
}

export interface ProductCategoryStat {
  category: string;
  productCount: number;
  totalRevenue: number;
  avgPrice: number;
}

export interface MonthlyTrend {
  month: string;
  label: string;
  revenue: number;
  orders: number;
  newBusinesses: number;
}

export interface BusinessDetailedStats {
  totalBusinesses: number;
  activeBusinesses: number;
  verifiedBusinesses: number;
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  avgRevenuePerBusiness: number;
  avgOrderValue: number;
  revenueByType: RevenueByType[];
  businessPerformance: BusinessPerformance[];
  productCategoryStats: ProductCategoryStat[];
  monthlyTrends: MonthlyTrend[];
  topBusinessByRevenue: BusinessPerformance[];
  topBusinessByOrders: BusinessPerformance[];
}

export function useBusinessDetailedStats(countryCode?: string | null) {
  const [stats, setStats] = useState<BusinessDetailedStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch all business accounts with optional country filter
      let businessQuery = supabase
        .from('business_accounts')
        .select('*');
      
      if (countryCode) {
        businessQuery = businessQuery.eq('country_code', countryCode);
      }
      
      const { data: businesses, error: businessError } = await businessQuery;

      if (businessError) throw businessError;

      // Fetch all products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*, categories(name, name_fr)');

      if (productsError) throw productsError;

      // Fetch all orders
      const { data: orders, error: ordersError } = await supabase
        .from('business_orders')
        .select('*');

      if (ordersError) throw ordersError;

      // Fetch product ratings
      const { data: ratings, error: ratingsError } = await supabase
        .from('product_ratings')
        .select('*');

      if (ratingsError) throw ratingsError;

      // Calculate global stats
      const totalBusinesses = businesses?.length || 0;
      const activeBusinesses = businesses?.filter(b => b.is_active).length || 0;
      const verifiedBusinesses = businesses?.filter(b => b.is_verified).length || 0;
      const totalProducts = products?.length || 0;
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const avgRevenuePerBusiness = activeBusinesses > 0 ? totalRevenue / activeBusinesses : 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate revenue by business type
      const typeMap = new Map<string, { revenue: number; orders: number; count: number }>();
      
      businesses?.forEach(business => {
        const type = business.business_type || 'Non défini';
        if (!typeMap.has(type)) {
          typeMap.set(type, { revenue: 0, orders: 0, count: 0 });
        }
        const entry = typeMap.get(type)!;
        entry.count++;
        
        // Sum orders for this business
        const businessOrders = orders?.filter(o => o.business_account_id === business.id) || [];
        entry.orders += businessOrders.length;
        entry.revenue += businessOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      });

      const revenueByType: RevenueByType[] = Array.from(typeMap.entries()).map(([type, data]) => ({
        type,
        revenue: data.revenue,
        orders: data.orders,
        businessCount: data.count,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
      })).sort((a, b) => b.revenue - a.revenue);

      // Calculate business performance
      const businessPerformance: BusinessPerformance[] = (businesses || []).map(business => {
        const businessOrders = orders?.filter(o => o.business_account_id === business.id) || [];
        const businessProducts = products?.filter(p => p.business_owner_id === business.user_id) || [];
        const businessRevenue = businessOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        
        // Calculate avg rating for business products
        const productIds = businessProducts.map(p => p.id);
        const businessRatings = ratings?.filter(r => productIds.includes(r.product_id)) || [];
        const avgRating = businessRatings.length > 0 
          ? businessRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / businessRatings.length 
          : 0;

        return {
          id: business.id,
          name: business.business_name,
          type: business.business_type || 'Non défini',
          revenue: businessRevenue,
          orders: businessOrders.length,
          products: businessProducts.length,
          avgOrderValue: businessOrders.length > 0 ? businessRevenue / businessOrders.length : 0,
          rating: avgRating,
          isVerified: business.is_verified || false,
          isActive: business.is_active || false
        };
      });

      // Top performers
      const topBusinessByRevenue = [...businessPerformance]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      const topBusinessByOrders = [...businessPerformance]
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5);

      // Product category stats
      const categoryMap = new Map<string, { count: number; revenue: number; totalPrice: number }>();
      
      products?.forEach(product => {
        const category = (product.categories as any)?.name_fr || 'Non catégorisé';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { count: 0, revenue: 0, totalPrice: 0 });
        }
        const entry = categoryMap.get(category)!;
        entry.count++;
        entry.totalPrice += product.price || 0;
        
        // Find revenue from orders containing this product
        orders?.forEach(order => {
          const orderSummary = order.order_summary as any;
          if (orderSummary?.items) {
            orderSummary.items.forEach((item: any) => {
              if (item.product_id === product.id) {
                entry.revenue += (item.price || 0) * (item.quantity || 1);
              }
            });
          }
        });
      });

      const productCategoryStats: ProductCategoryStat[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        productCount: data.count,
        totalRevenue: data.revenue,
        avgPrice: data.count > 0 ? data.totalPrice / data.count : 0
      })).sort((a, b) => b.productCount - a.productCount);

      // Monthly trends (last 12 months)
      const monthlyTrends: MonthlyTrend[] = [];
      const now = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthKey = monthDate.toISOString().slice(0, 7);
        const monthLabel = monthDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

        const monthOrders = orders?.filter(o => {
          const orderDate = new Date(o.created_at);
          return orderDate >= monthDate && orderDate <= monthEnd;
        }) || [];

        const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

        const newBusinesses = businesses?.filter(b => {
          const createDate = new Date(b.created_at);
          return createDate >= monthDate && createDate <= monthEnd;
        }).length || 0;

        monthlyTrends.push({
          month: monthKey,
          label: monthLabel,
          revenue: monthRevenue,
          orders: monthOrders.length,
          newBusinesses
        });
      }

      setStats({
        totalBusinesses,
        activeBusinesses,
        verifiedBusinesses,
        totalRevenue,
        totalOrders,
        totalProducts,
        avgRevenuePerBusiness,
        avgOrderValue,
        revenueByType,
        businessPerformance,
        productCategoryStats,
        monthlyTrends,
        topBusinessByRevenue,
        topBusinessByOrders
      });
    } catch (error) {
      console.error('Error fetching business detailed stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [countryCode]);

  return { stats, loading, refresh: fetchStats };
}
