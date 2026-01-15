import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, AlertTriangle, Trophy, Medal } from 'lucide-react';
import { MonthlyCountryComparison, CountryMonthlyMetrics } from '@/hooks/useCountryMonthlyComparison';
import { formatNumberFr, formatCurrencyXOF } from '@/utils/exportUtils';
import { cn } from '@/lib/utils';

interface MonthlyCountryComparisonTableProps {
  comparisons: MonthlyCountryComparison[];
  currentMonth: MonthlyCountryComparison | null;
  loading?: boolean;
  onMonthChange: (month: number) => void;
  selectedMonth: number;
  year: number;
}

type MetricType = 'users' | 'businesses' | 'revenue' | 'orders' | 'performance';
type SortType = 'rank' | 'value' | 'growth' | 'achievement';

const METRIC_CONFIG: Record<MetricType, { label: string; format: (v: number) => string }> = {
  users: { label: 'Utilisateurs', format: formatNumberFr },
  businesses: { label: 'Entreprises', format: formatNumberFr },
  revenue: { label: 'Revenus', format: formatCurrencyXOF },
  orders: { label: 'Commandes', format: formatNumberFr },
  performance: { label: 'Performance globale', format: (v) => `${v.toFixed(0)}%` },
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
  return <span className="text-muted-foreground text-sm">{rank}</span>;
};

const getVariationBadge = (variation: number | null) => {
  if (variation === null) return <Minus className="h-3 w-3 text-muted-foreground" />;
  if (variation > 0) {
    return (
      <span className="flex items-center gap-1 text-emerald-600 text-xs">
        <TrendingUp className="h-3 w-3" />
        +{variation.toFixed(1)}%
      </span>
    );
  }
  if (variation < 0) {
    return (
      <span className="flex items-center gap-1 text-destructive text-xs">
        <TrendingDown className="h-3 w-3" />
        {variation.toFixed(1)}%
      </span>
    );
  }
  return <span className="text-muted-foreground text-xs">0%</span>;
};

const getAchievementBadge = (achievement: number | null) => {
  if (achievement === null) return <span className="text-muted-foreground">-</span>;
  
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
  if (achievement >= 100) variant = 'default';
  else if (achievement >= 70) variant = 'secondary';
  else variant = 'destructive';
  
  return (
    <Badge variant={variant} className="text-xs">
      {achievement.toFixed(0)}%
    </Badge>
  );
};

