

## Alerte automatique : taux d'echec WhatsApp > 10% sur 24h

### Contexte

Le projet dispose deja d'un monitoring OTP WhatsApp (`check-whatsapp-otp-health`) qui surveille les taux de succes OTP. La nouvelle alerte portera sur les **messages WhatsApp de notification** (rappels anniversaire, ajout de contact, cercle d'amis) stockes dans `birthday_contact_alerts`.

### Architecture

Nouvelle Edge Function `check-whatsapp-delivery-health` suivant exactement le meme pattern que `check-whatsapp-otp-health` :

1. Lire le seuil configurable depuis `growth_alert_thresholds` (metric_type = `whatsapp_delivery_failure_rate`)
2. Calculer le taux d'echec WhatsApp sur les dernieres 24h depuis `birthday_contact_alerts`
3. Verifier un volume minimum (10 envois) pour eviter les faux positifs
4. Anti-spam : ne pas creer d'alerte si une alerte du meme type existe dans les 6 dernieres heures
5. Creer une notification dans `admin_notifications` avec severite `critical`
6. Envoyer un email HTML via Resend aux admins actifs
7. Declenchement via CRON toutes les 6 heures

### Fichiers a creer / modifier

**1. Edge Function** : `supabase/functions/check-whatsapp-delivery-health/index.ts`

- Requete sur `birthday_contact_alerts` : filtrer `channel = 'whatsapp'` sur les dernieres 24h
- Calculer : total envoyes, total echoues (`status = 'failed'`), taux d'echec
- Seuil par defaut : 10% d'echec (configurable via `growth_alert_thresholds`)
- Volume minimum : 10 messages
- Anti-spam : 6h entre les alertes de type `whatsapp_delivery_failure_rate`
- Notification in-app dans `admin_notifications` avec `action_url: '/admin/messaging-delivery'`
- Email HTML aux admins via Resend (meme logique que `check-whatsapp-otp-health`)

**2. Migration SQL** :

- Inserer le seuil par defaut dans `growth_alert_thresholds` :
  - `metric_type`: `whatsapp_delivery_failure_rate`
  - `threshold_value`: 10
  - `comparison_period`: `24h`
  - `is_active`: true

- Creer le CRON job via `pg_cron` :
  - Nom : `check-whatsapp-delivery-health-6h`
  - Frequence : toutes les 6 heures (`0 */6 * * *`)
  - Appel HTTP POST vers l'Edge Function avec `service_role` key

### Details techniques

```text
Flux de la fonction :

birthday_contact_alerts (24h, channel=whatsapp)
  |
  v
Calcul taux d'echec = failed / total * 100
  |
  v
Volume < 10 ? --> STOP (insufficient_volume)
  |
  v
Taux <= seuil ? --> STOP (healthy)
  |
  v
Alerte recente < 6h ? --> STOP (anti-spam)
  |
  v
INSERT admin_notifications (critical)
  |
  v
Email Resend --> admins actifs
```

### Impact

- Les admins seront alertes automatiquement si le WhatsApp echoue pour plus de 10% des notifications
- Lien direct vers le dashboard `/admin/messaging-delivery` dans la notification
- Configurable via les parametres admin existants (`growth_alert_thresholds`)
- Pas d'impact sur les fonctions existantes

