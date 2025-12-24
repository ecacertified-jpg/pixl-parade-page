import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Store, UserCheck, TrendingUp, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { UserBusinessStats } from '@/hooks/useUserBusinessStats';

interface UserBusinessStatsSectionProps {
  stats: UserBusinessStats;
  loading: boolean;
}

export function UserBusinessStatsSection({ stats, loading }: UserBusinessStatsSectionProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const clientPercentage = stats.totalUsers > 0 
    ? ((stats.usersWithoutBusiness / stats.totalUsers) * 100) 
    : 0;
  const businessPercentage = stats.totalUsers > 0 
    ? ((stats.usersWithBusiness / stats.totalUsers) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Statistiques Utilisateurs & Comptes Business
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPIs Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Total Utilisateurs</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <UserCheck className="h-4 w-4" />
              <span className="text-xs font-medium">Clients seuls</span>
            </div>
            <p className="text-2xl font-bold">{stats.usersWithoutBusiness}</p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Store className="h-4 w-4" />
              <span className="text-xs font-medium">Avec Business</span>
            </div>
            <p className="text-2xl font-bold">{stats.usersWithBusiness}</p>
            {stats.usersWithMultipleBusinesses > 0 && (
              <p className="text-xs text-muted-foreground">
                dont {stats.usersWithMultipleBusinesses} multi-business
              </p>
            )}
          </div>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 text-primary mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Taux Business</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {stats.conversionRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Distribution Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Répartition des utilisateurs</span>
          </div>
          <div className="h-4 rounded-full overflow-hidden bg-muted flex">
            <div 
              className="bg-secondary h-full transition-all duration-500"
              style={{ width: `${clientPercentage}%` }}
            />
            <div 
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${businessPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary" />
              <span>Clients ({clientPercentage.toFixed(0)}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>Business ({businessPercentage.toFixed(0)}%)</span>
            </div>
          </div>
        </div>

        {/* Recent Trends */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">7 derniers jours</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Nouveaux utilisateurs</span>
                <span className="font-medium text-green-600">+{stats.newUsersLast7Days}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Nouveaux business</span>
                <span className="font-medium text-primary">+{stats.newBusinessLast7Days}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">30 derniers jours</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Nouveaux utilisateurs</span>
                <span className="font-medium text-green-600">+{stats.newUsersLast30Days}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Nouveaux business</span>
                <span className="font-medium text-primary">+{stats.newBusinessLast30Days}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Business Status Summary */}
        <div className="p-4 rounded-lg border bg-card">
          <h4 className="text-sm font-medium mb-3">Statut des comptes business</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-xl font-bold text-green-600">{stats.activeBusinesses}</p>
              <p className="text-xs text-muted-foreground">Actifs</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-orange-500">{stats.pendingBusinesses}</p>
              <p className="text-xs text-muted-foreground">En attente</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary">{stats.verifiedBusinesses}</p>
              <p className="text-xs text-muted-foreground">Vérifiés</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
