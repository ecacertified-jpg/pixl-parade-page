import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, Store, DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, CheckCheck, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BusinessRegistrationStats } from '@/components/admin/BusinessRegistrationStats';
import { UserBusinessStatsSection } from '@/components/admin/UserBusinessStatsSection';
import { UserBusinessTable } from '@/components/admin/UserBusinessTable';
import { useSecureAdminActions } from '@/hooks/useSecureAdminActions';
import { useUserBusinessStats } from '@/hooks/useUserBusinessStats';

interface DashboardStats {
  totalUsers: number;
  activeClients: number;
  activeBusinesses: number;
  totalTransactions: number;
  pendingReports: number;
  pendingApprovals: number; // is_active = false
  pendingVerifications: number; // is_active = true AND is_verified = false
  pendingRefunds: number;
}

interface PendingBusiness {
  id: string;
  business_name: string;
  business_type: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeClients: 0,
    activeBusinesses: 0,
    totalTransactions: 0,
    pendingReports: 0,
    pendingApprovals: 0,
    pendingVerifications: 0,
    pendingRefunds: 0,
  });
  const [pendingBusinesses, setPendingBusinesses] = useState<PendingBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkVerifying, setBulkVerifying] = useState(false);

  // Use secure admin actions hook
  const { approveBusiness } = useSecureAdminActions();
  
  // User & Business stats hook
  const { stats: userBusinessStats, users: usersWithBusiness, loading: statsLoading } = useUserBusinessStats();

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

      // Pending business approvals (is_active = false)
      const { count: pendingApprovals } = await supabase
        .from('business_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false);

      // Pending business validations (is_active = true but is_verified = false)
      const { count: pendingValidations } = await supabase
        .from('business_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', false)
        .eq('is_active', true);

      // Fetch recent pending businesses
      const { data: recentPending } = await supabase
        .from('business_accounts')
        .select('id, business_name, business_type, phone, email, created_at')
        .eq('is_active', false)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalUsers: totalUsers || 0,
        activeClients: totalUsers || 0,
        activeBusinesses: activeBusinesses || 0,
        totalTransactions: totalTransactions || 0,
        pendingReports: 0, // À implémenter avec table de signalements
        pendingApprovals: pendingApprovals || 0,
        pendingVerifications: pendingValidations || 0,
        pendingRefunds: 0, // À implémenter avec table refunds
      });

      setPendingBusinesses(recentPending || []);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApprove = (businessId: string) => {
    approveBusiness.mutate(
      {
        business_id: businessId,
        action: 'approve',
      },
      {
        onSuccess: () => {
          fetchDashboardStats();
        }
      }
    );
  };

  const handleBulkVerify = async () => {
    try {
      setBulkVerifying(true);

      // Get all unverified active businesses
      const { data: unverifiedBusinesses, error: fetchError } = await supabase
        .from('business_accounts')
        .select('id, business_name')
        .eq('is_active', true)
        .eq('is_verified', false);

      if (fetchError) throw fetchError;

      if (!unverifiedBusinesses || unverifiedBusinesses.length === 0) {
        toast.info('Aucun compte à vérifier');
        return;
      }

      const ids = unverifiedBusinesses.map(b => b.id);

      // Bulk update
      const { error: updateError } = await supabase
        .from('business_accounts')
        .update({ is_verified: true })
        .in('id', ids);

      if (updateError) throw updateError;

      toast.success(`${ids.length} compte(s) vérifié(s) avec succès`);
      fetchDashboardStats();
    } catch (error) {
      console.error('Error bulk verifying:', error);
      toast.error('Erreur lors de la vérification en masse');
    } finally {
      setBulkVerifying(false);
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
          {stats.pendingApprovals > 0 && (
            <Alert className="border-red-500 bg-red-50 dark:bg-red-950/30">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-600">Approbation requise</AlertTitle>
              <AlertDescription className="text-red-700 dark:text-red-400">
                <strong>{stats.pendingApprovals}</strong> compte(s) prestataire(s) en attente d'<strong>approbation</strong>.{' '}
                <a href="/admin/businesses" className="underline font-medium hover:text-red-800">
                  Approuver →
                </a>
              </AlertDescription>
            </Alert>
          )}
          
          {stats.pendingVerifications > 0 && (
            <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/30">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-600">Vérification requise</AlertTitle>
              <AlertDescription className="text-orange-700 dark:text-orange-400 flex items-center justify-between">
                <span>
                  <strong>{stats.pendingVerifications}</strong> compte(s) prestataire(s) actif(s) en attente de <strong>vérification</strong>.{' '}
                  <a href="/admin/businesses" className="underline font-medium hover:text-orange-800">
                    Vérifier →
                  </a>
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkVerify}
                  disabled={bulkVerifying}
                  className="ml-4 border-orange-500 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                >
                  {bulkVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Vérification...
                    </>
                  ) : (
                    <>
                      <CheckCheck className="mr-2 h-4 w-4" />
                      Vérifier tous
                    </>
                  )}
                </Button>
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

        {/* User & Business Stats Section */}
        <UserBusinessStatsSection stats={userBusinessStats} loading={statsLoading} />

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
                {stats.pendingApprovals + stats.pendingVerifications + stats.pendingReports + stats.pendingRefunds}
              </div>
              <p className="text-xs text-muted-foreground">
                Actions à traiter
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Business Requests */}
        {pendingBusinesses.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Demandes récentes
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {pendingBusinesses.length} inscription(s) en attente d'approbation
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingBusinesses.map((business) => (
                  <div
                    key={business.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{business.business_name}</p>
                        <Badge variant="outline" className="text-xs">
                          {business.business_type || 'Non spécifié'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {business.phone && <span>📞 {business.phone}</span>}
                        {business.email && <span>✉️ {business.email}</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(business.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleQuickApprove(business.id)}
                      disabled={approveBusiness.isPending}
                      className="ml-4"
                    >
                      {approveBusiness.isPending ? 'Approbation...' : 'Approuver'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Business Registration Stats */}
        <BusinessRegistrationStats />

        {/* User Business Table */}
        <UserBusinessTable users={usersWithBusiness} loading={statsLoading} />
        <BusinessRegistrationStats />

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
