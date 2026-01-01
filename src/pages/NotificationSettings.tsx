import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Mail, Smartphone, MessageSquare, Volume2, Vibrate, Clock, RefreshCw, Heart, Sparkles, Cake, Send } from "lucide-react";
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
import { ReciprocitySettings } from "@/components/ReciprocitySettings";
import { ReciprocityNotificationSettings } from "@/components/ReciprocityNotificationSettings";
import { CelebrationTestSection } from "@/components/CelebrationTestSection";
import { BirthdayReminderTimingSettings } from "@/components/BirthdayReminderTimingSettings";

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
    recheckPermission,
    resetServiceWorkers,
    sendTestNotification,
    isTesting
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

            {/* Test button for push notifications */}
            {isSubscribed && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Send className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label>Tester les notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Envoyer une notification de test
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={sendTestNotification}
                    disabled={isTesting}
                  >
                    {isTesting ? 'Envoi...' : 'Tester'}
                  </Button>
                </div>
              </>
            )}

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

        {/* Rappels d'anniversaire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cake className="h-5 w-5 text-pink-500" />
              Rappels d'anniversaire
            </CardTitle>
            <CardDescription>
              Configurez quand et comment recevoir les rappels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Activer les rappels</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des rappels avant les anniversaires
                </p>
              </div>
              <Switch 
                checked={preferences.birthday_notifications} 
                onCheckedChange={checked => updatePreferences({
                  birthday_notifications: checked
                })} 
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Quand recevoir les rappels</Label>
              <BirthdayReminderTimingSettings
                selectedDays={preferences.birthday_reminder_days || [14, 7, 3, 1]}
                onDaysChange={(days) => updatePreferences({ birthday_reminder_days: days })}
                disabled={!preferences.birthday_notifications}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <div>
                  <Label>Suggestions de cadeaux IA</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des idées cadeaux personnalisées
                  </p>
                </div>
              </div>
              <Switch 
                checked={preferences.ai_suggestions} 
                onCheckedChange={checked => updatePreferences({
                  ai_suggestions: checked
                })}
                disabled={!preferences.birthday_notifications}
              />
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
            key: 'post_notifications',
            label: 'Publications',
            description: 'Nouvelles publications des utilisateurs suivis'
          }, {
            key: 'comment_notifications',
            label: 'Commentaires',
            description: 'Commentaires sur mes publications'
          }, {
            key: 'reaction_notifications',
            label: 'Réactions',
            description: 'Likes et réactions sur mes publications'
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
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-500" />
              Sons et vibrations de célébration
            </CardTitle>
            <CardDescription>
              Testez et personnalisez les alertes festives
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Sons</Label>
                  <p className="text-sm text-muted-foreground">
                    Activer les sons de célébration
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
                    Activer les vibrations mobiles
                  </p>
                </div>
              </div>
              <Switch checked={preferences.vibration_enabled} onCheckedChange={checked => updatePreferences({
              vibration_enabled: checked
            })} />
            </div>

            {/* Section de test */}
            <CelebrationTestSection 
              soundEnabled={preferences.sound_enabled} 
              vibrationEnabled={preferences.vibration_enabled} 
            />
          </CardContent>
        </Card>

        {/* Réciprocité sociale */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Réciprocité sociale
            </CardTitle>
            <CardDescription>
              Recevez des notifications intelligentes basées sur vos contributions passées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReciprocitySettings />
          </CardContent>
        </Card>
      </div>
    </div>;
}