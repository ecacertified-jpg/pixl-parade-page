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

export interface AggregatedStats {
  total_clicks: number;
  total_signups: number;
  total_assignments: number;
}

export const useAdminShareCode = () => {
  const { user } = useAuth();
  const [shareCode, setShareCode] = useState<AdminShareCode | null>(null);
  const [aggregatedStats, setAggregatedStats] = useState<AggregatedStats>({ total_clicks: 0, total_signups: 0, total_assignments: 0 });
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
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data as AdminShareCode | null;
  }, []);

  const loadAggregatedStats = useCallback(async (aid: string) => {
    const { data } = await supabase
      .from('admin_share_codes')
      .select('clicks_count, signups_count, assignments_count')
      .eq('admin_user_id', aid);

    if (data && data.length > 0) {
      const stats = data.reduce(
        (acc, row) => ({
          total_clicks: acc.total_clicks + (row.clicks_count || 0),
          total_signups: acc.total_signups + (row.signups_count || 0),
          total_assignments: acc.total_assignments + (row.assignments_count || 0),
        }),
        { total_clicks: 0, total_signups: 0, total_assignments: 0 }
      );
      setAggregatedStats(stats);
    }
  }, []);

  const generateCode = useCallback(async (aid: string) => {
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
      await loadAggregatedStats(aid);
    } catch (e) {
      console.error('Error loading share code:', e);
    } finally {
      setLoading(false);
    }
  }, [loadAdminId, loadShareCode, generateCode, loadAggregatedStats]);

  useEffect(() => {
    if (user) init();
  }, [user, init]);

  const regenerate = useCallback(async () => {
    if (!adminId) return;
    // Deactivate ALL codes for this admin
    await supabase
      .from('admin_share_codes')
      .update({ is_active: false })
      .eq('admin_user_id', adminId)
      .eq('is_active', true);

    const newCode = await generateCode(adminId);
    setShareCode(newCode);
    await loadAggregatedStats(adminId);
  }, [adminId, generateCode, loadAggregatedStats]);

  const getShareLink = useCallback(() => {
    if (!shareCode) return '';
    return `https://joiedevivre-africa.com/join/${shareCode.code}`;
  }, [shareCode]);

  return {
    shareCode,
    aggregatedStats,
    loading,
    regenerate,
    getShareLink,
    refetch: init,
  };
};
