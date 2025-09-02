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
  targetAmount: number;
  currentAmount: number;
  currency: string;
  productImage?: string;
  productName: string;
  contributors: Contributor[];
  status: 'active' | 'completed' | 'expired';
  occasion: string;
  orderData?: any;
  creatorId?: string;
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

      // Charger les cagnottes créées par l'utilisateur ou auxquelles il peut accéder via ses amis
      const { data: fundsData, error: fundsError } = await supabase
        .from('collective_funds')
        .select(`
          id,
          title,
          target_amount,
          current_amount,
          currency,
          occasion,
          status,
          creator_id,
          beneficiary_contact_id,
          contacts:beneficiary_contact_id(name),
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
        `)
        .or(`creator_id.eq.${user.id},creator_id.in.(
          SELECT CASE 
            WHEN user_a = '${user.id}' THEN user_b 
            ELSE user_a 
          END
          FROM contact_relationships 
          WHERE (user_a = '${user.id}' OR user_b = '${user.id}')
        )`)

      if (fundsError) {
        console.error('Erreur lors du chargement des cagnottes:', fundsError);
        return;
      }

      // Transformer les données pour correspondre à l'interface
      const transformedFunds: CollectiveFund[] = (fundsData || []).map(fund => {
        const contributors: Contributor[] = (fund.fund_contributions || []).map(contrib => ({
          id: contrib.contributor_id,
          name: contrib.profiles 
            ? `${contrib.profiles.first_name || ''} ${contrib.profiles.last_name || ''}`.trim()
            : 'Utilisateur',
          amount: contrib.amount,
        }));

        // Extraire le nom du bénéficiaire du titre ou des contacts
        let beneficiaryName = 'Bénéficiaire';
        if (fund.contacts && fund.contacts.name) {
          beneficiaryName = fund.contacts.name;
        } else if (fund.title.includes('pour ')) {
          beneficiaryName = fund.title.split('pour ')[1];
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
          targetAmount: fund.target_amount,
          currentAmount: fund.current_amount || 0,
          currency: fund.currency || 'XOF',
          productName,
          productImage,
          contributors,
          status: fund.current_amount >= fund.target_amount ? 'completed' : 'active',
          occasion: fund.occasion || 'anniversaire',
          orderData: orderData || null,
          creatorId: fund.creator_id
        };
      });

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