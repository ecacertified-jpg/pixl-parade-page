import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AdminShareCode {
  id: string;
  admin_user_id: string;
  code: string;
  is_active: boolean;
  clicks_count: number;
  signups_count: number;
  assignments_count: number;
  created_at: string;
}

export const useAdminShareCode = () => {
  const { user } = useAuth();
  const [shareCode, setShareCode] = useState<AdminShareCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState<string | null>(null);

  const loadAdminId = useCallback(async () => {
    if (!user) return null;
    const { data } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    const id = data?.id || null;
    setAdminId(id);
    return id;
  }, [user]);

  const loadShareCode = useCallback(async (aid: string) => {
    const { data } = await supabase
      .from('admin_share_codes')
      .select('*')
      .eq('admin_user_id', aid)
      .eq('is_active', true)
      .maybeSingle();
    return data as AdminShareCode | null;
  }, []);

  const generateCode = useCallback(async (aid: string) => {
    // Generate code via DB function
    const { data: codeData } = await supabase.rpc('generate_admin_share_code');
    if (!codeData) return null;

    const { data, error } = await supabase
      .from('admin_share_codes')
      .insert({ admin_user_id: aid, code: codeData })
      .select()
      .single();

    if (error) {
      console.error('Error generating share code:', error);
      return null;
    }
    return data as AdminShareCode;
  }, []);

  const init = useCallback(async () => {
    setLoading(true);
    try {
      const aid = await loadAdminId();
      if (!aid) { setLoading(false); return; }

      let code = await loadShareCode(aid);
      if (!code) {
        code = await generateCode(aid);
      }
      setShareCode(code);
    } catch (e) {
      console.error('Error loading share code:', e);
    } finally {
      setLoading(false);
    }
  }, [loadAdminId, loadShareCode, generateCode]);

  useEffect(() => {
    if (user) init();
  }, [user, init]);

  const regenerate = useCallback(async () => {
    if (!adminId) return;
    // Deactivate current code
    if (shareCode) {
      await supabase
        .from('admin_share_codes')
        .update({ is_active: false })
        .eq('id', shareCode.id);
    }
    const newCode = await generateCode(adminId);
    setShareCode(newCode);
  }, [adminId, shareCode, generateCode]);

  const getShareLink = useCallback(() => {
    if (!shareCode) return '';
    return `${window.location.origin}/join/${shareCode.code}`;
  }, [shareCode]);

  return {
    shareCode,
    loading,
    regenerate,
    getShareLink,
    refetch: init,
  };
};
