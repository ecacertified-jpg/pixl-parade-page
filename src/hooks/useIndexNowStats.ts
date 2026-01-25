import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, startOfDay, eachDayOfInterval } from 'date-fns';

export interface IndexNowSubmission {
  id: string;
  url: string;
  entity_type: string | null;
  entity_id: string | null;
  status: string;
  submitted_to: string[] | null;
  created_at: string;
  error_message: string | null;
  response_code: number | null;
}

export interface IndexNowStats {
  totalSubmissions: number;
  successCount: number;
  failedCount: number;
  successRate: number;
  byEntityType: { type: string; count: number }[];
  byEngine: { engine: string; count: number }[];
  trendData: { date: string; count: number; success: number; failed: number }[];
  recentSubmissions: IndexNowSubmission[];
  todayCount: number;
  lastSubmissionAt: string | null;
}

interface UseIndexNowStatsOptions {
  days?: number;
  limit?: number;
}

export function useIndexNowStats(options: UseIndexNowStatsOptions = {}) {
  const { days = 30, limit = 50 } = options;
  
  const [stats, setStats] = useState<IndexNowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = subDays(new Date(), days);
      const today = startOfDay(new Date());

      // Fetch all submissions in the period
      const { data: submissions, error: submissionsError } = await supabase
        .from('indexnow_submissions')
        .select('id, url, entity_type, entity_id, status, submitted_to, created_at, error_message, response_code')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      const allSubmissions = submissions || [];

      // Calculate basic stats
      const totalSubmissions = allSubmissions.length;
      const successCount = allSubmissions.filter(s => s.status === 'success').length;
      const failedCount = allSubmissions.filter(s => s.status === 'failed').length;
      const successRate = totalSubmissions > 0 ? (successCount / totalSubmissions) * 100 : 0;

      // Today's count
      const todayCount = allSubmissions.filter(s => {
        const submittedDate = startOfDay(new Date(s.created_at));
        return submittedDate.getTime() === today.getTime();
      }).length;

      // Last submission
      const lastSubmissionAt = allSubmissions.length > 0 ? allSubmissions[0].created_at : null;

      // Group by entity type
      const entityTypeCounts: Record<string, number> = {};
      allSubmissions.forEach(s => {
        const type = s.entity_type || 'unknown';
        entityTypeCounts[type] = (entityTypeCounts[type] || 0) + 1;
      });
      const byEntityType = Object.entries(entityTypeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      // Group by engine (from submitted_to array)
      const engineCounts: Record<string, number> = {};
      allSubmissions.forEach(s => {
        const engines = s.submitted_to || ['unknown'];
        engines.forEach(engine => {
          engineCounts[engine] = (engineCounts[engine] || 0) + 1;
        });
      });
      const byEngine = Object.entries(engineCounts)
        .map(([engine, count]) => ({ engine, count }))
        .sort((a, b) => b.count - a.count);

      // Build trend data for each day
      const dateRange = eachDayOfInterval({ start: startDate, end: new Date() });
      const trendData = dateRange.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const daySubmissions = allSubmissions.filter(s => 
          format(new Date(s.created_at), 'yyyy-MM-dd') === dateStr
        );
        return {
          date: dateStr,
          count: daySubmissions.length,
          success: daySubmissions.filter(s => s.status === 'success').length,
          failed: daySubmissions.filter(s => s.status === 'failed').length,
        };
      });

      // Recent submissions (limited)
      const recentSubmissions: IndexNowSubmission[] = allSubmissions.slice(0, limit).map(s => ({
        id: s.id,
        url: s.url,
        entity_type: s.entity_type,
        entity_id: s.entity_id,
        status: s.status,
        submitted_to: s.submitted_to,
        created_at: s.created_at,
        error_message: s.error_message,
        response_code: s.response_code,
      }));

      setStats({
        totalSubmissions,
        successCount,
        failedCount,
        successRate,
        byEntityType,
        byEngine,
        trendData,
        recentSubmissions,
        todayCount,
        lastSubmissionAt,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch IndexNow stats'));
    } finally {
      setLoading(false);
    }
  }, [days, limit]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
