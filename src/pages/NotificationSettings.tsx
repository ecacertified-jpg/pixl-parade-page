import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Mail, Smartphone, MessageSquare, Volume2, Vibrate, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
export default function NotificationSettings() {
  const navigate = useNavigate();
  const {
    preferences,
    loading,
    saving,
    updatePreferences
  } = useNotificationPreferences();
  const {
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
    recheckPermission
  } = usePushNotifications();
  const [isRefreshing, setIsRefreshing] = useState(false);
  if (loading) {
    return <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>;
  }
  if (!preferences) return null;
  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await subscribe();
      if (success) {
        await updatePreferences({
          push_enabled: true
        });
      }
    } else {
      await unsubscribe();
      await updatePreferences({
        push_enabled: false
      });
    }
  };
  const handleRefreshPermission = async () => {
    setIsRefreshing(true);
    await recheckPermission();
    setIsRefreshing(false);
  };
  return <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Paramètres des notifications</h1>
            <p className="text-sm text-muted-foreground">
              Personnalisez vos notifications
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Canaux de notification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Canaux de notification
            </CardTitle>
            <CardDescription>
              Choisissez comment recevoir vos notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {permission === 'denied' && <Alert>
                <Bell className="h-4 w-4" />
                <AlertTitle>Notifications bloquées</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p className="text-sm">Pour activer les notifications push :</p>
                  <ol className="text-sm list-decimal list-inside space-y-1 ml-2">
                    <li>Cliquez sur l'icône 🔒 dans la barre d'adresse</li>
                    <li>Cliquez sur "Paramètres du site"</li>
                    <li>Dans "Notifications", sélectionnez "Autoriser"</li>
                    <li>Cliquez sur le bouton ci-dessous</li>
                  </ol>
                  <Button onClick={handleRefreshPermission} disabled={isRefreshing} size="sm" className="mt-2 w-full text-sm">
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Autorisation en cours...' : 'Autoriser les notifications maintenant'}
                  </Button>
                </AlertDescription>
              </Alert>}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Notifications push</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications en temps réel
                  </p>
                </div>
              </div>
              <Switch checked={preferences.push_enabled && isSubscribed} onCheckedChange={handlePushToggle} disabled={!isSupported} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications par email
                  </p>
                </div>
              </div>
              <Switch checked={preferences.email_enabled} onCheckedChange={checked => updatePreferences({
              email_enabled: checked
            })} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>SMS</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications par SMS
                  </p>
                </div>
              </div>
              <Switch checked={preferences.sms_enabled} onCheckedChange={checked => updatePreferences({
              sms_enabled: checked
            })} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>In-app</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications dans l'application
                  </p>
                </div>
              </div>
              <Switch checked={preferences.in_app_enabled} onCheckedChange={checked => updatePreferences({
              in_app_enabled: checked
            })} />
            </div>
          </CardContent>
        </Card>

        {/* Types de notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Types de notifications</CardTitle>
            <CardDescription>
              Choisissez les types de notifications que vous souhaitez recevoir
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[{
            key: 'birthday_notifications',
            label: 'Anniversaires',
            description: 'Rappels d\'anniversaires'
          }, {
            key: 'event_notifications',
            label: 'Événements',
            description: 'Rappels d\'événements importants'
          }, {
            key: 'contribution_notifications',
            label: 'Contributions',
            description: 'Nouvelles contributions aux cagnottes'
          }, {
            key: 'gift_notifications',
            label: 'Cadeaux',
            description: 'Promesses et réceptions de cadeaux'
          }, {
            key: 'fund_deadline_notifications',
            label: 'Échéances',
            description: 'Alertes d\'échéance de cagnottes'
          }, {
            key: 'ai_suggestions',
            label: 'Suggestions IA',
            description: 'Recommandations intelligentes'
          }].map((item, index) => <div key={item.key}>
                {index > 0 && <Separator />}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{item.label}</Label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch checked={preferences[item.key as keyof typeof preferences] as boolean} onCheckedChange={checked => updatePreferences({
                [item.key]: checked
              })} />
                </div>
              </div>)}
          </CardContent>
        </Card>

        {/* Fréquence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Fréquence
            </CardTitle>
            <CardDescription>
              Définissez la fréquence de réception
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Mode résumé</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir un résumé groupé
                </p>
              </div>
              <Switch checked={preferences.digest_mode} onCheckedChange={checked => updatePreferences({
              digest_mode: checked
            })} />
            </div>

            {preferences.digest_mode && <>
                <Separator />
                <div className="space-y-2">
                  <Label>Fréquence du résumé</Label>
                  <Select value={preferences.digest_frequency} onValueChange={(value: 'daily' | 'weekly') => updatePreferences({
                digest_frequency: value
              })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidien</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>}
          </CardContent>
        </Card>

        {/* Sons et vibrations */}
        <Card>
          <CardHeader>
            <CardTitle>Sons et vibrations</CardTitle>
            <CardDescription>
              Personnalisez les alertes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Sons</Label>
                  <p className="text-sm text-muted-foreground">
                    Activer les sons de notification
                  </p>
                </div>
              </div>
              <Switch checked={preferences.sound_enabled} onCheckedChange={checked => updatePreferences({
              sound_enabled: checked
            })} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Vibrate className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Vibrations</Label>
                  <p className="text-sm text-muted-foreground">
                    Activer les vibrations
                  </p>
                </div>
              </div>
              <Switch checked={preferences.vibration_enabled} onCheckedChange={checked => updatePreferences({
              vibration_enabled: checked
            })} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}