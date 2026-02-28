import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCountry } from '@/contexts/CountryContext';

interface Contributor {
  id: string;
  name: string;
  amount: number;
  avatar?: string;
}

export interface CollectiveFund {
  id: string;
  title: string;
  beneficiaryName: string;
  beneficiaryBirthday?: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  productImage?: string;
  productName: string;
  contributors: Contributor[];
  status: 'active' | 'completed' | 'expired' | 'target_reached';
  occasion: string;
  orderData?: any;
  creatorId?: string;
  isPublic?: boolean;
  priority?: number;
  isBusinessInitiated?: boolean;
  businessName?: string;
  countryCode?: string;
}

async function fetchCollectiveFunds(
  userId: string,
  effectiveCountryFilter: string | null
): Promise<CollectiveFund[]> {
  // Single optimized query with contacts JOIN (eliminates waterfall)
  const selectQuery = `
    id,
    title,
    target_amount,
    current_amount,
    currency,
    occasion,
    status,
    creator_id,
    is_public,
    beneficiary_contact_id,
    created_by_business_id,
    country_code,
    contacts!beneficiary_contact_id(name, birthday, user_id),
    fund_contributions(
      id,
      amount,
      contributor_id,
      profiles:contributor_id(first_name, last_name)
    ),
    collective_fund_orders(
      id,
      order_summary,
      donor_phone,
      beneficiary_phone,
      delivery_address,
      payment_method
    ),
    business_collective_funds(
      business_id,
      product_id,
      business_accounts:business_id(business_name)
    )
  `;

  let fundsQuery = supabase
    .from('collective_funds')
    .select(selectQuery);

  if (effectiveCountryFilter) {
    fundsQuery = fundsQuery.eq('country_code', effectiveCountryFilter);
  }

  // All initial queries in parallel (single wave)
  const [friendsResult, allFundsResult] = await Promise.all([
    supabase
      .from('contact_relationships')
      .select('user_a, user_b')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`),
    fundsQuery.order('created_at', { ascending: false })
  ]);

  const friendsData = friendsResult.data;
  const allFundsData = allFundsResult.data;

  if (allFundsResult.error) {
    throw allFundsResult.error;
  }

  const friendIds = friendsData?.map(rel =>
    rel.user_a === userId ? rel.user_b : rel.user_a
  ) || [];

  // Only need product IDs for second parallel wave (contacts already JOINed)
  const productIds: string[] = [];
  allFundsData?.forEach(f => {
    const bcfArray = f.business_collective_funds;
    if (Array.isArray(bcfArray) && bcfArray.length > 0) {
      const bcf = bcfArray[0];
      if (bcf?.product_id) {
        productIds.push(bcf.product_id as string);
      }
    }
  });

  // Parallel: friend contacts (for priority) + products
  const [friendContactsResult, productsResult] = await Promise.all([
    friendIds.length > 0
      ? supabase.from('contacts').select('id, user_id').in('user_id', friendIds)
      : Promise.resolve({ data: [] }),
    productIds.length > 0
      ? supabase.from('products').select('id, name, image_url, price').in('id', productIds)
      : Promise.resolve({ data: [] }),
  ]);

  const friendContactIds = friendContactsResult.data?.map(c => c.id) || [];
  const productsMap = new Map<string, { id: string; name: string; image_url: string | null; price: number }>();
  productsResult.data?.forEach(p => productsMap.set(p.id, p));

  // Compute priority and transform
  const transformedFunds: CollectiveFund[] = (allFundsData || []).map(fund => {
    let priority = 4;
    if (friendIds.includes(fund.creator_id)) priority = 1;
    if (fund.beneficiary_contact_id && friendContactIds.includes(fund.beneficiary_contact_id)) {
      priority = Math.min(priority, 1.5);
    }
    if (fund.creator_id === userId) priority = 2;
    const hasContributed = fund.fund_contributions?.some(c => c.contributor_id === userId);
    if (hasContributed && fund.creator_id !== userId) priority = Math.min(priority, 3);

    const contributors: Contributor[] = (fund.fund_contributions || []).map(contrib => ({
      id: contrib.contributor_id,
      name: contrib.profiles
        ? `${contrib.profiles.first_name || ''} ${contrib.profiles.last_name || ''}`.trim()
        : 'Utilisateur',
      amount: contrib.amount,
    }));

    // Beneficiary from JOIN (no separate query needed)
    const contact = fund.contacts as any;
    let beneficiaryName = 'Bénéficiaire';
    let beneficiaryBirthday: string | undefined;
    if (contact?.name) {
      beneficiaryName = contact.name;
      beneficiaryBirthday = contact.birthday;
    } else if (fund.title.includes('pour ')) {
      beneficiaryName = fund.title.split('pour ')[1];
    }

    // Product info
    const orderData = fund.collective_fund_orders?.[0];
    const orderSummary = orderData?.order_summary as any;
    const firstItem = orderSummary?.items?.[0];
    const businessFundData = fund.business_collective_funds?.[0];
    const productId = businessFundData?.product_id;
    const productFromMap = productId ? productsMap.get(productId) : null;

    let productName = 'Cadeau';
    let productImage: string | undefined;
    if (productFromMap) {
      productName = productFromMap.name || 'Cadeau';
      productImage = productFromMap.image_url || undefined;
    } else if (firstItem) {
      productName = firstItem.name || 'Cadeau';
      productImage = firstItem.image;
    } else {
      const titleParts = fund.title.split(' pour ');
      if (titleParts.length > 1) productName = titleParts[0];
    }

    const isBusinessInitiated = !!fund.created_by_business_id || !!businessFundData;
    const businessName = businessFundData?.business_accounts?.business_name;

    return {
      id: fund.id,
      title: fund.title,
      beneficiaryName,
      beneficiaryBirthday,
      targetAmount: fund.target_amount,
      currentAmount: fund.current_amount || 0,
      currency: fund.currency || 'XOF',
      productName,
      productImage,
      contributors,
      status: fund.status === 'target_reached' ? 'completed' :
              fund.status === 'expired' ? 'expired' :
              fund.current_amount >= fund.target_amount ? 'completed' : 'active',
      occasion: fund.occasion || 'anniversaire',
      orderData: orderData || null,
      creatorId: fund.creator_id,
      isPublic: fund.is_public || false,
      priority,
      isBusinessInitiated,
      businessName,
      countryCode: fund.country_code,
    } as CollectiveFund;
  });

  // Filter relevant funds
  const relevantFunds = transformedFunds.filter(fund => {
    if (fund.creatorId === userId) return true;
    if (fund.contributors.some(c => c.id === userId)) return true;
    if (fund.priority === 1 || fund.priority === 1.5) return true;
    if (fund.isBusinessInitiated) return true;
    return false;
  });

  relevantFunds.sort((a, b) => (a.priority || 4) - (b.priority || 4));
  return relevantFunds;
}

export function useCollectiveFunds() {
  const { user } = useAuth();
  const { effectiveCountryFilter } = useCountry();
  const queryClient = useQueryClient();

  const { data: funds = [], isLoading: loading } = useQuery({
    queryKey: ['collective-funds', user?.id, effectiveCountryFilter],
    queryFn: () => fetchCollectiveFunds(user!.id, effectiveCountryFilter),
    enabled: !!user,
    staleTime: 30_000,
  });

  return {
    funds,
    loading,
    refreshFunds: () => queryClient.invalidateQueries({ queryKey: ['collective-funds'] }),
  };
}
