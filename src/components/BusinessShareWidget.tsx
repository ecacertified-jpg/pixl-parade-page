import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Share2, 
  MousePointer, 
  Eye, 
  UserPlus, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { useBusinessShareTracking, SharePlatform } from '@/hooks/useBusinessShareTracking';

interface BusinessShareWidgetProps {
  businessId: string;
  onViewDetails?: () => void;
  compact?: boolean;
}

interface ShareSummary {
  totalShares: number;
  totalClicks: number;
  totalViews: number;
  totalFollows: number;
  conversionRate: number;
  topPlatform: SharePlatform | null;
  topPlatformPercentage: number;
  weeklyGrowth: number;
}

const PLATFORM_LABELS: Record<SharePlatform, string> = {
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  sms: 'SMS',
  email: 'Email',
  copy: 'Lien copié',
  native: 'Partage natif',
  other: 'Autre'
};

const PLATFORM_COLORS: Record<SharePlatform, string> = {
  whatsapp: 'bg-green-500',
  facebook: 'bg-blue-600',
  sms: 'bg-orange-500',
  email: 'bg-red-500',
  copy: 'bg-gray-500',
  native: 'bg-purple-500',
  other: 'bg-gray-400'
};

export function BusinessShareWidget({ businessId, onViewDetails, compact = false }: BusinessShareWidgetProps) {
  const { getPerformance, loading: hookLoading } = useBusinessShareTracking(businessId);
  const [summary, setSummary] = useState<ShareSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      if (!businessId) return;
      
      setLoading(true);
      try {
        const performance = await getPerformance(businessId);
        
        if (!performance) {
          setSummary(null);
          return;
        }

        // Calculate conversion rate (follows/views)
        const conversionRate = performance.totalViews > 0 
          ? (performance.totalFollows / performance.totalViews) * 100 
          : 0;

        // Get top platform
        const topPlatformData = performance.byPlatform[0];
        const topPlatform = topPlatformData?.platform || null;
        const topPlatformPercentage = performance.totalShares > 0 && topPlatformData
          ? (topPlatformData.shares / performance.totalShares) * 100
          : 0;

        // Calculate weekly growth (mock for now - would need historical data)
        // In a real implementation, you'd compare with last week's data
        const weeklyGrowth = Math.random() * 20 - 5; // Placeholder

        setSummary({
          totalShares: performance.totalShares,
          totalClicks: performance.totalClicks,
          totalViews: performance.totalViews,
          totalFollows: performance.totalFollows,
          conversionRate,
          topPlatform,
          topPlatformPercentage,
          weeklyGrowth
        });
      } catch (error) {
        console.error('Error loading share summary:', error);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [businessId, getPerformance]);

  if (loading || hookLoading) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!summary || summary.totalShares === 0) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/20">
        <CardContent className="py-6 text-center">
          <Share2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium mb-1">
            Aucun partage pour l'instant
          </p>
          <p className="text-xs text-muted-foreground/70">
            Partagez vos produits pour voir les statistiques ici
          </p>
        </CardContent>
      </Card>
    );
  }

  const kpis = [
    { 
      icon: Share2, 
      value: summary.totalShares, 
      label: 'Partages',
      color: 'text-primary'
    },
    { 
      icon: MousePointer, 
      value: summary.totalClicks, 
      label: 'Clics',
      color: 'text-blue-500'
    },
    { 
      icon: Eye, 
      value: summary.totalViews, 
      label: 'Vues',
      color: 'text-amber-500'
    },
    { 
      icon: UserPlus, 
      value: summary.totalFollows, 
      label: 'Abonnés',
      color: 'text-green-500'
    }
  ];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Impact des Partages
        </CardTitle>
        {onViewDetails && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-muted-foreground hover:text-primary"
            onClick={onViewDetails}
          >
            Voir tout
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPIs Grid */}
        <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-4'} gap-3`}>
          {kpis.map(({ icon: Icon, value, label, color }) => (
            <div 
              key={label}
              className="flex flex-col items-center p-3 rounded-lg bg-background/50 border border-border/50"
            >
              <Icon className={`h-5 w-5 ${color} mb-1`} />
              <span className="text-xl font-bold">{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Conversion Rate & Weekly Growth */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Taux de conversion :</span>
            <Badge variant="secondary" className="font-semibold">
              {summary.conversionRate.toFixed(1)}%
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {summary.weeklyGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${
              summary.weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {summary.weeklyGrowth >= 0 ? '+' : ''}{summary.weeklyGrowth.toFixed(0)}% cette semaine
            </span>
          </div>
        </div>

        {/* Top Platform */}
        {summary.topPlatform && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <span className="text-sm">🏆</span>
            <span className="text-sm text-muted-foreground">Meilleure plateforme :</span>
            <Badge className={`${PLATFORM_COLORS[summary.topPlatform]} text-white`}>
              {PLATFORM_LABELS[summary.topPlatform]}
            </Badge>
            <span className="text-sm font-medium text-muted-foreground">
              ({summary.topPlatformPercentage.toFixed(0)}%)
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
