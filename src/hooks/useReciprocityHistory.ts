import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ContributionHistory {
  id: string;
  fund_id: string;
  amount: number;
  created_at: string;
  fund_title: string;
  fund_occasion: string;
  beneficiary_name: string;
  beneficiary_id: string;
  is_anonymous: boolean;
}

export interface ReceivedContribution {
  id: string;
  fund_id: string;
  amount: number;
  created_at: string;
  fund_title: string;
  fund_occasion: string;
  contributor_name: string;
  contributor_id: string;
  is_anonymous: boolean;
}

export interface ReciprocityRelation {
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  given_count: number;
  given_amount: number;
  received_count: number;
  received_amount: number;
  balance: number;
  relationship_type: 'balanced' | 'mostly_giving' | 'mostly_receiving';
}

export function useReciprocityHistory() {
  const { user } = useAuth();
  const [contributionsGiven, setContributionsGiven] = useState<ContributionHistory[]>([]);
  const [contributionsReceived, setContributionsReceived] = useState<ReceivedContribution[]>([]);
  const [relations, setRelations] = useState<ReciprocityRelation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch contributions given
      const { data: givenData, error: givenError } = await supabase
        .from('fund_contributions')
        .select(`
          id,
          fund_id,
          amount,
          created_at,
          is_anonymous,
          collective_funds!inner(
            title,
            occasion,
            creator_id,
            profiles!collective_funds_creator_id_fkey(first_name, last_name)
          )
        `)
        .eq('contributor_id', user.id)
        .order('created_at', { ascending: false });

      if (givenError) throw givenError;

      const given = givenData?.map((item: any) => ({
        id: item.id,
        fund_id: item.fund_id,
        amount: item.amount,
        created_at: item.created_at,
        fund_title: item.collective_funds.title,
        fund_occasion: item.collective_funds.occasion,
        beneficiary_name: `${item.collective_funds.profiles.first_name || ''} ${item.collective_funds.profiles.last_name || ''}`.trim(),
        beneficiary_id: item.collective_funds.creator_id,
        is_anonymous: item.is_anonymous,
      })) || [];

      setContributionsGiven(given);

      // Fetch contributions received
      const { data: receivedData, error: receivedError } = await supabase
        .from('fund_contributions')
        .select(`
          id,
          fund_id,
          amount,
          created_at,
          contributor_id,
          is_anonymous,
          collective_funds!inner(
            title,
            occasion,
            creator_id
          ),
          profiles!fund_contributions_contributor_id_fkey(first_name, last_name)
        `)
        .eq('collective_funds.creator_id', user.id)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      const received = receivedData?.map((item: any) => ({
        id: item.id,
        fund_id: item.fund_id,
        amount: item.amount,
        created_at: item.created_at,
        fund_title: item.collective_funds.title,
        fund_occasion: item.collective_funds.occasion,
        contributor_name: item.is_anonymous ? 'Anonyme' : `${item.profiles?.first_name || ''} ${item.profiles?.last_name || ''}`.trim(),
        contributor_id: item.contributor_id,
        is_anonymous: item.is_anonymous,
      })) || [];

      setContributionsReceived(received);

      // Calculate relations
      const relationsMap = new Map<string, ReciprocityRelation>();

      // Process given contributions
      given.forEach((contrib) => {
        if (contrib.beneficiary_id && contrib.beneficiary_id !== user.id) {
          const key = contrib.beneficiary_id;
          if (!relationsMap.has(key)) {
            relationsMap.set(key, {
              user_id: key,
              user_name: contrib.beneficiary_name,
              avatar_url: null,
              given_count: 0,
              given_amount: 0,
              received_count: 0,
              received_amount: 0,
              balance: 0,
              relationship_type: 'balanced',
            });
          }
          const relation = relationsMap.get(key)!;
          relation.given_count++;
          relation.given_amount += Number(contrib.amount);
        }
      });

      // Process received contributions
      received.forEach((contrib) => {
        if (!contrib.is_anonymous && contrib.contributor_id && contrib.contributor_id !== user.id) {
          const key = contrib.contributor_id;
          if (!relationsMap.has(key)) {
            relationsMap.set(key, {
              user_id: key,
              user_name: contrib.contributor_name,
              avatar_url: null,
              given_count: 0,
              given_amount: 0,
              received_count: 0,
              received_amount: 0,
              balance: 0,
              relationship_type: 'balanced',
            });
          }
          const relation = relationsMap.get(key)!;
          relation.received_count++;
          relation.received_amount += Number(contrib.amount);
        }
      });

      // Calculate balance and relationship type
      const relationsList = Array.from(relationsMap.values()).map((relation) => {
        relation.balance = relation.given_amount - relation.received_amount;
        
        const ratio = relation.received_amount > 0 
          ? relation.given_amount / relation.received_amount 
          : relation.given_amount > 0 ? Infinity : 1;

        if (ratio > 1.5) {
          relation.relationship_type = 'mostly_giving';
        } else if (ratio < 0.67) {
          relation.relationship_type = 'mostly_receiving';
        } else {
          relation.relationship_type = 'balanced';
        }

        return relation;
      });

      // Fetch avatar URLs for relations
      const userIds = relationsList.map(r => r.user_id);
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .in('id', userIds);

        profilesData?.forEach((profile: any) => {
          const relation = relationsList.find(r => r.user_id === profile.id);
          if (relation) {
            relation.avatar_url = profile.avatar_url;
          }
        });
      }

      setRelations(relationsList.sort((a, b) => 
        (b.given_amount + b.received_amount) - (a.given_amount + a.received_amount)
      ));

    } catch (error) {
      console.error('Error loading reciprocity history:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    contributionsGiven,
    contributionsReceived,
    relations,
    loading,
    refresh: loadHistory,
  };
}
