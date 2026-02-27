import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay } from 'date-fns';

type Period = 'today' | '7days' | '30days' | '90days';

function getPeriodStart(period: Period): string {
  const now = new Date();
  switch (period) {
    case 'today': return startOfDay(now).toISOString();
    case '7days': return subDays(now, 7).toISOString();
    case '30days': return subDays(now, 30).toISOString();
    case '90days': return subDays(now, 90).toISOString();
  }
}

export function useBusinessFundWhatsAppLogs(period: Period) {
  const query = useQuery({
    queryKey: ['business-fund-wa-logs', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_template_logs')
        .select('*')
        .eq('template_name', 'joiedevivre_group_contribution')
        .gte('created_at', getPeriodStart(period))
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data || [];
    },
  });

  const logs = query.data || [];
  const total = logs.length;
  const success = logs.filter(l => l.status === 'sent').length;
  const failed = total - success;
  const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

  return { ...query, logs, kpis: { total, success, failed, successRate } };
}
