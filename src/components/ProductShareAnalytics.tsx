import { useState, useEffect } from "react";
import { 
  Share2, 
  MousePointerClick, 
  Eye, 
  ShoppingCart, 
  TrendingUp, 
  MessageCircle, 
  Facebook, 
  Smartphone, 
  Mail, 
  Copy,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useProductShareTracking } from "@/hooks/useProductShareTracking";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ProductShareAnalyticsProps {
  productId: string;
  productName?: string;
}

const platformIcons: Record<string, typeof Share2> = {
  whatsapp: MessageCircle,
  facebook: Facebook,
  sms: Smartphone,
  email: Mail,
  native: Share2,
  copy_link: Copy,
};

const platformLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  sms: 'SMS',
  email: 'Email',
  native: 'Natif',
  copy_link: 'Lien copié',
};

const platformColors: Record<string, string> = {
  whatsapp: 'bg-green-500',
  facebook: 'bg-blue-500',
  sms: 'bg-purple-500',
  email: 'bg-orange-500',
  native: 'bg-gray-500',
  copy_link: 'bg-primary',
};

export function ProductShareAnalytics({ productId, productName }: ProductShareAnalyticsProps) {
  const { getPerformance, loading } = useProductShareTracking();
  const [performance, setPerformance] = useState<Awaited<ReturnType<typeof getPerformance>>>(null);

  useEffect(() => {
    if (productId) {
      getPerformance(productId).then(setPerformance);
    }
  }, [productId, getPerformance]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!performance) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Share2 className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">Aucune donnée de partage</p>
        </CardContent>
      </Card>
    );
  }

  const maxPlatformShares = Math.max(...performance.performanceByPlatform.map(p => p.shares), 1);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Performance des partages</h3>
          {productName && (
            <Badge variant="outline" className="ml-2">{productName}</Badge>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Share2 className="h-4 w-4" />
              <span className="text-xs">Partages</span>
            </div>
            <p className="text-2xl font-bold">{performance.totalShares}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MousePointerClick className="h-4 w-4" />
              <span className="text-xs">Clics</span>
            </div>
            <p className="text-2xl font-bold">{performance.totalClicks}</p>
            <p className="text-xs text-muted-foreground">
              {performance.clickRate}% taux de clic
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-xs">Conversions</span>
            </div>
            <p className="text-2xl font-bold">{performance.totalConversions}</p>
            <p className="text-xs text-muted-foreground">
              {performance.conversionRate}% taux conv.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Revenus</span>
            </div>
            <p className="text-2xl font-bold">
              {performance.totalRevenue.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-1">XOF</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance par plateforme */}
      {performance.performanceByPlatform.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Par plateforme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {performance.performanceByPlatform.map((platform) => {
              const Icon = platformIcons[platform.platform] || Share2;
              const percentage = (platform.shares / maxPlatformShares) * 100;
              
              return (
                <div key={platform.platform} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{platformLabels[platform.platform] || platform.platform}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{platform.shares} partages</span>
                      <span>{platform.clicks} clics</span>
                      <Badge 
                        variant={platform.conversionRate > 10 ? "default" : "secondary"} 
                        className="text-xs"
                      >
                        {platform.conversionRate}% conv.
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={percentage} 
                    className={`h-2 ${platformColors[platform.platform] || 'bg-primary'}`}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Entonnoir de conversion */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Entonnoir de conversion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <FunnelStep 
            label="Partages" 
            value={performance.totalShares} 
            maxValue={performance.totalShares}
            percentage={100}
          />
          <FunnelStep 
            label="Clics" 
            value={performance.totalClicks} 
            maxValue={performance.totalShares}
            percentage={performance.totalShares > 0 ? (performance.totalClicks / performance.totalShares) * 100 : 0}
          />
          <FunnelStep 
            label="Vues" 
            value={performance.totalViews} 
            maxValue={performance.totalShares}
            percentage={performance.totalShares > 0 ? (performance.totalViews / performance.totalShares) * 100 : 0}
          />
          <FunnelStep 
            label="Conversions" 
            value={performance.totalConversions} 
            maxValue={performance.totalShares}
            percentage={performance.totalShares > 0 ? (performance.totalConversions / performance.totalShares) * 100 : 0}
          />
        </CardContent>
      </Card>

      {/* Top partages */}
      {performance.topPerformingShares.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top partages performants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {performance.topPerformingShares.map((share, index) => {
                const Icon = platformIcons[share.platform] || Share2;
                return (
                  <div 
                    key={share.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-5">
                        {index + 1}.
                      </span>
                      <Icon className="h-4 w-4" />
                      <div>
                        <p className="text-sm font-medium">
                          {platformLabels[share.platform] || share.platform}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(share.createdAt), 'd MMM', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span>{share.clicks} clics</span>
                      <span>{share.conversions} conv.</span>
                      <Badge variant="secondary">
                        {share.revenue.toLocaleString()} XOF
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Composant pour une étape de l'entonnoir
function FunnelStep({ 
  label, 
  value, 
  maxValue, 
  percentage 
}: { 
  label: string; 
  value: number; 
  maxValue: number; 
  percentage: number;
}) {
  const width = maxValue > 0 ? Math.max((value / maxValue) * 100, 5) : 5;
  
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-24 shrink-0">{label}</span>
      <div className="flex-1">
        <div 
          className="h-6 bg-primary/80 rounded flex items-center justify-end px-2 transition-all"
          style={{ width: `${width}%` }}
        >
          <span className="text-xs text-primary-foreground font-medium">
            {value}
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground w-12 text-right">
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
}
