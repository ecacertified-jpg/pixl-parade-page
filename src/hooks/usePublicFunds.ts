import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCountry } from '@/contexts/CountryContext';

export interface PublicFund {
  id: string;
  title: string;
  beneficiaryName: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  productImage?: string;
  productName: string;
  contributorsCount: number;
  status: 'active' | 'completed' | 'expired';
  occasion: string | null;
  createdAt: string;
  deadline?: string;
  creatorId: string;
  beneficiaryBirthday?: string | null;
}

interface UsePublicFundsOptions {
  occasionFilter?: string;
  statusFilter?: 'active' | 'completed' | 'all';
  limit?: number;
  offset?: number;
}

export function usePublicFunds(options: UsePublicFundsOptions = {}) {
  const { occasionFilter, statusFilter = 'active', limit = 20, offset = 0 } = options;
  const [funds, setFunds] = useState<PublicFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { effectiveCountryFilter } = useCountry();

  const loadPublicFunds = useCallback(async () => {
    try {
      setLoading(true);

      // Build query for public funds
      let query = supabase
        .from('collective_funds')
        .select(`
          id,
          title,
          target_amount,
          current_amount,
          currency,
          status,
          occasion,
          created_at,
          deadline_date,
          creator_id,
          beneficiary_contact_id,
          business_product_id,
          contacts!beneficiary_contact_id (
            name,
            birthday
          ),
          products!business_product_id (
            name,
            image_url
          )
        `, { count: 'exact' })
        .eq('is_public', true);

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Apply occasion filter
      if (occasionFilter) {
        query = query.eq('occasion', occasionFilter);
      }

      // Apply country filter if available
      if (effectiveCountryFilter) {
        query = query.eq('country_code', effectiveCountryFilter);
      }

      // Order and paginate
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error loading public funds:', error);
        return;
      }

      // Get contributor counts for each fund
      const fundIds = (data || []).map(f => f.id);
      
      let contributorCounts: Record<string, number> = {};
      if (fundIds.length > 0) {
        const { data: contributions } = await supabase
          .from('fund_contributions')
          .select('fund_id')
          .in('fund_id', fundIds);

        if (contributions) {
          contributorCounts = contributions.reduce((acc, c) => {
            acc[c.fund_id] = (acc[c.fund_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
        }
      }

      // Transform data
      const transformedFunds: PublicFund[] = (data || []).map((fund: any) => ({
        id: fund.id,
        title: fund.title,
        beneficiaryName: fund.contacts?.name || 'Bénéficiaire',
        targetAmount: fund.target_amount,
        currentAmount: fund.current_amount || 0,
        currency: fund.currency || 'XOF',
        productImage: fund.products?.image_url,
        productName: fund.products?.name || fund.title,
        contributorsCount: contributorCounts[fund.id] || 0,
        status: fund.status as 'active' | 'completed' | 'expired',
        occasion: fund.occasion,
        createdAt: fund.created_at,
        deadline: fund.deadline_date,
        creatorId: fund.creator_id,
        beneficiaryBirthday: fund.contacts?.birthday,
      }));

      setFunds(transformedFunds);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error in usePublicFunds:', err);
    } finally {
      setLoading(false);
    }
  }, [occasionFilter, statusFilter, limit, offset, effectiveCountryFilter]);

  useEffect(() => {
    loadPublicFunds();
  }, [loadPublicFunds]);

  return { 
    funds, 
    loading, 
    totalCount, 
    refreshFunds: loadPublicFunds 
  };
}