export function MonthlyCountryComparisonTable({
  comparisons,
  currentMonth,
  loading,
  onMonthChange,
  selectedMonth,
  year,
}: MonthlyCountryComparisonTableProps) {
  const [metric, setMetric] = useState<MetricType>('performance');
  const [sortBy, setSortBy] = useState<SortType>('rank');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!currentMonth) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Aucune donnée disponible pour cette période
        </CardContent>
      </Card>
    );
  }

  const getSortedCountries = (): CountryMonthlyMetrics[] => {
    const countries = [...currentMonth.countries];
    
    switch (sortBy) {
      case 'rank':
        if (metric === 'performance') return countries.sort((a, b) => a.overallRank - b.overallRank);
        if (metric === 'users') return countries.sort((a, b) => a.usersRank - b.usersRank);
        if (metric === 'businesses') return countries.sort((a, b) => a.businessesRank - b.businessesRank);
        if (metric === 'revenue') return countries.sort((a, b) => a.revenueRank - b.revenueRank);
        if (metric === 'orders') return countries.sort((a, b) => a.ordersRank - b.ordersRank);
        return countries;
      case 'value':
        if (metric === 'performance') return countries.sort((a, b) => b.performanceScore - a.performanceScore);
        return countries.sort((a, b) => (b[metric] as number) - (a[metric] as number));
      case 'growth':
        const variationKey = `${metric}VariationM1` as keyof CountryMonthlyMetrics;
        return countries.sort((a, b) => ((b[variationKey] as number) || 0) - ((a[variationKey] as number) || 0));
      case 'achievement':
        const achievementKey = `${metric}Achievement` as keyof CountryMonthlyMetrics;
        return countries.sort((a, b) => ((b[achievementKey] as number) || 0) - ((a[achievementKey] as number) || 0));
      default:
        return countries;
    }
  };

  const sortedCountries = getSortedCountries();

  const getValue = (country: CountryMonthlyMetrics): number => {
    if (metric === 'performance') return country.performanceScore;
    return country[metric] as number;
  };

  const getVariation = (country: CountryMonthlyMetrics): number | null => {
    if (metric === 'performance') return null;
    const key = `${metric}VariationM1` as keyof CountryMonthlyMetrics;
    return country[key] as number | null;
  };

  const getAchievement = (country: CountryMonthlyMetrics): number | null => {
    if (metric === 'performance') return country.performanceScore;
    const key = `${metric}Achievement` as keyof CountryMonthlyMetrics;
    return country[key] as number | null;
  };

  const getRank = (country: CountryMonthlyMetrics): number => {
    if (metric === 'performance') return country.overallRank;
    if (metric === 'users') return country.usersRank;
    if (metric === 'businesses') return country.businessesRank;
    if (metric === 'revenue') return country.revenueRank;
    if (metric === 'orders') return country.ordersRank;
    return 0;
  };

  const canGoPrev = selectedMonth > 1;
  const canGoNext = selectedMonth < comparisons.length;

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onMonthChange(selectedMonth - 1)}
            disabled={!canGoPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="capitalize">{currentMonth.monthLabel}</CardTitle>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onMonthChange(selectedMonth + 1)}
            disabled={!canGoNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Select value={metric} onValueChange={(v) => setMetric(v as MetricType)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(METRIC_CONFIG).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rank">Par rang</SelectItem>
              <SelectItem value="value">Par valeur</SelectItem>
              <SelectItem value="growth">Par croissance</SelectItem>
              <SelectItem value="achievement">Par atteinte</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rang</TableHead>
              <TableHead>Pays</TableHead>
              <TableHead className="text-right">{METRIC_CONFIG[metric].label}</TableHead>
              {metric !== 'performance' && (
                <>
                  <TableHead className="text-center">Δ M-1</TableHead>
                  <TableHead className="text-center">Objectif</TableHead>
                  <TableHead className="text-center">Atteinte</TableHead>
                </>
              )}
              <TableHead className="text-center">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCountries.map((country) => (
              <TableRow
                key={country.countryCode}
                className={cn(
                  country.isStruggling && country.strugglingSeverity === 'critical' && 'bg-destructive/5',
                  country.isStruggling && country.strugglingSeverity === 'warning' && 'bg-warning/5'
                )}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center justify-center">
                    {getRankIcon(getRank(country))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{country.flag}</span>
                    <span className="font-medium">{country.countryName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {METRIC_CONFIG[metric].format(getValue(country))}
                </TableCell>
                {metric !== 'performance' && (
                  <>
                    <TableCell className="text-center">
                      {getVariationBadge(getVariation(country))}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {country[`${metric}Objective` as keyof CountryMonthlyMetrics] 
                        ? METRIC_CONFIG[metric].format(country[`${metric}Objective` as keyof CountryMonthlyMetrics] as number)
                        : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {getAchievementBadge(getAchievement(country))}
                    </TableCell>
                  </>
                )}
                <TableCell className="text-center">
                  {country.isStruggling ? (
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge 
                          variant={country.strugglingSeverity === 'critical' ? 'destructive' : 'secondary'}
                          className="gap-1"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          En difficulté
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium mb-1">Métriques en difficulté :</p>
                        <ul className="text-xs">
                          {country.strugglingMetrics.map((m, i) => (
                            <li key={i}>• {m}</li>
                          ))}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Badge variant="outline" className="text-emerald-600">
                      Normal
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
