import { useStrugglingCountries } from '@/hooks/useStrugglingCountries';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingDown, ExternalLink, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const METRIC_LABELS: Record<string, string> = {
  users: "Utilisateurs",
  businesses: "Entreprises",
  revenue: "Revenus",
  orders: "Commandes",
  users_growth: "Croissance utilisateurs",
};

export function StrugglingCountryLiveBanner() {
  const { countries, criticalCount, warningCount, loading } = useStrugglingCountries();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (loading || countries.length === 0) {
    return null;
  }

  const visibleCountries = countries.filter(c => !dismissed.has(c.id));

  if (visibleCountries.length === 0) {
    return null;
  }

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const handleViewDetails = () => {
    navigate('/admin/countries/comparison');
  };

  return (
    <Alert 
      variant="destructive" 
      className="border-destructive/50 bg-destructive/10"
    >
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="flex items-center gap-2 text-base font-semibold">
        {criticalCount > 0 && (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-destructive text-destructive-foreground">
            {criticalCount} critique{criticalCount > 1 ? 's' : ''}
          </span>
        )}
        {warningCount > 0 && (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-500 text-black">
            {warningCount} en difficulté
          </span>
        )}
        <span className="ml-2">
          {visibleCountries.length} marché{visibleCountries.length > 1 ? 's' : ''} en difficulté
        </span>
      </AlertTitle>
      <AlertDescription className="mt-3">
        <div className="space-y-3">
          {visibleCountries.slice(0, 3).map(country => (
            <div 
              key={country.id}
              className={`p-3 rounded-lg border ${
                country.severity === 'critical' 
                  ? 'bg-destructive/20 border-destructive/30' 
                  : 'bg-yellow-500/10 border-yellow-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-xl">{country.flag}</span>
                    <span>{country.countryName}</span>
                    <span className={`px-1.5 py-0.5 text-[10px] uppercase rounded ${
                      country.severity === 'critical'
                        ? 'bg-destructive text-destructive-foreground'
                        : 'bg-yellow-500 text-black'
                    }`}>
                      {country.severity === 'critical' ? 'Critique' : 'Difficulté'}
                    </span>
                  </div>
                  
                  {country.strugglingSince && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Depuis {formatDistanceToNow(new Date(country.strugglingSince), { 
                        addSuffix: false, 
                        locale: fr 
                      })}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-2">
                    {country.strugglingMetrics.map(metric => {
                      const value = country.metricsDetails[metric];
                      return (
                        <span 
                          key={metric}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-background/50 border"
                        >
                          <TrendingDown className="h-3 w-3 text-destructive" />
                          {METRIC_LABELS[metric] || metric}
                          {value !== undefined && (
                            <span className="font-medium text-destructive">
                              {value.toFixed(0)}%
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => handleDismiss(country.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {visibleCountries.length > 3 && (
            <p className="text-sm text-muted-foreground text-center">
              +{visibleCountries.length - 3} autre{visibleCountries.length - 3 > 1 ? 's' : ''} marché{visibleCountries.length - 3 > 1 ? 's' : ''} en difficulté
            </p>
          )}

          <div className="flex justify-end pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleViewDetails}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Voir les détails
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
