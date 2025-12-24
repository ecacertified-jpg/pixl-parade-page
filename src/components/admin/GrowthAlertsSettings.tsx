import { useState } from 'react';
import { useGrowthThresholds, GrowthThreshold } from '@/hooks/useGrowthThresholds';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Target, TrendingUp, Flame, Bell } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const metricLabels: Record<string, string> = {
  users: 'Utilisateurs',
  businesses: 'Entreprises',
  revenue: 'Revenus',
  orders: 'Commandes',
};

const thresholdTypeLabels: Record<string, string> = {
  absolute: 'Valeur absolue (milestone)',
  percentage: 'Pourcentage de croissance',
  daily_count: 'Compte quotidien',
};

const thresholdTypeIcons: Record<string, React.ReactNode> = {
  absolute: <Target className="h-4 w-4" />,
  percentage: <TrendingUp className="h-4 w-4" />,
  daily_count: <Flame className="h-4 w-4" />,
};

const periodLabels: Record<string, string> = {
  day: 'Quotidien',
  week: 'Hebdomadaire',
  month: 'Mensuel',
};

export function GrowthAlertsSettings() {
  const { thresholds, loading, saving, toggleThreshold, createThreshold, deleteThreshold } = useGrowthThresholds();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newThreshold, setNewThreshold] = useState({
    metric_type: 'users' as 'users' | 'businesses' | 'revenue' | 'orders',
    threshold_type: 'absolute' as 'absolute' | 'percentage' | 'daily_count',
    threshold_value: 100,
    comparison_period: 'week' as 'day' | 'week' | 'month',
    is_active: true,
    notify_methods: ['in_app'],
  });

  const handleCreate = async () => {
    await createThreshold(newThreshold);
    setIsDialogOpen(false);
    setNewThreshold({
      metric_type: 'users',
      threshold_type: 'absolute',
      threshold_value: 100,
      comparison_period: 'week',
      is_active: true,
      notify_methods: ['in_app'],
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Group thresholds by type
  const milestones = thresholds.filter(t => t.threshold_type === 'absolute');
  const growthThresholds = thresholds.filter(t => t.threshold_type === 'percentage');
  const dailyThresholds = thresholds.filter(t => t.threshold_type === 'daily_count');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertes de croissance
            </CardTitle>
            <CardDescription>
              Configurez les seuils pour recevoir des alertes automatiques
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau seuil
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un seuil d'alerte</DialogTitle>
                <DialogDescription>
                  Créez un nouveau seuil pour recevoir des alertes automatiques
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Métrique</Label>
                  <Select
                    value={newThreshold.metric_type}
                    onValueChange={(value: any) => setNewThreshold({ ...newThreshold, metric_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="users">Utilisateurs</SelectItem>
                      <SelectItem value="businesses">Entreprises</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type de seuil</Label>
                  <Select
                    value={newThreshold.threshold_type}
                    onValueChange={(value: any) => setNewThreshold({ ...newThreshold, threshold_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="absolute">Milestone (valeur absolue)</SelectItem>
                      <SelectItem value="percentage">Croissance (%)</SelectItem>
                      <SelectItem value="daily_count">Compte quotidien</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Valeur du seuil
                    {newThreshold.threshold_type === 'percentage' && ' (%)'}
                  </Label>
                  <Input
                    type="number"
                    value={newThreshold.threshold_value}
                    onChange={(e) => setNewThreshold({ ...newThreshold, threshold_value: Number(e.target.value) })}
                    min="1"
                  />
                </div>
                {newThreshold.threshold_type === 'percentage' && (
                  <div className="space-y-2">
                    <Label>Période de comparaison</Label>
                    <Select
                      value={newThreshold.comparison_period}
                      onValueChange={(value: any) => setNewThreshold({ ...newThreshold, comparison_period: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Quotidien</SelectItem>
                        <SelectItem value="week">Hebdomadaire</SelectItem>
                        <SelectItem value="month">Mensuel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreate} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Milestones */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-green-600" />
            Milestones (valeurs absolues)
          </h4>
          <div className="space-y-2">
            {milestones.map((threshold) => (
              <ThresholdRow
                key={threshold.id}
                threshold={threshold}
                onToggle={toggleThreshold}
                onDelete={deleteThreshold}
                saving={saving}
              />
            ))}
            {milestones.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun milestone configuré</p>
            )}
          </div>
        </div>

        {/* Growth thresholds */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            Alertes de croissance (%)
          </h4>
          <div className="space-y-2">
            {growthThresholds.map((threshold) => (
              <ThresholdRow
                key={threshold.id}
                threshold={threshold}
                onToggle={toggleThreshold}
                onDelete={deleteThreshold}
                saving={saving}
              />
            ))}
            {growthThresholds.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun seuil de croissance configuré</p>
            )}
          </div>
        </div>

        {/* Daily thresholds */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-600" />
            Records quotidiens
          </h4>
          <div className="space-y-2">
            {dailyThresholds.map((threshold) => (
              <ThresholdRow
                key={threshold.id}
                threshold={threshold}
                onToggle={toggleThreshold}
                onDelete={deleteThreshold}
                saving={saving}
              />
            ))}
            {dailyThresholds.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun seuil quotidien configuré</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ThresholdRow({
  threshold,
  onToggle,
  onDelete,
  saving,
}: {
  threshold: GrowthThreshold;
  onToggle: (id: string, isActive: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  saving: boolean;
}) {
  const getDescription = () => {
    const thresholdType = threshold.threshold_type as string;
    if (thresholdType === 'absolute') {
      return `Atteindre ${threshold.threshold_value} ${metricLabels[threshold.metric_type].toLowerCase()}`;
    }
    if (thresholdType === 'percentage') {
      return `+${threshold.threshold_value}% ${metricLabels[threshold.metric_type].toLowerCase()} (${periodLabels[threshold.comparison_period].toLowerCase()})`;
    }
    if (thresholdType === 'daily_count') {
      return `${threshold.threshold_value}+ ${metricLabels[threshold.metric_type].toLowerCase()} par jour`;
    }
    return `${threshold.threshold_value}`;
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
      <div className="flex items-center gap-3">
        <Switch
          checked={threshold.is_active}
          onCheckedChange={(checked) => onToggle(threshold.id, checked)}
          disabled={saving}
        />
        <div>
          <p className="text-sm font-medium">{getDescription()}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {metricLabels[threshold.metric_type]}
            </Badge>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={() => onDelete(threshold.id)}
        disabled={saving}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
