import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  priority?: number; // 1: friends' public funds, 2: own funds, 3: contributed funds, 4: general public funds
}

export function useCollectiveFunds() {
  const [funds, setFunds] = useState<CollectiveFund[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadFunds = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Charger les contacts de l'utilisateur pour les anniversaires
      const { data: userContacts } = await supabase
        .from('contacts')
        .select('id, name, birthday')
        .eq('user_id', user.id);

      // Get friends IDs first
      const { data: friendsData } = await supabase
        .from('contact_relationships')
        .select('user_a, user_b')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .eq('can_see_funds', true);

      const friendIds = friendsData?.map(rel => 
        rel.user_a === user.id ? rel.user_b : rel.user_a
      ) || [];

      // Get friend contacts (contacts that belong to friends)
      const { data: friendContactsData } = friendIds.length > 0 ? await supabase
        .from('contacts')
        .select('id, user_id')
        .in('user_id', friendIds)
        : { data: [] };

      const friendContactIds = friendContactsData?.map(c => c.id) || [];

      // Get contributed fund IDs
      const { data: contributionsData } = await supabase
        .from('fund_contributions')
        .select('fund_id')
        .eq('contributor_id', user.id);

      const contributedFundIds = contributionsData?.map(c => c.fund_id) || [];

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
        contacts:beneficiary_contact_id(name, birthday),
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
        )
      `;

      // 1. Charger les cagnottes publiques des amis (priorité 1)
      const { data: friendsPublicFunds, error: friendsPublicError } = friendIds.length > 0 ? await supabase
        .from('collective_funds')
        .select(selectQuery)
        .in('creator_id', friendIds)
        .eq('is_public', true)
        .eq('status', 'active')
        : { data: [], error: null };

      // 1.5. Charger les cagnottes publiques créées POUR les amis (priorité 1.5)
      const { data: fundsForFriends, error: fundsForFriendsError } = friendContactIds.length > 0 ? await supabase
        .from('collective_funds')
        .select(selectQuery)
        .in('beneficiary_contact_id', friendContactIds)
        .eq('is_public', true)
        .eq('status', 'active')
        .neq('creator_id', user.id) // Exclure ses propres fonds
        : { data: [], error: null };

      // 2. Charger les cagnottes créées par l'utilisateur (priorité 2)
      const { data: ownFunds, error: ownFundsError } = await supabase
        .from('collective_funds')
        .select(selectQuery)
        .eq('creator_id', user.id);

      // 3. Charger les cagnottes auxquelles l'utilisateur a contribué (priorité 3)
      const { data: contributedFunds, error: contributedFundsError } = contributedFundIds.length > 0 ? 
        await supabase
          .from('collective_funds')
          .select(selectQuery)
          .in('id', contributedFundIds)
          .neq('creator_id', user.id) // Exclude own funds
        : { data: [], error: null };

      // 4. Charger les cagnottes publiques générales (priorité 4)
      let generalPublicFunds = null;
      let generalPublicError = null;
      
      if (friendIds.length > 0) {
        const result = await supabase
          .from('collective_funds')
          .select(selectQuery)
          .eq('is_public', true)
          .eq('status', 'active')
          .neq('creator_id', user.id)
          .not('creator_id', 'in', `(${friendIds.join(',')})`);
        generalPublicFunds = result.data;
        generalPublicError = result.error;
      } else {
        const result = await supabase
          .from('collective_funds')
          .select(selectQuery)
          .eq('is_public', true)
          .eq('status', 'active')
          .neq('creator_id', user.id);
        generalPublicFunds = result.data;
        generalPublicError = result.error;
      }

      if (ownFundsError || friendsPublicError || fundsForFriendsError || contributedFundsError || generalPublicError) {
        console.error('Erreur lors du chargement des cagnottes:', { 
          ownFundsError, 
          friendsPublicError,
          fundsForFriendsError, 
          contributedFundsError, 
          generalPublicError 
        });
      }

      // Combiner avec priorités et dédupliquer
      const allFunds = [];
      
      // 1. Ajouter les cagnottes publiques des amis (priorité 1)
      if (friendsPublicFunds) {
        friendsPublicFunds.forEach(fund => {
          if (!allFunds.find(f => f.id === fund.id)) {
            allFunds.push({ ...fund, priority: 1 });
          }
        });
      }

      // 1.5. Ajouter les cagnottes créées POUR les amis (priorité 1.5)
      if (fundsForFriends) {
        fundsForFriends.forEach(fund => {
          if (!allFunds.find(f => f.id === fund.id)) {
            allFunds.push({ ...fund, priority: 1.5 });
          }
        });
      }
      
      // 2. Ajouter ses propres cagnottes (priorité 2)
      if (ownFunds) {
        ownFunds.forEach(fund => {
          if (!allFunds.find(f => f.id === fund.id)) {
            allFunds.push({ ...fund, priority: 2 });
          }
        });
      }
      
      // 3. Ajouter les cagnottes contributées (priorité 3)
      if (contributedFunds) {
        contributedFunds.forEach(fund => {
          if (!allFunds.find(f => f.id === fund.id)) {
            allFunds.push({ ...fund, priority: 3 });
          }
        });
      }
      
      // 4. Ajouter les cagnottes publiques générales (priorité 4)
      if (generalPublicFunds) {
        generalPublicFunds.forEach(fund => {
          if (!allFunds.find(f => f.id === fund.id)) {
            allFunds.push({ ...fund, priority: 4 });
          }
        });
      }

      console.log('Données des cagnottes chargées:', allFunds);

      // Transformer les données pour correspondre à l'interface
      const transformedFunds: CollectiveFund[] = (allFunds || []).map(fund => {
        const contributors: Contributor[] = (fund.fund_contributions || []).map(contrib => ({
          id: contrib.contributor_id,
          name: contrib.profiles 
            ? `${contrib.profiles.first_name || ''} ${contrib.profiles.last_name || ''}`.trim()
            : 'Utilisateur',
          amount: contrib.amount,
        }));

        // Extraire le nom du bénéficiaire du titre ou des contacts
        let beneficiaryName = 'Bénéficiaire';
        let beneficiaryBirthday = undefined;
        if (fund.contacts && fund.contacts.name) {
          beneficiaryName = fund.contacts.name;
          beneficiaryBirthday = fund.contacts.birthday;
        } else if (fund.title.includes('pour ')) {
          beneficiaryName = fund.title.split('pour ')[1];
          
          // Chercher un contact correspondant dans la liste de l'utilisateur
          if (userContacts && userContacts.length > 0) {
            const matchingContact = userContacts.find(contact => 
              contact.name.toLowerCase().includes(beneficiaryName.toLowerCase()) ||
              beneficiaryName.toLowerCase().includes(contact.name.toLowerCase())
            );
            
            if (matchingContact && matchingContact.birthday) {
              beneficiaryBirthday = matchingContact.birthday;
            }
          }
        }

        // Extraire les informations du produit depuis la commande
        const orderData = fund.collective_fund_orders?.[0];
        const orderSummary = orderData?.order_summary as any;
        const firstItem = orderSummary?.items?.[0];
        
        let productName = 'Cadeau';
        let productImage = undefined;
        
        if (firstItem) {
          productName = firstItem.name || 'Cadeau';
          productImage = firstItem.image;
        } else {
          // Fallback: extraire du titre
          const titleParts = fund.title.split(' pour ');
          if (titleParts.length > 1) {
            productName = titleParts[0];
          }
        }

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
          priority: fund.priority || 4
        };
      });

      // Trier par priorité (plus petite = plus prioritaire)
      transformedFunds.sort((a, b) => (a.priority || 4) - (b.priority || 4));
      
      setFunds(transformedFunds);
    } catch (error) {
      console.error('Erreur lors du chargement des cagnottes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les cagnottes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFunds();
  }, [user]);

  return {
    funds,
    loading,
    refreshFunds: loadFunds
  };
}