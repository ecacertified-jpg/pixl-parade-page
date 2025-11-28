import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, Store, DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BusinessRegistrationStats } from '@/components/admin/BusinessRegistrationStats';

interface DashboardStats {
  totalUsers: number;
  activeClients: number;
  activeBusinesses: number;
  totalTransactions: number;
  pendingReports: number;
  pendingValidations: number;
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
    pendingValidations: 0,
    pendingRefunds: 0,
  });
  const [pendingBusinesses, setPendingBusinesses] = useState<PendingBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

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
        pendingValidations: (pendingApprovals || 0) + (pendingValidations || 0),
        pendingRefunds: 0, // À implémenter avec table refunds
      });

      setPendingBusinesses(recentPending || []);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApprove = async (businessId: string, businessName: string) => {
    try {
      setApprovingId(businessId);

      // Update business account to active
      const { error: updateError } = await supabase
        .from('business_accounts')
        .update({ is_active: true })
        .eq('id', businessId);

      if (updateError) throw updateError;

      // Get business owner data including email
      const { data: businessData } = await supabase
        .from('business_accounts')
        .select('user_id, email, business_type')
        .eq('id', businessId)
        .single();

      if (businessData) {
        // Log approval action
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('business_registration_logs').insert({
          business_account_id: businessId,
          business_name: businessName,
          business_email: businessData.email,
          business_type: businessData.business_type,
          action: 'approved',
          admin_user_id: user?.id,
        });

        // Send notification to business owner
        await supabase.from('scheduled_notifications').insert({
          user_id: businessData.user_id,
          notification_type: 'business_approved',
          title: '✅ Compte approuvé',
          message: `Félicitations ! Votre compte prestataire "${businessName}" a été approuvé. Vous pouvez maintenant accéder à Mon Espace Business.`,
          scheduled_for: new Date().toISOString(),
          delivery_methods: ['push', 'in_app'],
          metadata: {
            business_id: businessId,
            action_url: '/business-account',
          },
        });

        // Send approval email
        if (businessData.email) {
          console.log(`Sending approval email to ${businessData.email}`);
          const { error: emailError } = await supabase.functions.invoke('send-business-approval-email', {
            body: {
              business_email: businessData.email,
              business_name: businessName,
              business_type: businessData.business_type || 'Prestataire',
            }
          });

          if (emailError) {
            console.error('Error sending approval email:', emailError);
          } else {
            console.log('Approval email sent successfully');
          }
        }
      }

      toast.success(`Compte "${businessName}" approuvé avec succès`);
      
      // Refresh data
      fetchDashboardStats();
    } catch (error) {
      console.error('Error approving business:', error);
      toast.error('Erreur lors de l\'approbation du compte');
    } finally {
      setApprovingId(null);
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
            <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/30">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-600">Action requise</AlertTitle>
              <AlertDescription className="text-orange-700 dark:text-orange-400">
                <strong>{stats.pendingValidations}</strong> compte(s) prestataire(s) en attente d'approbation ou de validation.{' '}
                <a href="/admin/businesses" className="underline font-medium hover:text-orange-800">
                  Voir les comptes →
                </a>
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
                      onClick={() => handleQuickApprove(business.id, business.business_name)}
                      disabled={approvingId === business.id}
                      className="ml-4"
                    >
                      {approvingId === business.id ? 'Approbation...' : 'Approuver'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Business Registration Stats */}
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
