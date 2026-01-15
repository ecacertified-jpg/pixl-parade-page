import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { COUNTRY_FLAGS, COUNTRY_NAMES } from '@/hooks/useCountryMonthlyComparison';
import { cn } from '@/lib/utils';

interface HeatmapData {
  countryCode: string;
  months: {
    month: number;
    achievement: number | null;
    status: 'success' | 'warning' | 'danger' | 'unknown';
  }[];
}

interface CountryComparisonHeatmapProps {
  heatmapData: HeatmapData[];
  loading?: boolean;
  year: number;
}

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const STATUS_COLORS = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  unknown: 'bg-muted',
};

const STATUS_LABELS = {
  success: 'Objectif atteint (≥100%)',
  warning: 'Proche de l\'objectif (70-99%)',
  danger: 'En difficulté (<70%)',
  unknown: 'Pas de données',
};

export function CountryComparisonHeatmap({ heatmapData, loading, year }: CountryComparisonHeatmapProps) {
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

  // Filter to only show countries with data
  const countriesWithData = heatmapData.filter(c => 
    c.months.some(m => m.status !== 'unknown')
  );

  if (countriesWithData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Aucune donnée d'objectif disponible pour cette année
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Heatmap de performance {year}</CardTitle>
        <CardDescription>
          Vue d'ensemble de l'atteinte des objectifs par pays et par mois
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 font-medium text-sm text-muted-foreground sticky left-0 bg-background">
                  Pays
                </th>
                {MONTH_LABELS.map((label, i) => (
                  <th key={i} className="text-center py-2 px-1 font-medium text-xs text-muted-foreground min-w-[40px]">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {countriesWithData.map(country => (
                <tr key={country.countryCode} className="border-t border-muted/50">
                  <td className="py-2 pr-4 sticky left-0 bg-background">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{COUNTRY_FLAGS[country.countryCode]}</span>
                      <span className="font-medium text-sm">{COUNTRY_NAMES[country.countryCode]}</span>
                    </div>
                  </td>
                  {country.months.map((monthData, i) => (
                    <td key={i} className="text-center py-2 px-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'w-8 h-8 rounded-md mx-auto flex items-center justify-center text-white text-xs font-medium cursor-default transition-transform hover:scale-110',
                              STATUS_COLORS[monthData.status]
                            )}
                          >
                            {monthData.achievement !== null ? (
                              monthData.achievement >= 100 ? '✓' : `${Math.round(monthData.achievement)}`
                            ) : '-'}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">
                            {COUNTRY_NAMES[country.countryCode]} - {MONTH_LABELS[i]} {year}
                          </p>
                          {monthData.achievement !== null ? (
                            <p className="text-sm">
                              Atteinte moyenne : {monthData.achievement.toFixed(1)}%
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Pas d'objectif défini
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {STATUS_LABELS[monthData.status]}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-4 border-t">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <div key={status} className="flex items-center gap-2 text-sm">
              <div className={cn('w-4 h-4 rounded', STATUS_COLORS[status as keyof typeof STATUS_COLORS])} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
