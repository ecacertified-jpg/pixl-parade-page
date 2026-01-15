import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AdminPerformanceData } from '@/hooks/useAdminPerformance';
import { cn } from '@/lib/utils';
import { Trophy, Medal, Award } from 'lucide-react';

interface AdminPerformanceTableProps {
  data: AdminPerformanceData[];
  loading?: boolean;
}

const formatResponseTime = (minutes: number | null): string => {
  if (minutes === null) return 'N/A';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}min`;
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
};

const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
  if (score >= 80) return 'default';
  if (score >= 50) return 'secondary';
  return 'destructive';
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-700" />;
    default:
      return <span className="text-muted-foreground font-medium">{rank}</span>;
  }
};

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'super_admin':
      return <Badge variant="default">Super Admin</Badge>;
    case 'regional_admin':
      return <Badge className="bg-blue-500 hover:bg-blue-600">Admin Régional</Badge>;
    case 'moderator':
      return <Badge variant="secondary">Modérateur</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
};

export const AdminPerformanceTable = ({ data, loading }: AdminPerformanceTableProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune donnée de performance disponible.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">Rang</TableHead>
            <TableHead>Administrateur</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead className="hidden md:table-cell">Pays</TableHead>
            <TableHead className="text-right">Actions</TableHead>
            <TableHead className="text-right hidden sm:table-cell">Temps moy.</TableHead>
            <TableHead className="text-right hidden lg:table-cell">Notifs traitées</TableHead>
            <TableHead className="text-right">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((admin, index) => (
            <TableRow key={admin.adminId}>
              <TableCell className="text-center">
                <div className="flex items-center justify-center">
                  {getRankIcon(index + 1)}
                </div>
              </TableCell>
              <TableCell className="font-medium">{admin.adminName}</TableCell>
              <TableCell>{getRoleBadge(admin.role)}</TableCell>
              <TableCell className="hidden md:table-cell">
                {admin.assignedCountries?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {admin.assignedCountries.slice(0, 3).map(c => (
                      <Badge key={c} variant="outline" className="text-xs">
                        {c}
                      </Badge>
                    ))}
                    {admin.assignedCountries.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{admin.assignedCountries.length - 3}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">Tous</span>
                )}
              </TableCell>
              <TableCell className="text-right font-medium">
                {admin.totalActions}
              </TableCell>
              <TableCell className="text-right hidden sm:table-cell">
                <span className={cn(
                  admin.avgResponseTimeMinutes !== null && admin.avgResponseTimeMinutes < 120
                    ? 'text-green-600'
                    : admin.avgResponseTimeMinutes !== null && admin.avgResponseTimeMinutes < 360
                    ? 'text-yellow-600'
                    : admin.avgResponseTimeMinutes !== null
                    ? 'text-red-600'
                    : 'text-muted-foreground'
                )}>
                  {formatResponseTime(admin.avgResponseTimeMinutes)}
                </span>
              </TableCell>
              <TableCell className="text-right hidden lg:table-cell">
                {admin.notificationsProcessed}
              </TableCell>
              <TableCell className="text-right">
                <Badge variant={getScoreBadgeVariant(admin.performanceScore)}>
                  {admin.performanceScore}%
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
