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

      // Requête améliorée avec toutes les informations nécessaires
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
        contacts:beneficiary_contact_id(
          id,
          name,
          birthday,
          user_id
        ),
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

      // Récupérer les IDs des amis pour calculer les priorités
      const { data: friendsData } = await supabase
        .from('contact_relationships')
        .select('user_a, user_b')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

      const friendIds = friendsData?.map(rel => 
        rel.user_a === user.id ? rel.user_b : rel.user_a
      ) || [];

      // Récupérer les contacts des amis pour identifier les bénéficiaires
      const { data: friendContactsData } = friendIds.length > 0 ? await supabase
        .from('contacts')
        .select('id, user_id')
        .in('user_id', friendIds)
        : { data: [] };

      const friendContactIds = friendContactsData?.map(c => c.id) || [];

      // Récupérer toutes les cagnottes accessibles (la RLS fait le filtrage)
      const { data: allFundsData, error } = await supabase
        .from('collective_funds')
        .select(selectQuery)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des cagnottes:', error);
        throw error;
      }

      // Calculer la priorité pour chaque cagnotte
      const allFunds = (allFundsData || []).map(fund => {
        let priority = 4; // Par défaut : cagnotte publique générale

        // Priorité 1: Cagnotte créée par un ami
        if (friendIds.includes(fund.creator_id)) {
          priority = 1;
        }
        
        // Priorité 1.5: Cagnotte créée POUR un ami (bénéficiaire est un ami)
        if (fund.beneficiary_contact_id && friendContactIds.includes(fund.beneficiary_contact_id)) {
          priority = Math.min(priority, 1.5);
        }

        // Priorité 2: Mes propres cagnottes
        if (fund.creator_id === user.id) {
          priority = 2;
        }

        // Priorité 3: Cagnottes auxquelles j'ai contribué
        const hasContributed = fund.fund_contributions?.some(
          contrib => contrib.contributor_id === user.id
        );
        if (hasContributed && fund.creator_id !== user.id) {
          priority = Math.min(priority, 3);
        }

        return { ...fund, priority };
      });

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
        // Gérer les deux formats de retour de Supabase (tableau ou objet)
        let beneficiaryName = 'Bénéficiaire';
        let beneficiaryBirthday = undefined;
        
        const contactData = Array.isArray(fund.contacts) ? fund.contacts[0] : fund.contacts;
        
        if (contactData && contactData.name) {
          beneficiaryName = contactData.name;
          beneficiaryBirthday = contactData.birthday;
          
          console.log('🎂 [DEBUG] Contact data found:', {
            fundId: fund.id,
            fundTitle: fund.title,
            contactName: beneficiaryName,
            birthday: beneficiaryBirthday,
            isArray: Array.isArray(fund.contacts)
          });
        } else if (fund.title.includes('pour ')) {
          beneficiaryName = fund.title.split('pour ')[1];
          
          console.log('⚠️ [DEBUG] No contact data, extracting from title:', {
            fundId: fund.id,
            fundTitle: fund.title,
            extractedName: beneficiaryName,
            beneficiaryContactId: fund.beneficiary_contact_id,
            contactsData: fund.contacts
          });
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