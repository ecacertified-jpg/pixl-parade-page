import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { AdminCountryRestrictionAlert } from '@/components/admin/AdminCountryRestrictionAlert';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DollarSign, TrendingUp, Users, Activity } from 'lucide-react';

export default function FinancialManagement() {
  const [stats, setStats] = useState({
    totalFunds: 0,
    totalAmount: 0,
    activeFunds: 0,
    completedFunds: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialStats();
  }, []);

  const fetchFinancialStats = async () => {
    try {
      setLoading(true);

      const { count: totalFunds } = await supabase
        .from('collective_funds')
        .select('*', { count: 'exact', head: true });

      const { count: activeFunds } = await supabase
        .from('collective_funds')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: completedFunds } = await supabase
        .from('collective_funds')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'target_reached');

      const { data: fundsData } = await supabase
        .from('collective_funds')
        .select('current_amount');

      const totalAmount = fundsData?.reduce((sum, fund) => sum + (fund.current_amount || 0), 0) || 0;

      setStats({
        totalFunds: totalFunds || 0,
        totalAmount,
        activeFunds: activeFunds || 0,
        completedFunds: completedFunds || 0,
      });
    } catch (error) {
      console.error('Error fetching financial stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Country Restriction Alert */}
        <AdminCountryRestrictionAlert />

        {/* Header */}
        <AdminPageHeader
          title="Gestion financière"
          description="Suivi des transactions et cotisations"
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total cotisations
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFunds}</div>
              <p className="text-xs text-muted-foreground">
                Toutes les cotisations créées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Montant total collecté
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalAmount.toLocaleString()} FCFA
              </div>
              <p className="text-xs text-muted-foreground">
                Sur toutes les cotisations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Cotisations actives
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeFunds}</div>
              <p className="text-xs text-muted-foreground">
                En cours de collecte
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Objectifs atteints
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedFunds}</div>
              <p className="text-xs text-muted-foreground">
                Cotisations complétées
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transactions récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Les données détaillées des transactions seront affichées ici.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
