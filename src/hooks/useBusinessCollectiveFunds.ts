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
      
      console.log('🔍 [DEBUG] Loading business funds for user:', user.id);
      
      // Get user's business accounts first
      const { data: businessAccounts, error: businessError } = await supabase
        .from('business_accounts')
        .select('id, business_name')
        .eq('user_id', user.id);

      if (businessError) {
        console.error('❌ [DEBUG] Error loading business accounts:', businessError);
        throw businessError;
      }

      const userBusinessIds = (businessAccounts || []).map(ba => ba.id);
      console.log('🏢 [DEBUG] User business account IDs:', userBusinessIds);
      console.log('🏢 [DEBUG] Business accounts:', businessAccounts);

      // Now get business collective funds - RLS should automatically filter for us
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
        console.error('❌ [DEBUG] Error loading business collective funds:', error);
        throw error;
      }

      console.log('💰 [DEBUG] Business collective funds (after RLS):', data?.length || 0);
      console.log('💰 [DEBUG] Sample fund business_ids:', data?.slice(0, 3).map(f => ({ id: f.id, business_id: f.business_id })));

      // RLS should have already filtered the data, but let's keep a safety check
      const userFunds = (data || []).filter(fund => {
        const belongsToUser = userBusinessIds.includes(fund.business_id) || fund.business_id === user.id;
        if (!belongsToUser) {
          console.log('❌ [DEBUG] Fund filtered out (safety check):', { fund_id: fund.id, business_id: fund.business_id, user_id: user.id, userBusinessIds });
        }
        return belongsToUser;
      });

      console.log('✅ [DEBUG] Final filtered user funds:', userFunds.length);
      console.log('✅ [DEBUG] User funds:', userFunds.map(f => ({ id: f.id, business_id: f.business_id, fund_id: f.fund_id })));

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

      console.log('🎯 [DEBUG] Final transformed funds:', transformedFunds.length);
      setFunds(transformedFunds);
    } catch (error) {
      console.error('❌ [ERROR] Error loading business collective funds:', error);
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
    console.log('🔄 [DEBUG] Manual refresh triggered');
    loadBusinessFunds();
  };

  useEffect(() => {
    loadBusinessFunds();
    
    // Listen for refresh events
    const handleRefresh = () => {
      console.log('🔄 [DEBUG] Refresh event received');
      loadBusinessFunds();
    };
    
    window.addEventListener('refresh-business-funds', handleRefresh);
    
    return () => {
      window.removeEventListener('refresh-business-funds', handleRefresh);
    };
  }, [user]);

  return {
    funds,
    loading,
    refreshFunds
  };
}