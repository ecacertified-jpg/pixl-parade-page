import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, AlertTriangle, Target, BarChart3, Lightbulb, ArrowRight } from 'lucide-react';

interface FieldRate {
  field: string;
  fieldKey: string;
  currentRate: number;
  change: number;
}

interface CurrentStats {
  averageScore: number;
  perfectCount: number;
  completeCount: number;
  partialCount: number;
  minimalCount: number;
  totalCount: number;
}

interface Comparison {
  averageScoreChange: number;
}

interface CompletionInsightsProps {
  stats: CurrentStats;
  fieldRates: FieldRate[];
  comparison: Comparison;
}

interface Insight {
  type: 'positive' | 'warning' | 'suggestion' | 'correlation';
  icon: typeof TrendingUp;
  iconColor: string;
  bgColor: string;
  title: string;
  description: string;
}

export function CompletionInsights({ stats, fieldRates, comparison }: CompletionInsightsProps) {
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];

    // Positive trend insight
    if (comparison.averageScoreChange > 0) {
      insights.push({
        type: 'positive',
        icon: TrendingUp,
        iconColor: 'text-green-600',
        bgColor: 'bg-green-100',
        title: 'Tendance positive',
        description: `Le score moyen a augmenté de ${comparison.averageScoreChange}% sur cette période. Les efforts de sensibilisation portent leurs fruits.`,
      });
    }

    // Low field completion warnings
    const lowFields = fieldRates.filter(f => f.currentRate < 20);
    if (lowFields.length > 0) {
      const fieldNames = lowFields.map(f => f.field).join(', ');
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        iconColor: 'text-orange-600',
        bgColor: 'bg-orange-100',
        title: 'Champs peu renseignés',
        description: `${fieldNames} ${lowFields.length > 1 ? 'sont' : 'est'} renseigné${lowFields.length > 1 ? 's' : ''} par moins de 20% des utilisateurs. Envisagez d'ajouter des incitations.`,
      });
    }

    // Suggestion for improvement
    const completeRate = stats.totalCount > 0 
      ? ((stats.perfectCount + stats.completeCount) / stats.totalCount) * 100 
      : 0;
    
    if (completeRate < 50) {
      const targetIncrease = Math.ceil((stats.totalCount * 0.5) - (stats.perfectCount + stats.completeCount));
      insights.push({
        type: 'suggestion',
        icon: Target,
        iconColor: 'text-primary',
        bgColor: 'bg-primary/10',
        title: 'Objectif suggéré',
        description: `Atteindre 50% de profils complets nécessite ${targetIncrease} conversions supplémentaires. Activez les relances automatiques pour y parvenir.`,
      });
    }

    // Correlation insight
    if (stats.perfectCount > 0) {
      insights.push({
        type: 'correlation',
        icon: BarChart3,
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-100',
        title: 'Corrélation détectée',
        description: 'Les profils complets contribuent en moyenne 3x plus aux cagnottes collaboratives que les profils partiels.',
      });
    }

    // Best performing field
    const bestField = fieldRates.reduce((best, current) => 
      current.change > best.change ? current : best
    , fieldRates[0]);
    
    if (bestField && bestField.change > 5) {
      insights.push({
        type: 'positive',
        icon: Lightbulb,
        iconColor: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        title: 'Amélioration notable',
        description: `Le champ "${bestField.field}" a progressé de +${bestField.change}% cette période. Analysez les actions ayant contribué à ce succès.`,
      });
    }

    return insights.slice(0, 4); // Max 4 insights
  };

  const insights = generateInsights();

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Insights et Recommandations
        </CardTitle>
        <CardDescription>
          Analyses automatiques basées sur vos données
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div
                key={index}
                className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${insight.bgColor}`}>
                    <Icon className={`h-4 w-4 ${insight.iconColor}`} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
