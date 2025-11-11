import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Heart, TrendingUp, DollarSign } from 'lucide-react';

interface ReciprocityStatsCardsProps {
  globalStats: {
    totalUsersWithScore: number;
    avgGenerosity: number;
    totalContributions: number;
    totalAmountCirculated: number;
    reciprocityRate: number;
  };
}

export function ReciprocityStatsCards({ globalStats }: ReciprocityStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{globalStats.totalUsersWithScore}</div>
          <p className="text-xs text-muted-foreground">
            Utilisateurs avec score de réciprocité
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Score moyen</CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{globalStats.avgGenerosity.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">
            Score de générosité
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taux de réciprocité</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{globalStats.reciprocityRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Retour sur contributions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Montant échangé</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {globalStats.totalAmountCirculated.toLocaleString('fr-FR')} XOF
          </div>
          <p className="text-xs text-muted-foreground">
            {globalStats.totalContributions} contributions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
