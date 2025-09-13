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
          ),
          profiles!beneficiary_user_id (
            user_id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('business_accounts.user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform the data to match our interface
      const transformedFunds: BusinessCollectiveFund[] = (data || []).map(item => ({
        id: item.id,
        fund_id: item.fund_id,
        business_id: item.business_id,
        product_id: item.product_id,
        beneficiary_user_id: item.beneficiary_user_id,
        auto_notifications: item.auto_notifications,
        created_at: item.created_at,
        fund: Array.isArray(item.collective_funds) ? item.collective_funds[0] : item.collective_funds,
        product: Array.isArray(item.products) ? item.products[0] : item.products,
        beneficiary: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      }));

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