import { useEffect, useState } from 'react';
import { Share2, MousePointer, Eye, UserPlus, TrendingUp, MessageCircle, Facebook, Smartphone, Mail, Copy, Link2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useBusinessShareTracking, BusinessSharePerformance, SharePlatform } from '@/hooks/useBusinessShareTracking';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BusinessShareAnalyticsProps {
  businessId: string;
  businessName?: string;
}

const platformConfig: Record<SharePlatform, { icon: React.ElementType; label: string; color: string }> = {
  whatsapp: { icon: MessageCircle, label: 'WhatsApp', color: 'bg-green-500' },
  facebook: { icon: Facebook, label: 'Facebook', color: 'bg-blue-600' },
  sms: { icon: Smartphone, label: 'SMS', color: 'bg-purple-500' },
  email: { icon: Mail, label: 'Email', color: 'bg-orange-500' },
  copy: { icon: Copy, label: 'Lien copié', color: 'bg-gray-500' },
  native: { icon: Share2, label: 'Partage natif', color: 'bg-indigo-500' },
  other: { icon: Link2, label: 'Autre', color: 'bg-slate-500' },
};

export function BusinessShareAnalytics({ businessId, businessName }: BusinessShareAnalyticsProps) {
  const { getPerformance, loading } = useBusinessShareTracking();
  const [performance, setPerformance] = useState<BusinessSharePerformance | null>(null);

  useEffect(() => {
    if (businessId) {
      getPerformance(businessId).then(setPerformance);
    }
  }, [businessId, getPerformance]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!performance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Statistiques de partage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune donnée de partage disponible</p>
            <p className="text-sm mt-2">Partagez votre boutique pour voir les statistiques</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxPlatformShares = Math.max(...performance.byPlatform.map(p => p.shares), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Performance des partages
            {businessName && <span className="text-muted-foreground font-normal">• {businessName}</span>}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Share2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{performance.totalShares}</p>
                <p className="text-xs text-muted-foreground">Partages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MousePointer className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{performance.totalClicks}</p>
                <p className="text-xs text-muted-foreground">Clics ({performance.clickRate.toFixed(0)}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Eye className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{performance.totalViews}</p>
                <p className="text-xs text-muted-foreground">Vues page</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <UserPlus className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{performance.totalFollows}</p>
                <p className="text-xs text-muted-foreground">Follows</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance by Platform */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance par plateforme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {performance.byPlatform.map((platform) => {
            const config = platformConfig[platform.platform];
            const Icon = config.icon;
            const percentage = (platform.shares / maxPlatformShares) * 100;
            
            return (
              <div key={platform.platform} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${config.color}`}>
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="font-medium">{config.label}</span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>{platform.shares} partages</span>
                    <span>{platform.clicks} clics</span>
                    <span>{platform.follows} follows</span>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}

          {performance.byPlatform.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              Aucune donnée par plateforme
            </p>
          )}
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Entonnoir de conversion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FunnelStep 
            label="Partages" 
            value={performance.totalShares} 
            percentage={100} 
            color="bg-primary"
          />
          <FunnelStep 
            label="Clics" 
            value={performance.totalClicks} 
            percentage={performance.clickRate} 
            color="bg-blue-500"
          />
          <FunnelStep 
            label="Vues page" 
            value={performance.totalViews} 
            percentage={performance.viewRate} 
            color="bg-amber-500"
          />
          <FunnelStep 
            label="Follows" 
            value={performance.totalFollows} 
            percentage={performance.followRate} 
            color="bg-green-500"
          />
        </CardContent>
      </Card>

      {/* Top Shares */}
      {performance.topShares.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top partages performants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performance.topShares.map((share, index) => {
                const config = platformConfig[share.platform];
                const Icon = config.icon;
                
                return (
                  <div key={share.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-muted-foreground">#{index + 1}</span>
                      <div className={`p-1.5 rounded ${config.color}`}>
                        <Icon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{config.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(share.createdAt), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold">{share.clicks}</p>
                        <p className="text-xs text-muted-foreground">clics</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold">{share.views}</p>
                        <p className="text-xs text-muted-foreground">vues</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-green-600">{share.follows}</p>
                        <p className="text-xs text-muted-foreground">follows</p>
                      </div>
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

interface FunnelStepProps {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

function FunnelStep({ label, value, percentage, color }: FunnelStepProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value} <span className="text-muted-foreground">({percentage.toFixed(0)}%)</span></span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
