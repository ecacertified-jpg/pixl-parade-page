import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCountry } from '@/contexts/CountryContext';
import type { PublicFund } from './usePublicFunds';

const PAGE_SIZE = 12;

interface FetchPublicFundsParams {
  occasionFilter?: string;
  statusFilter?: 'active' | 'completed' | 'all';
  countryFilter?: string;
  pageParam?: number;
}

interface PublicFundsPage {
  funds: PublicFund[];
  nextOffset: number | undefined;
  totalCount: number;
}

async function fetchPublicFundsPage({
  occasionFilter,
  statusFilter = 'active',
  countryFilter,
  pageParam = 0,
}: FetchPublicFundsParams): Promise<PublicFundsPage> {
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
  if (countryFilter) {
    query = query.eq('country_code', countryFilter);
  }

  // Order and paginate
  query = query
    .order('created_at', { ascending: false })
    .range(pageParam, pageParam + PAGE_SIZE - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error loading public funds:', error);
    throw error;
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

  // Calculate next offset
  const totalCount = count || 0;
  const hasMore = (pageParam + PAGE_SIZE) < totalCount;

  return {
    funds: transformedFunds,
    nextOffset: hasMore ? pageParam + PAGE_SIZE : undefined,
    totalCount,
  };
}

interface UsePublicFundsInfiniteOptions {
  occasionFilter?: string;
  statusFilter?: 'active' | 'completed' | 'all';
}

export function usePublicFundsInfinite(options: UsePublicFundsInfiniteOptions = {}) {
  const { effectiveCountryFilter } = useCountry();
  
  return useInfiniteQuery({
    queryKey: ['public-funds-infinite', options.occasionFilter, options.statusFilter, effectiveCountryFilter],
    queryFn: ({ pageParam }) => fetchPublicFundsPage({
      occasionFilter: options.occasionFilter,
      statusFilter: options.statusFilter,
      countryFilter: effectiveCountryFilter,
      pageParam,
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });
}
