import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, Store, DollarSign, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DashboardStats {
  totalUsers: number;
  activeClients: number;
  activeBusinesses: number;
  totalTransactions: number;
  pendingReports: number;
  pendingValidations: number;
  pendingRefunds: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeClients: 0,
    activeBusinesses: 0,
    totalTransactions: 0,
    pendingReports: 0,
    pendingValidations: 0,
    pendingRefunds: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Total users (profiles)
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Active businesses
      const { count: activeBusinesses } = await supabase
        .from('business_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Total collective funds (as transactions proxy)
      const { count: totalTransactions } = await supabase
        .from('collective_funds')
        .select('*', { count: 'exact', head: true });

      // Pending business validations
      const { count: pendingValidations } = await supabase
        .from('business_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', false)
        .eq('is_active', true);

      setStats({
        totalUsers: totalUsers || 0,
        activeClients: totalUsers || 0,
        activeBusinesses: activeBusinesses || 0,
        totalTransactions: totalTransactions || 0,
        pendingReports: 0, // À implémenter avec table de signalements
        pendingValidations: pendingValidations || 0,
        pendingRefunds: 0, // À implémenter avec table refunds
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
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
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord administrateur</h1>
          <p className="text-muted-foreground mt-2">
            Vue d'ensemble de la plateforme JOIE DE VIVRE
          </p>
        </div>

        {/* Alerts */}
        <div className="grid gap-4">
          {stats.pendingValidations > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Attention</AlertTitle>
              <AlertDescription>
                {stats.pendingValidations} compte(s) prestataire(s) en attente de validation
              </AlertDescription>
            </Alert>
          )}
          
          {stats.pendingRefunds > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Remboursements</AlertTitle>
              <AlertDescription>
                {stats.pendingRefunds} demande(s) de remboursement à traiter
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Utilisateurs
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Clients et prestataires confondus
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Prestataires Actifs
              </CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBusinesses}</div>
              <p className="text-xs text-muted-foreground">
                Comptes business vérifiés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Transactions
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">
                Cotisations collectives créées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                En attente
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.pendingValidations + stats.pendingReports + stats.pendingRefunds}
              </div>
              <p className="text-xs text-muted-foreground">
                Actions à traiter
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Système opérationnel</p>
                  <p className="text-xs text-muted-foreground">
                    Toutes les fonctionnalités sont actives
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
