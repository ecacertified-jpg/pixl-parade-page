import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface BusinessCollectiveFund {
  id: string;
  fund_id: string;
  business_id: string;
  product_id: string;
  beneficiary_user_id: string;
  auto_notifications: boolean;
  created_at: string;
  // Fund details
  fund?: {
    id: string;
    title: string;
    description?: string;
    target_amount: number;
    current_amount: number;
    currency: string;
    status: string;
    occasion?: string;
    deadline_date?: string;
  };
  // Product details
  product?: {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    image_url?: string;
  };
  // Beneficiary details
  beneficiary?: {
    user_id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
}

export function useBusinessCollectiveFunds() {
  const [funds, setFunds] = useState<BusinessCollectiveFund[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadBusinessFunds = async () => {
    if (!user?.id) {
      setFunds([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get business collective funds with related data
      const { data, error } = await supabase
        .from('business_collective_funds')
        .select(`
          *,
          collective_funds!fund_id (
            id,
            title,
            description,
            target_amount,
            current_amount,
            currency,
            status,
            occasion,
            deadline_date
          ),
          products!product_id (
            id,
            name,
            description,
            price,
            currency,
            image_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Get user's business accounts to check which funds belong to them
      const { data: businessAccounts } = await supabase
        .from('business_accounts')
        .select('id')
        .eq('user_id', user.id);

      const userBusinessIds = (businessAccounts || []).map(ba => ba.id);

      // Filter funds that belong to current user's business accounts OR directly to the user
      const userFunds = (data || []).filter(fund => {
        return userBusinessIds.includes(fund.business_id) || fund.business_id === user.id;
      });

      // Transform the data to match our interface and get beneficiary info separately
      const transformedFunds: BusinessCollectiveFund[] = [];
      
      for (const item of userFunds) {
        // Get beneficiary profile if beneficiary_user_id exists
        let beneficiary = null;
        if (item.beneficiary_user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name, phone')
            .eq('user_id', item.beneficiary_user_id)
            .single();
          
          beneficiary = profileData;
        }

        transformedFunds.push({
          id: item.id,
          fund_id: item.fund_id,
          business_id: item.business_id,
          product_id: item.product_id,
          beneficiary_user_id: item.beneficiary_user_id,
          auto_notifications: item.auto_notifications,
          created_at: item.created_at,
          fund: Array.isArray(item.collective_funds) ? item.collective_funds[0] : item.collective_funds,
          product: Array.isArray(item.products) ? item.products[0] : item.products,
          beneficiary: beneficiary
        });
      }

      setFunds(transformedFunds);
    } catch (error) {
      console.error('Error loading business collective funds:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les cotisations business",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshFunds = () => {
    loadBusinessFunds();
  };

  useEffect(() => {
    loadBusinessFunds();
  }, [user]);

  return {
    funds,
    loading,
    refreshFunds
  };
}