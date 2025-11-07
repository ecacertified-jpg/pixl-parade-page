import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLog {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_type: string;
  target_id: string | null;
  description: string;
  metadata: any;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
  admin_user: {
    user_id: string;
    role: string;
    profiles: {
      first_name: string | null;
      last_name: string | null;
    };
  };
}

export const useAuditLogs = (filters?: {
  actionType?: string;
  adminUserId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters?.actionType) {
        query = query.eq('action_type', filters.actionType);
      }

      if (filters?.adminUserId) {
        query = query.eq('admin_user_id', filters.adminUserId);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data: logsData, error } = await query;

      if (error) throw error;

      // Fetch admin user details separately
      if (logsData && logsData.length > 0) {
        const adminUserIds = [...new Set(logsData.map(log => log.admin_user_id))];
        
        const { data: adminUsers } = await supabase
          .from('admin_users')
          .select('id, user_id, role')
          .in('id', adminUserIds);

        const userIds = adminUsers?.map(au => au.user_id) || [];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);

        const enrichedLogs = logsData.map(log => ({
          ...log,
          admin_user: {
            user_id: adminUsers?.find(au => au.id === log.admin_user_id)?.user_id || '',
            role: adminUsers?.find(au => au.id === log.admin_user_id)?.role || '',
            profiles: {
              first_name: profiles?.find(p => p.user_id === adminUsers?.find(au => au.id === log.admin_user_id)?.user_id)?.first_name || null,
              last_name: profiles?.find(p => p.user_id === adminUsers?.find(au => au.id === log.admin_user_id)?.user_id)?.last_name || null,
            }
          }
        }));

        setLogs(enrichedLogs as AuditLog[]);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return { logs, loading, refetch: fetchLogs };
};
