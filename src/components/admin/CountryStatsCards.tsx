import { Card, CardContent } from '@/components/ui/card';
import { getAllCountries } from '@/config/countries';

interface CountryStats {
  [code: string]: {
    users: number;
    businesses: number;
  };
}

interface CountryStatsCardsProps {
  stats: CountryStats;
  loading?: boolean;
}

export function CountryStatsCards({ stats, loading }: CountryStatsCardsProps) {
  const countries = getAllCountries();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {countries.map((country) => (
          <Card key={country.code} className="animate-pulse">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="text-4xl opacity-50">{country.flag}</div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-20" />
                <div className="h-3 bg-muted rounded w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {countries.map((country) => {
        const countryStats = stats[country.code] || { users: 0, businesses: 0 };
        
        return (
          <Card key={country.code} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="text-4xl">{country.flag}</div>
              <div>
                <p className="font-semibold text-lg">{country.name}</p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{countryStats.users.toLocaleString('fr-FR')} utilisateurs</span>
                  <span>•</span>
                  <span>{countryStats.businesses} prestataires</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
