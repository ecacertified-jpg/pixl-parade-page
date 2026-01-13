import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Loader2, Mail, Bell, MessageSquare, Clock, Save, AlertTriangle, Users, Store, ShoppingCart, RefreshCcw, Shield, TrendingUp, BarChart3 } from 'lucide-react';
import { useAdminNotificationPreferences, AdminNotificationPreferences } from '@/hooks/useAdminNotificationPreferences';

interface AlertToggleProps {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function AlertToggle({ id, label, description, icon, checked, onCheckedChange }: AlertToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
        <div className="space-y-0.5">
          <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
            {label}
          </Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function AdminNotificationPreferencesSettings() {
  const { preferences, loading, saving, updatePreferences } = useAdminNotificationPreferences();
  const [localPrefs, setLocalPrefs] = useState<Partial<AdminNotificationPreferences>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        email_enabled: preferences.email_enabled,
        push_enabled: preferences.push_enabled,
        in_app_enabled: preferences.in_app_enabled,
        client_deletion_alerts: preferences.client_deletion_alerts,
        new_client_alerts: preferences.new_client_alerts,
        new_business_alerts: preferences.new_business_alerts,
        new_order_alerts: preferences.new_order_alerts,
        refund_request_alerts: preferences.refund_request_alerts,
        critical_moderation_alerts: preferences.critical_moderation_alerts,
        performance_alerts: preferences.performance_alerts,
        growth_alerts: preferences.growth_alerts,
        daily_digest: preferences.daily_digest,
        quiet_hours_enabled: preferences.quiet_hours_enabled,
        quiet_hours_start: preferences.quiet_hours_start,
        quiet_hours_end: preferences.quiet_hours_end,
      });
      setHasChanges(false);
    }
  }, [preferences]);

  const handleChange = <K extends keyof AdminNotificationPreferences>(
    key: K,
    value: AdminNotificationPreferences[K]
  ) => {
    setLocalPrefs(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const success = await updatePreferences(localPrefs);
    if (success) {
      setHasChanges(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Vous devez être administrateur pour accéder aux préférences de notification.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Canaux de notification
          </CardTitle>
          <CardDescription>
            Choisissez comment vous souhaitez recevoir vos notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <Label htmlFor="email_enabled" className="font-medium cursor-pointer">Email</Label>
                  <p className="text-xs text-muted-foreground">Notifications par email</p>
                </div>
              </div>
              <Switch
                id="email_enabled"
                checked={localPrefs.email_enabled ?? true}
                onCheckedChange={(checked) => handleChange('email_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <Label htmlFor="push_enabled" className="font-medium cursor-pointer">Push</Label>
                  <p className="text-xs text-muted-foreground">Notifications push</p>
                </div>
              </div>
              <Switch
                id="push_enabled"
                checked={localPrefs.push_enabled ?? true}
                onCheckedChange={(checked) => handleChange('push_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <Label htmlFor="in_app_enabled" className="font-medium cursor-pointer">In-app</Label>
                  <p className="text-xs text-muted-foreground">Dans l'application</p>
                </div>
              </div>
              <Switch
                id="in_app_enabled"
                checked={localPrefs.in_app_enabled ?? true}
                onCheckedChange={(checked) => handleChange('in_app_enabled', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5" />
            Types d'alertes
          </CardTitle>
          <CardDescription>
            Sélectionnez les types de notifications que vous souhaitez recevoir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            <AlertToggle
              id="new_client_alerts"
              label="Nouveaux clients"
              description="Notification lors de l'inscription d'un nouveau client"
              icon={<Users className="h-4 w-4" />}
              checked={localPrefs.new_client_alerts ?? true}
              onCheckedChange={(checked) => handleChange('new_client_alerts', checked)}
            />
            <AlertToggle
              id="client_deletion_alerts"
              label="Suppressions de clients"
              description="Notification lors de la suppression d'un compte client"
              icon={<Users className="h-4 w-4" />}
              checked={localPrefs.client_deletion_alerts ?? true}
              onCheckedChange={(checked) => handleChange('client_deletion_alerts', checked)}
            />
            <AlertToggle
              id="new_business_alerts"
              label="Nouveaux prestataires"
              description="Notification lors de la création d'un nouveau compte prestataire"
              icon={<Store className="h-4 w-4" />}
              checked={localPrefs.new_business_alerts ?? true}
              onCheckedChange={(checked) => handleChange('new_business_alerts', checked)}
            />
            <AlertToggle
              id="new_order_alerts"
              label="Nouvelles commandes"
              description="Notification lors d'une nouvelle commande"
              icon={<ShoppingCart className="h-4 w-4" />}
              checked={localPrefs.new_order_alerts ?? true}
              onCheckedChange={(checked) => handleChange('new_order_alerts', checked)}
            />
            <AlertToggle
              id="refund_request_alerts"
              label="Demandes de remboursement"
              description="Notification lors d'une demande de remboursement"
              icon={<RefreshCcw className="h-4 w-4" />}
              checked={localPrefs.refund_request_alerts ?? true}
              onCheckedChange={(checked) => handleChange('refund_request_alerts', checked)}
            />
            <AlertToggle
              id="critical_moderation_alerts"
              label="Actions critiques de modération"
              description="Signalements de contenu, suspensions automatiques, etc."
              icon={<Shield className="h-4 w-4" />}
              checked={localPrefs.critical_moderation_alerts ?? true}
              onCheckedChange={(checked) => handleChange('critical_moderation_alerts', checked)}
            />
            <AlertToggle
              id="performance_alerts"
              label="Alertes de performance"
              description="Alertes sur les performances des prestataires"
              icon={<TrendingUp className="h-4 w-4" />}
              checked={localPrefs.performance_alerts ?? true}
              onCheckedChange={(checked) => handleChange('performance_alerts', checked)}
            />
            <AlertToggle
              id="growth_alerts"
              label="Alertes de croissance"
              description="Alertes sur les métriques de croissance de la plateforme"
              icon={<BarChart3 className="h-4 w-4" />}
              checked={localPrefs.growth_alerts ?? true}
              onCheckedChange={(checked) => handleChange('growth_alerts', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Options avancées
          </CardTitle>
          <CardDescription>
            Configurez le mode digest et les heures calmes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Daily Digest */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="daily_digest" className="font-medium cursor-pointer">
                Mode digest quotidien
              </Label>
              <p className="text-sm text-muted-foreground">
                Recevoir un résumé quotidien au lieu de notifications individuelles pour les alertes non-critiques
              </p>
            </div>
            <Switch
              id="daily_digest"
              checked={localPrefs.daily_digest ?? false}
              onCheckedChange={(checked) => handleChange('daily_digest', checked)}
            />
          </div>

          <Separator />

          {/* Quiet Hours */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="quiet_hours_enabled" className="font-medium cursor-pointer">
                  Heures calmes
                </Label>
                <p className="text-sm text-muted-foreground">
                  Suspendre les notifications push et email pendant ces heures (les in-app restent actives)
                </p>
              </div>
              <Switch
                id="quiet_hours_enabled"
                checked={localPrefs.quiet_hours_enabled ?? false}
                onCheckedChange={(checked) => handleChange('quiet_hours_enabled', checked)}
              />
            </div>

            {localPrefs.quiet_hours_enabled && (
              <div className="grid gap-4 sm:grid-cols-2 pl-4 border-l-2 border-primary/20">
                <div className="space-y-2">
                  <Label htmlFor="quiet_hours_start">Début</Label>
                  <Input
                    id="quiet_hours_start"
                    type="time"
                    value={localPrefs.quiet_hours_start ?? '22:00'}
                    onChange={(e) => handleChange('quiet_hours_start', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet_hours_end">Fin</Label>
                  <Input
                    id="quiet_hours_end"
                    type="time"
                    value={localPrefs.quiet_hours_end ?? '08:00'}
                    onChange={(e) => handleChange('quiet_hours_end', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !hasChanges} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Enregistrer les préférences
        </Button>
      </div>
    </div>
  );
}
