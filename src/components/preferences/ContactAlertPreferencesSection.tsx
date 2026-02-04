import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Bell, MessageSquare, Mail, Phone, Calendar, Info, Loader2 } from "lucide-react";
import { useContactAlertPreferences } from "@/hooks/useContactAlertPreferences";
import { cn } from "@/lib/utils";

export function ContactAlertPreferencesSection() {
  const { preferences, loading, saving, updatePreferences } = useContactAlertPreferences();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Connectez-vous pour configurer vos préférences d'alertes.
        </CardContent>
      </Card>
    );
  }

  const isDisabled = !preferences.alerts_enabled;

  return (
    <div className="space-y-6">
      {/* Main Toggle Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Alertes pour vos contacts</CardTitle>
              <CardDescription>
                Configurez comment vos amis sont informés de votre anniversaire
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="alerts-enabled" className="font-medium">
                Activer les alertes anniversaire pour mes contacts
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Vos contacts recevront des rappels avant votre anniversaire
              </p>
            </div>
            <Switch
              id="alerts-enabled"
              checked={preferences.alerts_enabled}
              onCheckedChange={(checked) => updatePreferences({ alerts_enabled: checked })}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Communication Channels */}
      <Card className={cn(isDisabled && "opacity-60")}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Canaux de communication
          </CardTitle>
          <CardDescription>
            Choisissez comment vos contacts seront notifiés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="sms-enabled">SMS</Label>
              </div>
              <Switch
                id="sms-enabled"
                checked={preferences.sms_enabled}
                onCheckedChange={(checked) => updatePreferences({ sms_enabled: checked })}
                disabled={isDisabled || saving}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <Label htmlFor="whatsapp-enabled">WhatsApp</Label>
              </div>
              <Switch
                id="whatsapp-enabled"
                checked={preferences.whatsapp_enabled}
                onCheckedChange={(checked) => updatePreferences({ whatsapp_enabled: checked })}
                disabled={isDisabled || saving}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <Label htmlFor="email-enabled">Email</Label>
              </div>
              <Switch
                id="email-enabled"
                checked={preferences.email_enabled}
                onCheckedChange={(checked) => updatePreferences({ email_enabled: checked })}
                disabled={isDisabled || saving}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminder Schedule */}
      <Card className={cn(isDisabled && "opacity-60")}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendrier des rappels
          </CardTitle>
          <CardDescription>
            Choisissez quand vos contacts recevront les rappels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <Checkbox
              id="alert-on-contact-add"
              checked={preferences.alert_on_contact_add}
              onCheckedChange={(checked) => 
                updatePreferences({ alert_on_contact_add: checked === true })
              }
              disabled={isDisabled || saving}
            />
            <div className="space-y-1">
              <Label htmlFor="alert-on-contact-add" className="font-medium cursor-pointer">
                À l'ajout d'un contact
              </Label>
              <p className="text-sm text-muted-foreground">
                Notification immédiate quand vous ajoutez un ami avec numéro de téléphone
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <Checkbox
                id="alert-10-days"
                checked={preferences.alert_10_days}
                onCheckedChange={(checked) => 
                  updatePreferences({ alert_10_days: checked === true })
                }
                disabled={isDisabled || saving}
              />
              <div className="space-y-1">
                <Label htmlFor="alert-10-days" className="font-medium cursor-pointer">
                  J-10 (10 jours avant)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Premier rappel pour préparer
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <Checkbox
                id="alert-5-days"
                checked={preferences.alert_5_days}
                onCheckedChange={(checked) => 
                  updatePreferences({ alert_5_days: checked === true })
                }
                disabled={isDisabled || saving}
              />
              <div className="space-y-1">
                <Label htmlFor="alert-5-days" className="font-medium cursor-pointer">
                  J-5 (5 jours avant)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Rappel pour trouver le cadeau
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <Checkbox
                id="alert-3-days"
                checked={preferences.alert_3_days}
                onCheckedChange={(checked) => 
                  updatePreferences({ alert_3_days: checked === true })
                }
                disabled={isDisabled || saving}
              />
              <div className="space-y-1">
                <Label htmlFor="alert-3-days" className="font-medium cursor-pointer">
                  J-3 (3 jours avant)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Rappel pour commander
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <Checkbox
                id="alert-2-days"
                checked={preferences.alert_2_days}
                onCheckedChange={(checked) => 
                  updatePreferences({ alert_2_days: checked === true })
                }
                disabled={isDisabled || saving}
              />
              <div className="space-y-1">
                <Label htmlFor="alert-2-days" className="font-medium cursor-pointer">
                  J-2 (2 jours avant)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Rappel dernière chance
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border-l-2 border-orange-400">
              <Checkbox
                id="alert-1-day"
                checked={preferences.alert_1_day}
                onCheckedChange={(checked) => 
                  updatePreferences({ alert_1_day: checked === true })
                }
                disabled={isDisabled || saving}
              />
              <div className="space-y-1">
                <Label htmlFor="alert-1-day" className="font-medium cursor-pointer">
                  J-1 (Veille)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Dernier rappel urgent
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border-l-2 border-primary">
              <Checkbox
                id="alert-day-of"
                checked={preferences.alert_day_of}
                onCheckedChange={(checked) => 
                  updatePreferences({ alert_day_of: checked === true })
                }
                disabled={isDisabled || saving}
              />
              <div className="space-y-1">
                <Label htmlFor="alert-day-of" className="font-medium cursor-pointer">
                  Jour-J 🎂
                </Label>
                <p className="text-sm text-muted-foreground">
                  Le jour de l'anniversaire
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors bg-secondary/30">
            <Checkbox
              id="notify-of-adder-birthday"
              checked={preferences.notify_of_adder_birthday}
              onCheckedChange={(checked) => 
                updatePreferences({ notify_of_adder_birthday: checked === true })
              }
              disabled={isDisabled || saving}
            />
            <div className="space-y-1">
              <Label htmlFor="notify-of-adder-birthday" className="font-medium cursor-pointer">
                Être notifié de l'anniversaire de ceux qui m'ajoutent
              </Label>
              <p className="text-sm text-muted-foreground">
                Recevez des rappels quand c'est l'anniversaire d'un ami qui vous a ajouté
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Message */}
      <Card className={cn(isDisabled && "opacity-60")}>
        <CardHeader>
          <CardTitle className="text-base">Message personnalisé (optionnel)</CardTitle>
          <CardDescription>
            Ce message sera inclus dans les notifications envoyées à vos contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ex: Cette année, je rêve d'un voyage en famille..."
            value={preferences.custom_message || ''}
            onChange={(e) => updatePreferences({ custom_message: e.target.value || null })}
            disabled={isDisabled || saving}
            className="min-h-[100px] resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {(preferences.custom_message?.length || 0)}/500 caractères
          </p>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <p className="font-medium mb-1">Comment ça fonctionne ?</p>
          <p className="text-blue-700 dark:text-blue-300">
            Les messages sont envoyés via SMS en Côte d'Ivoire et au Sénégal (réseau plus fiable) 
            et via WhatsApp dans les autres pays. Le système choisit automatiquement 
            le meilleur canal selon la localisation de votre contact.
          </p>
        </div>
      </div>
    </div>
  );
}
