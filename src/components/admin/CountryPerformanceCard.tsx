import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CountryPerformanceData, CountryTrend } from '@/hooks/useCountryPerformance';
import { SparklineChart } from './SparklineChart';
import { TrendingUp, TrendingDown, Minus, ArrowRight, Users, Store, DollarSign, Percent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CountryPerformanceCardProps {
  data: CountryPerformanceData;
  trends?: CountryTrend[];
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
};

const GrowthBadge = ({ rate }: { rate: number }) => {
  if (rate > 10) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
        <TrendingUp className="h-3 w-3 mr-1" />
        +{rate.toFixed(1)}%
      </Badge>
    );
  }
  if (rate > 0) {
    return (
      <Badge variant="default" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
        <TrendingUp className="h-3 w-3 mr-1" />
        +{rate.toFixed(1)}%
      </Badge>
    );
  }
  if (rate < 0) {
    return (
      <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
        <TrendingDown className="h-3 w-3 mr-1" />
        {rate.toFixed(1)}%
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      <Minus className="h-3 w-3 mr-1" />
      0%
    </Badge>
  );
};

export const CountryPerformanceCard = ({ data, trends }: CountryPerformanceCardProps) => {
  const navigate = useNavigate();
  const sparklineData = trends?.map(t => t.users) || [];

  return (
    <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <span className="text-3xl">{data.flag}</span>
            <div>
              <h3 className="text-lg font-bold">{data.countryName}</h3>
              <Badge variant="outline" className="text-xs">
                {data.countryCode}
              </Badge>
            </div>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/countries/${data.countryCode}`)}
            className="text-primary"
          >
            Détails
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* KPIs Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Utilisateurs</span>
            </div>
            <p className="text-xl font-bold">{data.totalUsers.toLocaleString('fr-FR')}</p>
            <p className="text-xs text-muted-foreground">
              +{data.newUsersLast30Days} ce mois
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Store className="h-4 w-4" />
              <span>Entreprises</span>
            </div>
            <p className="text-xl font-bold">{data.totalBusinesses}</p>
            <p className="text-xs text-muted-foreground">
              {data.activeBusinesses} actives
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Revenus</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(data.totalRevenue)} FCFA</p>
            <p className="text-xs text-muted-foreground">
              {data.totalOrders} commandes
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Percent className="h-4 w-4" />
              <span>Conversion</span>
            </div>
            <p className="text-xl font-bold">{data.conversionRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">
              Users → Business
            </p>
          </div>
        </div>

        {/* Sparkline */}
        {sparklineData.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              Croissance utilisateurs (12 mois)
            </p>
            <SparklineChart 
              data={sparklineData} 
              color="hsl(var(--primary))" 
              height={50}
              showArea
            />
          </div>
        )}

        {/* Growth Indicator */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">Croissance revenus</span>
          <GrowthBadge rate={data.revenueGrowthRate} />
        </div>
      </CardContent>
    </Card>
  );
};
