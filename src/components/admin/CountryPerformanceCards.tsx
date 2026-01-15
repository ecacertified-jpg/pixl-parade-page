import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminPerformanceData } from '@/hooks/useAdminPerformance';
import { MapPin, Activity, Users } from 'lucide-react';

interface CountryPerformanceCardsProps {
  data: AdminPerformanceData[];
  loading?: boolean;
}

interface CountryStats {
  countryCode: string;
  countryName: string;
  totalActions: number;
  avgResponseTime: number | null;
  activeAdmins: number;
  topAdmin: string | null;
}

const COUNTRY_NAMES: Record<string, string> = {
  CI: 'Côte d\'Ivoire',
  SN: 'Sénégal',
  BJ: 'Bénin',
  ML: 'Mali',
  BF: 'Burkina Faso',
  TG: 'Togo',
  GN: 'Guinée',
  NE: 'Niger',
  CM: 'Cameroun',
  GA: 'Gabon',
};

const formatResponseTime = (minutes: number | null): string => {
  if (minutes === null) return 'N/A';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}min`;
};

export const CountryPerformanceCards = ({ data, loading }: CountryPerformanceCardsProps) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-32"></div>
                <div className="h-4 bg-muted rounded w-28"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Aggregate stats by country
  const countryStatsMap = new Map<string, CountryStats>();

  data.forEach(admin => {
    admin.countryBreakdown.forEach(cb => {
      const existing = countryStatsMap.get(cb.countryCode);
      if (existing) {
        existing.totalActions += cb.actions;
        existing.activeAdmins++;
        if (cb.actions > (data.find(a => a.adminName === existing.topAdmin)?.countryBreakdown.find(c => c.countryCode === cb.countryCode)?.actions || 0)) {
          existing.topAdmin = admin.adminName;
        }
      } else {
        countryStatsMap.set(cb.countryCode, {
          countryCode: cb.countryCode,
          countryName: COUNTRY_NAMES[cb.countryCode] || cb.countryCode,
          totalActions: cb.actions,
          avgResponseTime: cb.avgResponseTime,
          activeAdmins: 1,
          topAdmin: admin.adminName,
        });
      }
    });

    // Also count from assigned countries
    if (admin.assignedCountries) {
      admin.assignedCountries.forEach(countryCode => {
        if (!countryStatsMap.has(countryCode)) {
          countryStatsMap.set(countryCode, {
            countryCode,
            countryName: COUNTRY_NAMES[countryCode] || countryCode,
            totalActions: 0,
            avgResponseTime: null,
            activeAdmins: 1,
            topAdmin: admin.adminName,
          });
        }
      });
    }
  });

  const countryStats = Array.from(countryStatsMap.values())
    .filter(cs => cs.countryCode !== 'unknown')
    .sort((a, b) => b.totalActions - a.totalActions);

  if (countryStats.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
          Aucune donnée par pays disponible
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {countryStats.map((country) => (
        <Card key={country.countryCode} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              <Badge variant="outline" className="text-sm font-bold">
                {country.countryCode}
              </Badge>
              <span className="text-base font-medium text-muted-foreground">
                {country.countryName}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>Actions</span>
              </div>
              <span className="font-bold text-lg">{country.totalActions}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Admins actifs</span>
              </div>
              <span className="font-medium">{country.activeAdmins}</span>
            </div>

            {country.topAdmin && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">Admin le plus actif</p>
                <p className="text-sm font-medium">{country.topAdmin}</p>
              </div>
            )}

            {country.avgResponseTime !== null && (
              <div className="text-xs text-muted-foreground">
                Temps de réponse: {formatResponseTime(country.avgResponseTime)}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
