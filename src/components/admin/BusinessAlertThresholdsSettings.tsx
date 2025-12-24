import { TrendingDown, ShoppingCart, Clock, Star, BarChart3, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusinessAlertThresholds, BusinessAlertThreshold } from '@/hooks/useBusinessAlertThresholds';
import { Badge } from '@/components/ui/badge';

const metricIcons: Record<string, typeof TrendingDown> = {
  revenue: TrendingDown,
  orders: ShoppingCart,
  inactivity: Clock,
  rating: Star,
  conversion_rate: BarChart3,
};

const metricLabels: Record<string, string> = {
  revenue: 'Revenus',
  orders: 'Commandes',
  inactivity: 'Inactivité',
  rating: 'Note moyenne',
  conversion_rate: 'Taux de conversion',
};

const thresholdTypeLabels: Record<string, string> = {
  percentage_drop: 'Baisse en %',
  absolute_drop: 'Baisse absolue',
  inactivity_days: 'Jours d\'inactivité',
};

const periodLabels: Record<string, string> = {
  day: 'Jour',
  week: 'Semaine',
  month: 'Mois',
  quarter: 'Trimestre',
};

export function BusinessAlertThresholdsSettings() {
  const { thresholds, loading, updating, updateThreshold, toggleActive } = useBusinessAlertThresholds();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Seuils d'alerte performance business</h3>
        <p className="text-sm text-muted-foreground">
          Configurez les seuils qui déclenchent des alertes automatiques lorsqu'un business présente des baisses de performance significatives.
        </p>
      </div>

      <div className="grid gap-4">
        {thresholds.map((threshold) => (
          <ThresholdCard
            key={threshold.id}
            threshold={threshold}
            updating={updating}
            onUpdate={(updates) => updateThreshold(threshold.id, updates)}
            onToggleActive={(active) => toggleActive(threshold.id, active)}
          />
        ))}
      </div>
    </div>
  );
}

function ThresholdCard({
  threshold,
  updating,
  onUpdate,
  onToggleActive,
}: {
  threshold: BusinessAlertThreshold;
  updating: boolean;
  onUpdate: (updates: Partial<BusinessAlertThreshold>) => void;
  onToggleActive: (active: boolean) => void;
}) {
  const Icon = metricIcons[threshold.metric_type] || TrendingDown;
  const isInactivity = threshold.metric_type === 'inactivity';
  const isRating = threshold.metric_type === 'rating';

  return (
    <Card className={!threshold.is_active ? 'opacity-60' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {metricLabels[threshold.metric_type]}
                <Badge variant="outline" className="text-xs font-normal">
                  {thresholdTypeLabels[threshold.threshold_type]}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {threshold.description}
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={threshold.is_active}
            onCheckedChange={onToggleActive}
            disabled={updating}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Warning threshold */}
          <div className="space-y-2">
            <Label className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              Seuil Warning
            </Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={threshold.warning_threshold}
                onChange={(e) => onUpdate({ warning_threshold: parseFloat(e.target.value) || 0 })}
                className="h-8 text-sm"
                disabled={updating || !threshold.is_active}
              />
              <span className="text-xs text-muted-foreground">
                {isInactivity ? 'jours' : isRating ? 'pts' : '%'}
              </span>
            </div>
          </div>

          {/* Critical threshold */}
          <div className="space-y-2">
            <Label className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              Seuil Critique
            </Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={threshold.critical_threshold}
                onChange={(e) => onUpdate({ critical_threshold: parseFloat(e.target.value) || 0 })}
                className="h-8 text-sm"
                disabled={updating || !threshold.is_active}
              />
              <span className="text-xs text-muted-foreground">
                {isInactivity ? 'jours' : isRating ? 'pts' : '%'}
              </span>
            </div>
          </div>

          {/* Comparison period */}
          <div className="space-y-2">
            <Label className="text-xs">Période de comparaison</Label>
            <Select
              value={threshold.comparison_period}
              onValueChange={(value) => onUpdate({ comparison_period: value as any })}
              disabled={updating || !threshold.is_active}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(periodLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notifications */}
          <div className="space-y-2">
            <Label className="text-xs">Notifications</Label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-xs">
                <Switch
                  checked={threshold.notify_admin}
                  onCheckedChange={(checked) => onUpdate({ notify_admin: checked })}
                  disabled={updating || !threshold.is_active}
                  className="scale-75"
                />
                Admin
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Switch
                  checked={threshold.notify_business}
                  onCheckedChange={(checked) => onUpdate({ notify_business: checked })}
                  disabled={updating || !threshold.is_active}
                  className="scale-75"
                />
                Business
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
