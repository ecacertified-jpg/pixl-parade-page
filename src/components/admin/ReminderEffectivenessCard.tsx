import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mail, Users, TrendingUp, ArrowRight } from 'lucide-react';

interface ReminderStats {
  totalSent: number;
  uniqueUsers: number;
  conversions: number;
  conversionRate: number;
  avgCompletionBefore: number;
  avgCompletionAfter: number;
}

interface ReminderEffectivenessCardProps {
  stats: ReminderStats | null;
}

export function ReminderEffectivenessCard({ stats }: ReminderEffectivenessCardProps) {
  if (!stats || stats.totalSent === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Efficacité des relances
          </CardTitle>
          <CardDescription>Analysez l'impact des relances automatiques</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
          <Mail className="h-8 w-8 mb-2 opacity-50" />
          <p>Aucune relance envoyée sur cette période</p>
          <p className="text-xs mt-1">Activez les relances automatiques dans les paramètres</p>
        </CardContent>
      </Card>
    );
  }

  const completionGain = stats.avgCompletionAfter - stats.avgCompletionBefore;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Efficacité des relances
        </CardTitle>
        <CardDescription>Impact des relances automatiques sur la complétion</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">{stats.totalSent}</div>
            <div className="text-xs text-muted-foreground">Relances envoyées</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">{stats.uniqueUsers}</div>
            <div className="text-xs text-muted-foreground">Utilisateurs ciblés</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-green-600">{stats.conversionRate}%</div>
            <div className="text-xs text-muted-foreground">Taux de conversion</div>
          </div>
        </div>

        {/* Before/After comparison */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Évolution après relance
          </h4>
          
          <div className="flex items-center gap-4 p-4 rounded-lg border">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Avant relance</div>
              <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-orange-500 rounded-full"
                  style={{ width: `${stats.avgCompletionBefore}%` }}
                />
              </div>
              <div className="text-sm font-medium mt-1">{stats.avgCompletionBefore}%</div>
            </div>
            
            <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Après relance</div>
              <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                  style={{ width: `${stats.avgCompletionAfter}%` }}
                />
              </div>
              <div className="text-sm font-medium mt-1">{stats.avgCompletionAfter}%</div>
            </div>
          </div>

          {completionGain > 0 && (
            <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-green-100 text-green-700">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">
                Gain moyen : +{completionGain}% de complétion
              </span>
            </div>
          )}
        </div>

        {/* Conversions detail */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Profils améliorés après relance</span>
            <span className="font-medium">{stats.conversions} sur {stats.uniqueUsers}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
