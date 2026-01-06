import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Bell, 
  Smartphone, 
  Calendar, 
  TrendingUp, 
  Send,
  Settings,
  BarChart3,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useProfileReminderSettings } from '@/hooks/useProfileReminderSettings';

export function ProfileReminderSettings() {
  const { settings, stats, loading, saving, updateSettings, sendTestReminder } = useProfileReminderSettings();
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleTestReminder = async () => {
    setIsSendingTest(true);
    try {
      await sendTestReminder();
    } finally {
      setIsSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            Impossible de charger les paramètres de relance
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Mail className="h-4 w-4" />
                <span className="text-xs">Total envoyées</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalSent}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs">Convertis</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.completedAfter}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs">Taux conversion</span>
              </div>
              <p className="text-2xl font-bold text-primary">{stats.conversionRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Ce mois</span>
              </div>
              <p className="text-2xl font-bold">{stats.thisMonth}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main toggle */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Relances automatiques
              </CardTitle>
              <CardDescription>
                Envoyer des rappels aux utilisateurs avec des profils incomplets
              </CardDescription>
            </div>
            <Switch
              checked={settings.is_enabled}
              onCheckedChange={(checked) => updateSettings({ is_enabled: checked })}
              disabled={saving}
            />
          </div>
        </CardHeader>
      </Card>

      {settings.is_enabled && (
        <>
          {/* Reminder Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendrier des relances
              </CardTitle>
              <CardDescription>
                Définir le timing de chaque relance après l'inscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Badge variant="outline">1</Badge>
                    Première relance (jours)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={settings.reminder_1_days}
                    onChange={(e) => updateSettings({ reminder_1_days: parseInt(e.target.value) || 3 })}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Badge variant="outline">2</Badge>
                    Deuxième relance (jours)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={settings.reminder_2_days}
                    onChange={(e) => updateSettings({ reminder_2_days: parseInt(e.target.value) || 7 })}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Badge variant="outline">3</Badge>
                    Troisième relance (jours)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={90}
                    value={settings.reminder_3_days}
                    onChange={(e) => updateSettings({ reminder_3_days: parseInt(e.target.value) || 14 })}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Badge variant="secondary">Final</Badge>
                    Relance finale (jours)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={settings.reminder_final_days}
                    onChange={(e) => updateSettings({ reminder_final_days: parseInt(e.target.value) || 30 })}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Seuil de complétion minimum (%)</Label>
                    <Input
                      type="number"
                      min={50}
                      max={100}
                      value={settings.min_completion_threshold}
                      onChange={(e) => updateSettings({ min_completion_threshold: parseInt(e.target.value) || 80 })}
                      disabled={saving}
                    />
                    <p className="text-xs text-muted-foreground">
                      Relancer uniquement les profils en dessous de ce seuil
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre maximum de relances</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={settings.max_reminders}
                      onChange={(e) => updateSettings({ max_reminders: parseInt(e.target.value) || 4 })}
                      disabled={saving}
                    />
                    <p className="text-xs text-muted-foreground">
                      Arrêter après ce nombre de relances
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Communication Channels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Canaux de communication
              </CardTitle>
              <CardDescription>
                Choisir les canaux pour envoyer les relances
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      Envoyer des emails de relance
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.email_enabled}
                  onCheckedChange={(checked) => updateSettings({ email_enabled: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Push</p>
                    <p className="text-sm text-muted-foreground">
                      Notifications push sur mobile
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.push_enabled}
                  onCheckedChange={(checked) => updateSettings({ push_enabled: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">In-App</p>
                    <p className="text-sm text-muted-foreground">
                      Notifications dans l'application
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.in_app_enabled}
                  onCheckedChange={(checked) => updateSettings({ in_app_enabled: checked })}
                  disabled={saving}
                />
              </div>

              {stats && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Répartition des envois :</p>
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {stats.byChannel.email} emails
                    </span>
                    <span className="flex items-center gap-1">
                      <Smartphone className="h-3 w-3" /> {stats.byChannel.push} push
                    </span>
                    <span className="flex items-center gap-1">
                      <Bell className="h-3 w-3" /> {stats.byChannel.in_app} in-app
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Subjects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Sujets des emails
              </CardTitle>
              <CardDescription>
                Personnaliser les sujets des emails de relance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">1</Badge>
                  Sujet relance 1
                </Label>
                <Input
                  value={settings.email_subject_1}
                  onChange={(e) => updateSettings({ email_subject_1: e.target.value })}
                  disabled={saving}
                  placeholder="Complétez votre profil..."
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">2</Badge>
                  Sujet relance 2
                </Label>
                <Input
                  value={settings.email_subject_2}
                  onChange={(e) => updateSettings({ email_subject_2: e.target.value })}
                  disabled={saving}
                  placeholder="Vos amis veulent..."
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">3</Badge>
                  Sujet relance 3
                </Label>
                <Input
                  value={settings.email_subject_3}
                  onChange={(e) => updateSettings({ email_subject_3: e.target.value })}
                  disabled={saving}
                  placeholder="Ne manquez pas..."
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">Final</Badge>
                  Sujet relance finale
                </Label>
                <Input
                  value={settings.email_subject_final}
                  onChange={(e) => updateSettings({ email_subject_final: e.target.value })}
                  disabled={saving}
                  placeholder="Dernière chance..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Test Section */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Envoyer une relance test</p>
                  <p className="text-sm text-muted-foreground">
                    Déclencher manuellement le système de relance
                  </p>
                </div>
                <Button 
                  onClick={handleTestReminder}
                  disabled={isSendingTest}
                  variant="outline"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSendingTest ? 'Envoi...' : 'Envoyer test'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
