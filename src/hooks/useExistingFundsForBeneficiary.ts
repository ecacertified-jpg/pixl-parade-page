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

export function useExistingFundsForBeneficiary() {
  const [existingFunds, setExistingFunds] = useState<ExistingFund[]>([]);
  const [loading, setLoading] = useState(false);

  const checkFundsByContactId = useCallback(async (contactId: string) => {
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
      const directQuery = supabase
        .from('collective_funds')
        .select(`
          id, title, target_amount, current_amount, currency, occasion, status, creator_id,
          profiles:creator_id(first_name, last_name, avatar_url)
        `)
        .eq('beneficiary_contact_id', contactId)
        .eq('status', 'active');

      // Query 2: if linked_user_id exists, find other contacts with same linked_user_id
      if (contact?.linked_user_id) {
        // Find all contact IDs that share this linked_user_id
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

        // Business funds where beneficiary_user_id matches
        const { data: businessFunds } = await supabase
          .from('collective_funds')
          .select(`
            id, title, target_amount, current_amount, currency, occasion, status, creator_id,
            profiles:creator_id(first_name, last_name, avatar_url),
            business_collective_funds!inner(beneficiary_user_id)
          `)
          .eq('business_collective_funds.beneficiary_user_id', contact.linked_user_id)
          .eq('status', 'active');

        const allFunds = [
          ...(directResult.data || []),
          ...linkedData,
          ...(businessFunds || []),
        ];

        // Deduplicate by fund id
        const uniqueFunds = Array.from(new Map(allFunds.map(f => [f.id, f])).values());
        setExistingFunds(formatFunds(uniqueFunds));
      } else {
        const { data } = await directQuery;
        setExistingFunds(formatFunds(data || []));
      }
    } catch (error) {
      console.error('Error checking existing funds:', error);
      setExistingFunds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkFundsByUserId = useCallback(async (userId: string) => {
    setLoading(true);
    setExistingFunds([]);
    try {
      // Find funds where any contact with this linked_user_id is beneficiary
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

      // Business funds for this user
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
      setExistingFunds(formatFunds(uniqueFunds));
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
