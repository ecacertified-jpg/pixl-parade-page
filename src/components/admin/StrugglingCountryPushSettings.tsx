import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Globe, Bell, TrendingDown } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useState, useEffect } from 'react';

interface StrugglingCountryPushSettingsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  saving?: boolean;
}

export function StrugglingCountryPushSettings({
  enabled,
  onEnabledChange,
  saving = false,
}: StrugglingCountryPushSettingsProps) {
  const [threshold, setThreshold] = useState<'all' | 'critical'>('all');
  const [recoveryAlerts, setRecoveryAlerts] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Alertes marchés en difficulté
        </CardTitle>
        <CardDescription>
          Recevez des notifications lorsqu'un pays passe en mode "en difficulté"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="struggling-alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications push actives
            </Label>
            <p className="text-sm text-muted-foreground">
              Être alerté lorsqu'un marché entre en mode difficulté
            </p>
          </div>
          <Switch
            id="struggling-alerts"
            checked={enabled}
            onCheckedChange={onEnabledChange}
            disabled={saving}
          />
        </div>

        {enabled && (
          <>
            {/* Threshold selection */}
            <div className="space-y-3 pt-4 border-t">
              <Label className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Seuil d'alerte
              </Label>
              <RadioGroup 
                value={threshold} 
                onValueChange={(v) => setThreshold(v as 'all' | 'critical')}
                className="space-y-2"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="all" id="threshold-all" />
                  <Label htmlFor="threshold-all" className="flex-1 cursor-pointer">
                    <span className="font-medium">Warning et Critical</span>
                    <p className="text-sm text-muted-foreground">
                      Alerter pour objectifs &lt; 70% (warning) et &lt; 50% (critical)
                    </p>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="critical" id="threshold-critical" />
                  <Label htmlFor="threshold-critical" className="flex-1 cursor-pointer">
                    <span className="font-medium">Critical uniquement</span>
                    <p className="text-sm text-muted-foreground">
                      Alerter seulement pour objectifs &lt; 50%
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Recovery alerts */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-1">
                <Label htmlFor="recovery-alerts" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Alertes de récupération
                </Label>
                <p className="text-sm text-muted-foreground">
                  Être notifié quand un marché sort du mode difficulté
                </p>
              </div>
              <Switch
                id="recovery-alerts"
                checked={recoveryAlerts}
                onCheckedChange={setRecoveryAlerts}
                disabled={saving}
              />
            </div>
          </>
        )}

        {/* Info box */}
        <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-2">
          <p className="font-medium">Critères de détection :</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li><span className="text-destructive font-medium">Critical</span> : 1 métrique &lt; 50% de l'objectif</li>
            <li><span className="text-yellow-600 font-medium">Warning</span> : 2+ métriques &lt; 70% de l'objectif</li>
            <li><span className="text-yellow-600 font-medium">Warning</span> : Croissance &lt; -10% sur 2+ métriques</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
