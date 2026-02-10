import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {countries.map((country) => (
          <Card key={country.code} className="animate-pulse">
            <CardContent className="p-5 flex flex-col items-center text-center gap-2">
              <div className="text-4xl opacity-50">{country.flag}</div>
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-3 bg-muted rounded w-32" />
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
          <Card key={country.code} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/admin/countries/${country.code}`)}>
            <CardContent className="p-5 flex flex-col items-center text-center gap-2">
              <span className="text-4xl">{country.flag}</span>
              <p className="font-semibold text-base">{country.name}</p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{countryStats.users.toLocaleString('fr-FR')} utilisateurs</span>
                <span>·</span>
                <span>{countryStats.businesses} prestataires</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
