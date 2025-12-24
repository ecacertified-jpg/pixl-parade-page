import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { GrowthAlertsSettings } from '@/components/admin/GrowthAlertsSettings';
import { ObjectivesEditor } from '@/components/admin/ObjectivesEditor';

export default function Settings() {
  const { settings, isLoading, updateSetting, isUpdating, getSetting } = usePlatformSettings();

  // Local state for form values
  const [generalSettings, setGeneralSettings] = useState({
    platform_name: '',
    support_email: '',
    maintenance_mode: false,
  });

  const [financeSettings, setFinanceSettings] = useState({
    commission_rate: 8,
    free_delivery_threshold: 25000,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    require_2fa_admins: false,
    session_timeout: 240,
  });

  // Load settings from database
  useEffect(() => {
    if (settings) {
      setGeneralSettings({
        platform_name: getSetting('platform_name') || 'JOIE DE VIVRE',
        support_email: getSetting('support_email') || '',
        maintenance_mode: getSetting('maintenance_mode') ?? false,
      });

      setFinanceSettings({
        commission_rate: getSetting('commission_rate') || 8,
        free_delivery_threshold: getSetting('free_delivery_threshold') || 25000,
      });

      setNotificationSettings({
        email_notifications: getSetting('email_notifications') ?? true,
        push_notifications: getSetting('push_notifications') ?? true,
      });

      setSecuritySettings({
        require_2fa_admins: getSetting('require_2fa_admins') ?? false,
        session_timeout: getSetting('session_timeout') || 240,
      });
    }
  }, [settings]);

  // Save handlers
  const handleSaveGeneral = () => {
    updateSetting({ setting_key: 'platform_name', setting_value: { value: generalSettings.platform_name } });
    updateSetting({ setting_key: 'support_email', setting_value: { value: generalSettings.support_email } });
    updateSetting({ setting_key: 'maintenance_mode', setting_value: { enabled: generalSettings.maintenance_mode } });
  };

  const handleSaveFinance = () => {
    updateSetting({ setting_key: 'commission_rate', setting_value: { value: financeSettings.commission_rate, unit: 'percent' } });
    updateSetting({ setting_key: 'free_delivery_threshold', setting_value: { value: financeSettings.free_delivery_threshold, currency: 'XOF' } });
  };

  const handleSaveNotifications = () => {
    updateSetting({ setting_key: 'email_notifications', setting_value: { enabled: notificationSettings.email_notifications } });
    updateSetting({ setting_key: 'push_notifications', setting_value: { enabled: notificationSettings.push_notifications } });
  };

  const handleSaveSecurity = () => {
    updateSetting({ setting_key: 'require_2fa_admins', setting_value: { enabled: securitySettings.require_2fa_admins } });
    updateSetting({ setting_key: 'session_timeout', setting_value: { value: securitySettings.session_timeout, unit: 'minutes' } });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Paramètres de la plateforme</h1>
          <p className="text-muted-foreground mt-2">
            Configuration globale de JOIE DE VIVRE (Super Admin uniquement)
          </p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="objectives">Objectifs</TabsTrigger>
            <TabsTrigger value="alerts">Alertes</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
          </TabsList>

          <TabsContent value="objectives">
            <ObjectivesEditor />
          </TabsContent>

          <TabsContent value="alerts">
            <GrowthAlertsSettings />
          </TabsContent>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres généraux</CardTitle>
                <CardDescription>
                  Configuration de base de la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Nom de la plateforme</Label>
                  <Input 
                    id="platform-name" 
                    value={generalSettings.platform_name}
                    onChange={(e) => setGeneralSettings({...generalSettings, platform_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Email de support</Label>
                  <Input 
                    id="support-email" 
                    type="email" 
                    value={generalSettings.support_email}
                    onChange={(e) => setGeneralSettings({...generalSettings, support_email: e.target.value})}
                    placeholder="support@joiedevivre.ci" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mode maintenance</Label>
                    <p className="text-sm text-muted-foreground">
                      Désactiver temporairement la plateforme
                    </p>
                  </div>
                  <Switch 
                    checked={generalSettings.maintenance_mode}
                    onCheckedChange={(checked) => setGeneralSettings({...generalSettings, maintenance_mode: checked})}
                  />
                </div>
                <Button onClick={handleSaveGeneral} disabled={isUpdating}>
                  Enregistrer les modifications
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finance">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres financiers</CardTitle>
                <CardDescription>
                  Gestion des commissions et paiements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="commission-rate">Taux de commission (%)</Label>
                  <Input 
                    id="commission-rate" 
                    type="number" 
                    value={financeSettings.commission_rate}
                    onChange={(e) => setFinanceSettings({...financeSettings, commission_rate: Number(e.target.value)})}
                    min="0" 
                    max="100" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="free-delivery">Seuil de livraison gratuite (FCFA)</Label>
                  <Input 
                    id="free-delivery" 
                    type="number" 
                    value={financeSettings.free_delivery_threshold}
                    onChange={(e) => setFinanceSettings({...financeSettings, free_delivery_threshold: Number(e.target.value)})}
                  />
                </div>
                <Button onClick={handleSaveFinance} disabled={isUpdating}>
                  Enregistrer les modifications
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de notifications</CardTitle>
                <CardDescription>
                  Configuration des emails et notifications push
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications email</Label>
                    <p className="text-sm text-muted-foreground">
                      Activer les emails automatiques
                    </p>
                  </div>
                  <Switch 
                    checked={notificationSettings.email_notifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, email_notifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications push</Label>
                    <p className="text-sm text-muted-foreground">
                      Activer les notifications push
                    </p>
                  </div>
                  <Switch 
                    checked={notificationSettings.push_notifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, push_notifications: checked})}
                  />
                </div>
                <Button onClick={handleSaveNotifications} disabled={isUpdating}>
                  Enregistrer les modifications
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de sécurité</CardTitle>
                <CardDescription>
                  Configuration de la sécurité et des accès
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Authentification à deux facteurs</Label>
                    <p className="text-sm text-muted-foreground">
                      Activer 2FA pour les admins
                    </p>
                  </div>
                  <Switch 
                    checked={securitySettings.require_2fa_admins}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, require_2fa_admins: checked})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Durée de session (minutes)</Label>
                  <Input 
                    id="session-timeout" 
                    type="number" 
                    value={securitySettings.session_timeout}
                    onChange={(e) => setSecuritySettings({...securitySettings, session_timeout: Number(e.target.value)})}
                  />
                </div>
                <Button onClick={handleSaveSecurity} disabled={isUpdating}>
                  Enregistrer les modifications
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
