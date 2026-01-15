import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ObjectiveProgressBar } from './ObjectiveProgressBar';
import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountryObjectivesSummaryProps {
  countryCode: string;
  countryName: string;
  flag: string;
  month: number;
  year: number;
  metrics: {
    users: { actual: number; target: number };
    businesses: { actual: number; target: number };
    revenue: { actual: number; target: number };
    orders: { actual: number; target: number };
  };
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function CountryObjectivesSummary({
  countryCode,
  countryName,
  flag,
  month,
  year,
  metrics
}: CountryObjectivesSummaryProps) {
  const calculateOverallScore = () => {
    const scores: number[] = [];
    
    Object.values(metrics).forEach(({ actual, target }) => {
      if (target > 0) {
        scores.push((actual / target) * 100);
      }
    });
    
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const overallScore = calculateOverallScore();

  const getScoreColor = (score: number) => {
    if (score >= 100) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 100) return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (score >= 70) return <Minus className="h-5 w-5 text-yellow-500" />;
    return <TrendingDown className="h-5 w-5 text-red-500" />;
  };

  const hasAnyObjective = Object.values(metrics).some(m => m.target > 0);

  if (!hasAnyObjective) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="text-2xl">{flag}</span>
            <span>{countryName}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Target className="h-5 w-5 mr-2" />
            <span>Aucun objectif défini pour {MONTH_NAMES[month - 1]} {year}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="text-2xl">{flag}</span>
            <span>{countryName}</span>
            <span className="text-sm font-normal text-muted-foreground">
              - {MONTH_NAMES[month - 1]} {year}
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {getScoreIcon(overallScore)}
            <span className={cn('text-2xl font-bold', getScoreColor(overallScore))}>
              {overallScore}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.users.target > 0 && (
          <ObjectiveProgressBar
            label="Utilisateurs"
            actual={metrics.users.actual}
            target={metrics.users.target}
            format="number"
          />
        )}
        
        {metrics.businesses.target > 0 && (
          <ObjectiveProgressBar
            label="Entreprises"
            actual={metrics.businesses.actual}
            target={metrics.businesses.target}
            format="number"
          />
        )}
        
        {metrics.revenue.target > 0 && (
          <ObjectiveProgressBar
            label="Revenus (FCFA)"
            actual={metrics.revenue.actual}
            target={metrics.revenue.target}
            format="currency"
          />
        )}
        
        {metrics.orders.target > 0 && (
          <ObjectiveProgressBar
            label="Commandes"
            actual={metrics.orders.actual}
            target={metrics.orders.target}
            format="number"
          />
        )}
      </CardContent>
    </Card>
  );
}
