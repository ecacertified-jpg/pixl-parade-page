import { useInactiveUsersStats } from '@/hooks/useInactiveUsersStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Bell, TrendingUp, AlertTriangle } from 'lucide-react';
import { isValidImageUrl } from '@/lib/utils';

export function AdminInactiveUsersTable() {
  const { data, loading, stats, refetch } = useInactiveUsersStats();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">📊 Utilisateurs inactifs & réengagement</CardTitle>
            <CardDescription>
              Suivi des notifications d'inactivité et taux de retour
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<Users className="h-4 w-4" />}
            label="Utilisateurs notifiés"
            value={stats.totalNotified}
            color="text-primary"
          />
          <KpiCard
            icon={<Bell className="h-4 w-4" />}
            label="Tier 1 (7j)"
            value={stats.tier1Count}
            color="text-amber-500"
          />
          <KpiCard
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Tier 2 (14j)"
            value={stats.tier2Count}
            color="text-destructive"
          />
          <KpiCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Taux de retour"
            value={`${stats.returnRate}%`}
            color="text-green-500"
            subtitle={`${stats.returnedCount} revenus`}
          />
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-auto max-h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead className="hidden md:table-cell">Jours inactifs</TableHead>
                <TableHead className="hidden sm:table-cell">Notifications</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden lg:table-cell">Date retour</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun utilisateur inactif notifié
                  </TableCell>
                </TableRow>
              ) : (
                data.map(row => (
                  <TableRow key={row.userId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          {isValidImageUrl(row.avatarUrl) && (
                            <AvatarImage src={row.avatarUrl!} />
                          )}
                          <AvatarFallback className="text-xs">
                            {(row.firstName?.[0] || '') + (row.lastName?.[0] || '')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium truncate max-w-[120px]">
                          {row.firstName} {row.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {row.daysInactive}j
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {row.notificationCount}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.maxTier >= 2 ? 'destructive' : 'secondary'} className="text-xs">
                        Tier {row.maxTier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.hasReturned ? (
                        <Badge className="bg-green-500/15 text-green-600 border-green-500/20 hover:bg-green-500/20">
                          Revenu
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-destructive border-destructive/30">
                          Inactif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {formatDate(row.returnDate)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function KpiCard({ icon, label, value, color, subtitle }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-1">
      <div className={`flex items-center gap-2 text-xs font-medium ${color}`}>
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
    </div>
  );
}
