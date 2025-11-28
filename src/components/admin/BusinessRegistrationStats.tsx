import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

interface RegistrationStats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
}

interface TrendData {
  date: string;
  count: number;
}

export function BusinessRegistrationStats() {
  const [stats, setStats] = useState<RegistrationStats>({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
  });
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Count approved and rejected from logs
      const { data: logs } = await supabase
        .from('business_registration_logs')
        .select('action, created_at');

      const approved = logs?.filter(l => l.action === 'approved').length || 0;
      const rejected = logs?.filter(l => l.action === 'rejected').length || 0;

      // Count pending (businesses that are not active yet)
      const { count: pending } = await supabase
        .from('business_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false);

      const total = approved + rejected + (pending || 0);

      setStats({
        total,
        approved,
        rejected,
        pending: pending || 0,
      });

      // Get trend data for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: trendLogs } = await supabase
        .from('business_registration_logs')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      // Group by day
      const dailyCounts: { [key: string]: number } = {};
      trendLogs?.forEach(log => {
        const date = new Date(log.created_at).toLocaleDateString('fr-FR');
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      });

      const trend = Object.entries(dailyCounts).map(([date, count]) => ({
        date,
        count,
      }));

      setTrendData(trend);
    } catch (error) {
      console.error('Error fetching business registration stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistiques des inscriptions business</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pieData = [
    { name: 'Approuvées', value: stats.approved, color: 'hsl(var(--chart-1))' },
    { name: 'Rejetées', value: stats.rejected, color: 'hsl(var(--chart-2))' },
    { name: 'En attente', value: stats.pending, color: 'hsl(var(--chart-3))' },
  ];

  const approvedPercentage = stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : '0';
  const rejectedPercentage = stats.total > 0 ? ((stats.rejected / stats.total) * 100).toFixed(1) : '0';
  const pendingPercentage = stats.total > 0 ? ((stats.pending / stats.total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Statistiques des inscriptions business
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-accent/5 border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Demandes reçues
                </p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Approuvées</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700 dark:text-green-400">{stats.approved}</div>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                  {approvedPercentage}% du total
                </p>
              </CardContent>
            </Card>

            <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Rejetées</CardTitle>
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-700 dark:text-red-400">{stats.rejected}</div>
                <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                  {rejectedPercentage}% du total
                </p>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">En attente</CardTitle>
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-700 dark:text-orange-400">{stats.pending}</div>
                <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                  {pendingPercentage}% du total
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mt-6">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Répartition des statuts</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Évolution (30 derniers jours)</CardTitle>
              </CardHeader>
              <CardContent>
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.2)" 
                        name="Inscriptions"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                    Aucune donnée disponible
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}