import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';

export interface AdminPerformanceData {
  adminId: string;
  adminUserId: string;
  adminName: string;
  role: string;
  assignedCountries: string[] | null;
  totalActions: number;
  actionsThisPeriod: number;
  actionBreakdown: {
    approvals: number;
    deletions: number;
    updates: number;
    creations: number;
    other: number;
  };
  avgResponseTimeMinutes: number | null;
  fastestResponseMinutes: number | null;
  slowestResponseMinutes: number | null;
  notificationsProcessed: number;
  pendingNotifications: number;
  countryBreakdown: {
    countryCode: string;
    actions: number;
    avgResponseTime: number | null;
  }[];
  activityRate: number;
  performanceScore: number;
}

export interface PerformanceKPIs {
  totalActions: number;
  avgResponseTimeMinutes: number | null;
  notificationsProcessed: number;
  avgActivityRate: number;
  actionsByType: {
    type: string;
    count: number;
  }[];
  actionsByDay: {
    date: string;
    count: number;
  }[];
}

export interface UseAdminPerformanceOptions {
  period: 'today' | '7days' | '30days' | '90days';
  countryFilter?: string | null;
  adminFilter?: string | null;
}

const getPeriodStartDate = (period: UseAdminPerformanceOptions['period']): Date => {
  const now = new Date();
  switch (period) {
    case 'today':
      return new Date(now.setHours(0, 0, 0, 0));
    case '7days':
      return new Date(now.setDate(now.getDate() - 7));
    case '30days':
      return new Date(now.setDate(now.getDate() - 30));
    case '90days':
      return new Date(now.setDate(now.getDate() - 90));
    default:
      return new Date(now.setDate(now.getDate() - 30));
  }
};

