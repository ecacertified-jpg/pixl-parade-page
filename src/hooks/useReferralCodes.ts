import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ReferralCode {
  id: string;
  code: string;
  code_type: string;
  label: string | null;
  description: string | null;
  is_active: boolean;
  is_primary: boolean;
  views_count: number;
  clicks_count: number;
  signups_count: number;
  conversions_count: number;
  expires_at: string | null;
  max_uses: number | null;
  current_uses: number;
  created_at: string;
  last_used_at: string | null;
  metadata: any;
}

export const useReferralCodes = () => {
  const { user } = useAuth();
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [primaryCode, setPrimaryCode] = useState<ReferralCode | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCodes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCodes(data || []);
      const primary = data?.find(c => c.is_primary);
      setPrimaryCode(primary || null);
    } catch (error: any) {
      console.error('Error fetching referral codes:', error);
      toast.error('Erreur lors du chargement des codes');
    } finally {
      setLoading(false);
    }
  };

  const createCode = async (label: string, codeType: string = 'personal') => {
    if (!user) return null;

    try {
      const { data: newCodeData, error: codeError } = await supabase.rpc(
        'generate_unique_referral_code',
        { user_uuid: user.id, code_format: 'JOIE' }
      );

      if (codeError) throw codeError;

      const { data, error } = await supabase
        .from('referral_codes')
        .insert({
          user_id: user.id,
          code: newCodeData,
          code_type: codeType,
          label,
          is_primary: false,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Code créé avec succès');
      await fetchCodes();
      return data;
    } catch (error: any) {
      console.error('Error creating referral code:', error);
      toast.error('Erreur lors de la création du code');
      return null;
    }
  };

  const updateCode = async (id: string, updates: Partial<ReferralCode>) => {
    try {
      const { error } = await supabase
        .from('referral_codes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Code mis à jour');
      await fetchCodes();
    } catch (error: any) {
      console.error('Error updating referral code:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const deleteCode = async (id: string) => {
    try {
      const { error } = await supabase
        .from('referral_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Code supprimé');
      await fetchCodes();
    } catch (error: any) {
      console.error('Error deleting referral code:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  useEffect(() => {
    fetchCodes();
  }, [user]);

  return {
    codes,
    primaryCode,
    loading,
    fetchCodes,
    createCode,
    updateCode,
    deleteCode,
  };
};
