import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ExistingFund {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  creatorFirstName: string;
  creatorLastName: string;
  creatorAvatar?: string;
  occasion: string;
  status: string;
}

async function filterByCircleOverlap(funds: any[], currentUserId: string): Promise<any[]> {
  if (funds.length === 0) return funds;

  // 1. Get current user's friend circle (user IDs) from contact_relationships
  const { data: relationships } = await supabase
    .from('contact_relationships')
    .select('user_a, user_b')
    .or(`user_a.eq.${currentUserId},user_b.eq.${currentUserId}`);

  const friendIds = new Set<string>(
    (relationships || []).map(r => r.user_a === currentUserId ? r.user_b : r.user_a)
  );
  friendIds.add(currentUserId); // include self

  // 2. Get contributors for each fund
  const fundIds = funds.map(f => f.id);
  const { data: contributions } = await supabase
    .from('fund_contributions')
    .select('fund_id, contributor_id')
    .in('fund_id', fundIds);

  // 3. For each fund, check if creator or any contributor is in user's circle
  return funds.filter(fund => {
    const fundPeople = new Set<string>();
    if (fund.creator_id) fundPeople.add(fund.creator_id);
    (contributions || [])
      .filter(c => c.fund_id === fund.id)
      .forEach(c => { if (c.contributor_id) fundPeople.add(c.contributor_id); });

    for (const person of fundPeople) {
      if (friendIds.has(person)) return true;
    }
    return false;
  });
}

export function useExistingFundsForBeneficiary() {
  const [existingFunds, setExistingFunds] = useState<ExistingFund[]>([]);
  const [loading, setLoading] = useState(false);

  const checkFundsByContactId = useCallback(async (contactId: string, currentUserId?: string, occasion?: string) => {
    setLoading(true);
    setExistingFunds([]);
    try {
      // Get the contact's linked_user_id if any
      const { data: contact } = await supabase
        .from('contacts')
        .select('linked_user_id')
        .eq('id', contactId)
        .single();

      // Query 1: funds where beneficiary_contact_id matches directly
      let directQuery = supabase
        .from('collective_funds')
        .select(`
          id, title, target_amount, current_amount, currency, occasion, status, creator_id,
          profiles:creator_id(first_name, last_name, avatar_url)
        `)
        .eq('beneficiary_contact_id', contactId)
        .eq('status', 'active');
      if (occasion) directQuery = directQuery.eq('occasion', occasion);

      let allFunds: any[] = [];

      if (contact?.linked_user_id) {
        const { data: linkedContacts } = await supabase
          .from('contacts')
          .select('id')
          .eq('linked_user_id', contact.linked_user_id)
          .neq('id', contactId);

        const linkedContactIds = linkedContacts?.map(c => c.id) || [];

        const directResult = await directQuery;

        let linkedData: any[] = [];
        if (linkedContactIds.length > 0) {
          const { data } = await supabase
            .from('collective_funds')
            .select(`
              id, title, target_amount, current_amount, currency, occasion, status, creator_id,
              profiles:creator_id(first_name, last_name, avatar_url)
            `)
            .in('beneficiary_contact_id', linkedContactIds)
            .eq('status', 'active');
          linkedData = data || [];
        }

        const { data: businessFunds } = await supabase
          .from('collective_funds')
          .select(`
            id, title, target_amount, current_amount, currency, occasion, status, creator_id,
            profiles:creator_id(first_name, last_name, avatar_url),
            business_collective_funds!inner(beneficiary_user_id)
          `)
          .eq('business_collective_funds.beneficiary_user_id', contact.linked_user_id)
          .eq('status', 'active');

        allFunds = [
          ...(directResult.data || []),
          ...linkedData,
          ...(businessFunds || []),
        ];
      } else {
        const { data } = await directQuery;
        allFunds = data || [];
      }

      // Deduplicate by fund id
      const uniqueFunds = Array.from(new Map(allFunds.map(f => [f.id, f])).values());

      // Filter by circle overlap if currentUserId is provided
      const filteredFunds = currentUserId
        ? await filterByCircleOverlap(uniqueFunds, currentUserId)
        : uniqueFunds;

      setExistingFunds(formatFunds(filteredFunds));
    } catch (error) {
      console.error('Error checking existing funds:', error);
      setExistingFunds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkFundsByUserId = useCallback(async (userId: string, currentUserId?: string) => {
    setLoading(true);
    setExistingFunds([]);
    try {
      const { data: contactsForUser } = await supabase
        .from('contacts')
        .select('id')
        .eq('linked_user_id', userId);

      const contactIds = contactsForUser?.map(c => c.id) || [];

      let contactFunds: any[] = [];
      if (contactIds.length > 0) {
        const { data } = await supabase
          .from('collective_funds')
          .select(`
            id, title, target_amount, current_amount, currency, occasion, status, creator_id,
            profiles:creator_id(first_name, last_name, avatar_url)
          `)
          .in('beneficiary_contact_id', contactIds)
          .eq('status', 'active');
        contactFunds = data || [];
      }

      const { data: businessFunds } = await supabase
        .from('collective_funds')
        .select(`
          id, title, target_amount, current_amount, currency, occasion, status, creator_id,
          profiles:creator_id(first_name, last_name, avatar_url),
          business_collective_funds!inner(beneficiary_user_id)
        `)
        .eq('business_collective_funds.beneficiary_user_id', userId)
        .eq('status', 'active');

      const allFunds = [...contactFunds, ...(businessFunds || [])];
      const uniqueFunds = Array.from(new Map(allFunds.map(f => [f.id, f])).values());

      // Filter by circle overlap if currentUserId is provided
      const filteredFunds = currentUserId
        ? await filterByCircleOverlap(uniqueFunds, currentUserId)
        : uniqueFunds;

      setExistingFunds(formatFunds(filteredFunds));
    } catch (error) {
      console.error('Error checking existing funds by user:', error);
      setExistingFunds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setExistingFunds([]);
  }, []);

  return { existingFunds, loading, checkFundsByContactId, checkFundsByUserId, reset };
}

function formatFunds(funds: any[]): ExistingFund[] {
  return funds.map(f => {
    const profile = f.profiles as any;
    return {
      id: f.id,
      title: f.title,
      targetAmount: f.target_amount,
      currentAmount: f.current_amount || 0,
      currency: f.currency || 'XOF',
      creatorFirstName: profile?.first_name || '',
      creatorLastName: profile?.last_name || '',
      creatorAvatar: profile?.avatar_url,
      occasion: f.occasion || '',
      status: f.status,
    };
  });
}
