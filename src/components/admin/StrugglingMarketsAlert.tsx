import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowRight, TrendingDown, Target } from 'lucide-react';
import { MonthlyCountryComparison, COUNTRY_FLAGS, COUNTRY_NAMES } from '@/hooks/useCountryMonthlyComparison';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface StrugglingMarketsAlertProps {
  currentMonth: MonthlyCountryComparison | null;
  loading?: boolean;
}

export function StrugglingMarketsAlert({ currentMonth, loading }: StrugglingMarketsAlertProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="py-6">
          <div className="h-16 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!currentMonth) return null;

  const strugglingCountries = currentMonth.countries.filter(c => c.isStruggling);

  if (strugglingCountries.length === 0) {
    return null;
  }

  const criticalCount = strugglingCountries.filter(c => c.strugglingSeverity === 'critical').length;
  const warningCount = strugglingCountries.filter(c => c.strugglingSeverity === 'warning').length;

  return (
    <Card className={cn(
      'border-l-4',
      criticalCount > 0 ? 'border-l-destructive bg-destructive/5' : 'border-l-warning bg-warning/5'
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className={cn(
              'h-5 w-5',
              criticalCount > 0 ? 'text-destructive' : 'text-warning'
            )} />
            {strugglingCountries.length} marché{strugglingCountries.length > 1 ? 's' : ''} en difficulté
          </CardTitle>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive">{criticalCount} critique{criticalCount > 1 ? 's' : ''}</Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="secondary">{warningCount} attention</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {strugglingCountries
          .sort((a, b) => {
            if (a.strugglingSeverity === 'critical' && b.strugglingSeverity !== 'critical') return -1;
            if (b.strugglingSeverity === 'critical' && a.strugglingSeverity !== 'critical') return 1;
            return b.strugglingMetrics.length - a.strugglingMetrics.length;
          })
          .map(country => (
            <div 
              key={country.countryCode}
              className={cn(
                'p-3 rounded-lg',
                country.strugglingSeverity === 'critical' ? 'bg-destructive/10' : 'bg-warning/10'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{COUNTRY_FLAGS[country.countryCode]}</span>
                  <span className="font-semibold">{COUNTRY_NAMES[country.countryCode]}</span>
                  <Badge 
                    variant={country.strugglingSeverity === 'critical' ? 'destructive' : 'outline'}
                    className="text-xs"
                  >
                    {country.strugglingSeverity === 'critical' ? 'Critique' : 'Attention'}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/admin/countries/${country.countryCode}`)}
                >
                  Détails <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {country.strugglingMetrics.map((metric, i) => {
                  const isGrowth = metric.includes('croissance');
                  return (
                    <div 
                      key={i}
                      className="flex items-center gap-2 text-muted-foreground"
                    >
                      {isGrowth ? (
                        <TrendingDown className="h-3 w-3 text-destructive" />
                      ) : (
                        <Target className="h-3 w-3 text-destructive" />
                      )}
                      <span>{metric}</span>
                      {!isGrowth && (
                        <>
                          {metric === 'Utilisateurs' && country.usersAchievement !== null && (
                            <Badge variant="destructive" className="text-xs ml-auto">
                              {country.usersAchievement.toFixed(0)}%
                            </Badge>
                          )}
                          {metric === 'Entreprises' && country.businessesAchievement !== null && (
                            <Badge variant="destructive" className="text-xs ml-auto">
                              {country.businessesAchievement.toFixed(0)}%
                            </Badge>
                          )}
                          {metric === 'Revenus' && country.revenueAchievement !== null && (
                            <Badge variant="destructive" className="text-xs ml-auto">
                              {country.revenueAchievement.toFixed(0)}%
                            </Badge>
                          )}
                          {metric === 'Commandes' && country.ordersAchievement !== null && (
                            <Badge variant="destructive" className="text-xs ml-auto">
                              {country.ordersAchievement.toFixed(0)}%
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/countries/objectives')}
          >
            Gérer les objectifs
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/alerts')}
          >
            Voir toutes les alertes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