export const useAdminPerformance = (options: UseAdminPerformanceOptions) => {
  const [adminPerformance, setAdminPerformance] = useState<AdminPerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isSuperAdmin, getAccessibleCountries } = useAdmin();

  const periodStartDate = useMemo(() => getPeriodStartDate(options.period), [options.period]);

  useEffect(() => {
    fetchPerformanceData();
  }, [options.period, options.countryFilter, options.adminFilter]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);

      // Fetch all admin users
      const { data: adminUsers, error: adminError } = await supabase
        .from('admin_users')
        .select('id, user_id, role, is_active, assigned_countries')
        .eq('is_active', true);

      if (adminError) throw adminError;

      // Fetch profiles for admin names
      const userIds = adminUsers?.map(au => au.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      // Fetch audit logs for the period
      let logsQuery = supabase
        .from('admin_audit_logs')
        .select('*')
        .gte('created_at', periodStartDate.toISOString())
        .order('created_at', { ascending: false });

      if (options.countryFilter) {
        logsQuery = logsQuery.eq('country_code', options.countryFilter);
      }

      if (options.adminFilter) {
        logsQuery = logsQuery.eq('admin_user_id', options.adminFilter);
      }

      const { data: auditLogs, error: logsError } = await logsQuery;
      if (logsError) throw logsError;

      // Fetch notifications processed (read/dismissed)
      const { data: notifications } = await supabase
        .from('admin_notifications')
        .select('id, admin_user_id, created_at, is_read, is_dismissed, country_code')
        .gte('created_at', periodStartDate.toISOString());

      // Calculate performance for each admin
      const performanceData: AdminPerformanceData[] = (adminUsers || []).map(admin => {
        const profile = profiles?.find(p => p.user_id === admin.user_id);
        const adminName = profile 
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Admin'
          : 'Admin';

        // Filter logs for this admin
        const adminLogs = auditLogs?.filter(log => log.admin_user_id === admin.user_id) || [];

        // Action breakdown
        const actionBreakdown = {
          approvals: adminLogs.filter(l => l.action_type === 'approve').length,
          deletions: adminLogs.filter(l => l.action_type === 'delete' || l.action_type === 'hide').length,
          updates: adminLogs.filter(l => l.action_type === 'update').length,
          creations: adminLogs.filter(l => l.action_type === 'create').length,
          other: adminLogs.filter(l => !['approve', 'delete', 'hide', 'update', 'create'].includes(l.action_type)).length,
        };

        // Calculate response times from logs with related_notification_id
        const logsWithNotification = adminLogs.filter(l => l.related_notification_id);
        const responseTimes: number[] = [];
        
        logsWithNotification.forEach(log => {
          const notification = notifications?.find(n => n.id === log.related_notification_id);
          if (notification) {
            const responseTime = (new Date(log.created_at).getTime() - new Date(notification.created_at).getTime()) / (1000 * 60);
            if (responseTime > 0) {
              responseTimes.push(responseTime);
            }
          }
        });

        const avgResponseTimeMinutes = responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : null;
        const fastestResponseMinutes = responseTimes.length > 0 ? Math.min(...responseTimes) : null;
        const slowestResponseMinutes = responseTimes.length > 0 ? Math.max(...responseTimes) : null;

        // Notifications processed
        const adminNotifications = notifications?.filter(n => 
          n.admin_user_id === admin.user_id && (n.is_read || n.is_dismissed)
        ) || [];
        const pendingNotifications = notifications?.filter(n => 
          n.admin_user_id === admin.user_id && !n.is_read && !n.is_dismissed
        )?.length || 0;

        // Country breakdown
        const countryGroups = adminLogs.reduce((acc, log) => {
          const country = log.country_code || 'unknown';
          if (!acc[country]) acc[country] = [];
          acc[country].push(log);
          return acc;
        }, {} as Record<string, typeof adminLogs>);

        const countryBreakdown = Object.entries(countryGroups).map(([countryCode, logs]) => ({
          countryCode,
          actions: logs.length,
          avgResponseTime: null, // Could calculate per country if needed
        }));

        // Activity rate (actions per day)
        const daysSincePeriodStart = Math.max(1, Math.ceil(
          (new Date().getTime() - periodStartDate.getTime()) / (1000 * 60 * 60 * 24)
        ));
        const actionsPerDay = adminLogs.length / daysSincePeriodStart;
        const activityRate = Math.min(100, (actionsPerDay / 10) * 100); // 10 actions/day = 100%

        // Performance score (weighted)
        const responseScore = avgResponseTimeMinutes 
          ? Math.max(0, 100 - (avgResponseTimeMinutes / 60) * 10) // Lose 10 points per hour
          : 50; // Neutral if no data
        const performanceScore = Math.round(
          (activityRate * 0.4) + 
          (responseScore * 0.4) + 
          ((adminNotifications.length / Math.max(1, adminNotifications.length + pendingNotifications)) * 100 * 0.2)
        );

        return {
          adminId: admin.id,
          adminUserId: admin.user_id,
          adminName,
          role: admin.role,
          assignedCountries: admin.assigned_countries,
          totalActions: adminLogs.length,
          actionsThisPeriod: adminLogs.length,
          actionBreakdown,
          avgResponseTimeMinutes,
          fastestResponseMinutes,
          slowestResponseMinutes,
          notificationsProcessed: adminNotifications.length,
          pendingNotifications,
          countryBreakdown,
          activityRate,
          performanceScore,
        };
      });

      // Filter by admin's accessible countries if not super admin
      let filteredData = performanceData;
      const accessibleCountries = getAccessibleCountries();
      if (accessibleCountries) {
        filteredData = performanceData.filter(admin => {
          if (!admin.assignedCountries) return false;
          return admin.assignedCountries.some(c => accessibleCountries.includes(c));
        });
      }

      // Sort by performance score
      filteredData.sort((a, b) => b.performanceScore - a.performanceScore);

      setAdminPerformance(filteredData);
    } catch (err) {
      console.error('Error fetching admin performance:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate aggregate KPIs
  const kpis: PerformanceKPIs = useMemo(() => {
    const totalActions = adminPerformance.reduce((sum, a) => sum + a.totalActions, 0);
    
    const responseTimes = adminPerformance
      .filter(a => a.avgResponseTimeMinutes !== null)
      .map(a => a.avgResponseTimeMinutes!);
    const avgResponseTimeMinutes = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : null;
    
    const notificationsProcessed = adminPerformance.reduce((sum, a) => sum + a.notificationsProcessed, 0);
    
    const avgActivityRate = adminPerformance.length > 0
      ? adminPerformance.reduce((sum, a) => sum + a.activityRate, 0) / adminPerformance.length
      : 0;

    // Aggregate action types
    const actionsByType = [
      { type: 'Approbations', count: adminPerformance.reduce((sum, a) => sum + a.actionBreakdown.approvals, 0) },
      { type: 'Suppressions', count: adminPerformance.reduce((sum, a) => sum + a.actionBreakdown.deletions, 0) },
      { type: 'Mises à jour', count: adminPerformance.reduce((sum, a) => sum + a.actionBreakdown.updates, 0) },
      { type: 'Créations', count: adminPerformance.reduce((sum, a) => sum + a.actionBreakdown.creations, 0) },
      { type: 'Autres', count: adminPerformance.reduce((sum, a) => sum + a.actionBreakdown.other, 0) },
    ];

    // Daily actions (mock for now - would need more detailed data)
    const actionsByDay: { date: string; count: number }[] = [];

    return {
      totalActions,
      avgResponseTimeMinutes,
      notificationsProcessed,
      avgActivityRate,
      actionsByType,
      actionsByDay,
    };
  }, [adminPerformance]);

  return {
    adminPerformance,
    kpis,
    loading,
    error,
    refetch: fetchPerformanceData,
  };
};
