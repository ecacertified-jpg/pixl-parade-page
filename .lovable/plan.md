
# Amélioration du Système de Rappels d'Anniversaire avec SMS/WhatsApp

## Objectif

Étendre le système de rappels d'anniversaire existant (`birthday-reminder-with-suggestions`) pour inclure les canaux SMS et WhatsApp en plus des notifications push et email actuelles.

---

## Analyse de l'Existant

### Ce qui fonctionne déjà
- Edge Function `birthday-reminder-with-suggestions` : Crée des rappels pour les anniversaires des contacts
- `delivery_methods: ['push', 'in_app', 'email']` dans `scheduled_notifications`
- Table `notification_preferences` avec `sms_enabled` et préférences utilisateur
- Infrastructure WhatsApp via `send-whatsapp-otp` (META Cloud API)
- Secrets WhatsApp configurés : `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`

### Ce qui manque
- Aucune logique pour envoyer SMS/WhatsApp basée sur `delivery_methods`
- Pas de secrets Twilio pour SMS (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`)
- Pas de processeur qui lit `scheduled_notifications` et envoie via les différents canaux
- La préférence `sms_enabled` n'est pas consultée par le système de rappels

---

## Architecture Proposée

```text
┌─────────────────────────────────────────────────────────────────┐
│                      FLUX AMÉLIORÉ                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CRON quotidien                                                 │
│       │                                                         │
│       ▼                                                         │
│  [birthday-reminder-with-suggestions]                           │
│       │                                                         │
│       ├── Consulte notification_preferences                     │
│       │   (push_enabled, email_enabled, sms_enabled)            │
│       │                                                         │
│       ▼                                                         │
│  [scheduled_notifications]                                      │
│       │  delivery_methods: ['push', 'in_app', 'email', 'sms']   │
│       │                                                         │
│       ▼                                                         │
│  [process-scheduled-notifications] (NOUVEAU)                    │
│       │                                                         │
│       ├── push    → send-push-notification                      │
│       ├── email   → send-email-notification (Resend)            │
│       ├── sms     → send-sms-notification (Twilio)              │
│       └── whatsapp → send-whatsapp-message (META Cloud)         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Plan d'Implémentation

### 1. Modifier `birthday-reminder-with-suggestions`

**Objectif** : Ajouter SMS et WhatsApp aux méthodes de livraison selon les préférences utilisateur

**Changements :**
- Consulter `notification_preferences` pour `sms_enabled` et `push_enabled`
- Récupérer le téléphone de l'utilisateur depuis `profiles`
- Construire dynamiquement `delivery_methods` selon les préférences
- Pour les rappels urgents (J-3, J-1), forcer SMS si activé

```typescript
// Logique de sélection des canaux
const deliveryMethods = ['in_app']; // Toujours in_app

if (prefs?.push_enabled !== false) deliveryMethods.push('push');
if (prefs?.email_enabled !== false) deliveryMethods.push('email');
if (prefs?.sms_enabled === true && userPhone) deliveryMethods.push('sms');

// Pour les rappels urgents, ajouter WhatsApp si SMS non disponible
if (matchingSchedule.priority === 'critical' && !userPhone) {
  // Fallback WhatsApp via email ou autre identifiant
}
```

### 2. Créer `send-sms-notification` Edge Function

**Nouvelle fonction** : Envoie des SMS via Twilio

**Paramètres :**
- `phone`: Numéro de téléphone (format international)
- `message`: Contenu du SMS
- `notification_id`: ID pour tracking

**Secrets requis :**
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

```typescript
// Structure de la fonction
interface SmsPayload {
  phone: string;
  message: string;
  notification_id?: string;
  user_id: string;
}

// Envoi via Twilio REST API
const response = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: phone,
      From: twilioPhone,
      Body: message,
    }),
  }
);
```

### 3. Créer `send-whatsapp-notification` Edge Function

**Nouvelle fonction** : Envoie des notifications WhatsApp (différent de l'OTP existant)

**Réutilise** : Credentials WhatsApp existants (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`)

**Template requis** : Créer un template `birthday_reminder` dans Meta Business Manager

```typescript
// Structure pour templates marketing
interface WhatsAppPayload {
  phone: string;
  template_name: 'birthday_reminder';
  template_params: {
    contact_name: string;
    days_until: number;
    action_url: string;
  };
}
```

### 4. Créer `process-scheduled-notifications` Edge Function

**Nouvelle fonction** : Traite les notifications en attente et les envoie via les bons canaux

**Exécution** : CRON toutes les 5 minutes

**Logique :**
1. Récupérer les `scheduled_notifications` avec `status = 'pending'` et `scheduled_for <= now()`
2. Pour chaque notification, parcourir `delivery_methods`
3. Appeler la fonction appropriée pour chaque canal
4. Mettre à jour le statut et `sent_at`
5. Logger les résultats dans `notification_analytics`

```typescript
for (const notification of pendingNotifications) {
  for (const method of notification.delivery_methods) {
    switch (method) {
      case 'push':
        await sendPushNotification(notification);
        break;
      case 'email':
        await sendEmailNotification(notification);
        break;
      case 'sms':
        await sendSmsNotification(notification);
        break;
      case 'whatsapp':
        await sendWhatsAppNotification(notification);
        break;
      case 'in_app':
        // Déjà dans la table, visible automatiquement
        break;
    }
  }
  
  // Marquer comme envoyé
  await supabase
    .from('scheduled_notifications')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', notification.id);
}
```

### 5. Ajouter les secrets Twilio

**Action utilisateur requise** : Configurer les secrets suivants :
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

### 6. Créer le template WhatsApp

**Action utilisateur requise** : Dans Meta Business Manager, créer un template :
- **Nom** : `birthday_reminder`
- **Catégorie** : Marketing
- **Corps** : "🎂 L'anniversaire de {{1}} est dans {{2}} jour(s) ! Préparez-lui quelque chose de spécial sur JOIE DE VIVRE."
- **Bouton** : "Voir les idées cadeaux" → {{3}}

### 7. Configurer le CRON Job

Ajouter dans `supabase/config.toml` :

```toml
[functions.process-scheduled-notifications]
enabled = true

[[cron_jobs]]
schedule = "*/5 * * * *"  # Toutes les 5 minutes
function = "process-scheduled-notifications"
```

---

## Fichiers à Créer/Modifier

| Action | Fichier | Description |
|--------|---------|-------------|
| Modifier | `supabase/functions/birthday-reminder-with-suggestions/index.ts` | Ajouter SMS/WhatsApp aux delivery_methods |
| Créer | `supabase/functions/send-sms-notification/index.ts` | Envoi SMS via Twilio |
| Créer | `supabase/functions/send-whatsapp-notification/index.ts` | Envoi WhatsApp via META |
| Créer | `supabase/functions/process-scheduled-notifications/index.ts` | Processeur central des notifications |
| Modifier | `supabase/config.toml` | Ajouter CRON pour le processeur |

---

## Détails Techniques

### Priorité des Canaux

| Priorité Rappel | Canaux par défaut |
|-----------------|-------------------|
| low (J-14) | in_app, push |
| medium (J-7) | in_app, push, email |
| high (J-3) | in_app, push, email, sms (si activé) |
| critical (J-1) | in_app, push, email, sms, whatsapp |

### Gestion des Erreurs

- Si SMS échoue → Fallback WhatsApp
- Si WhatsApp échoue → Fallback Email
- Tous les échecs sont loggés dans `notification_analytics`

### Rate Limiting

- Maximum 10 SMS/jour par utilisateur (coût)
- Maximum 50 WhatsApp/jour par utilisateur
- Pas de limite pour push/email

### Tracking

Utiliser la table existante `notification_analytics` pour tracker :
- `notification_type`: 'sms' ou 'whatsapp'
- `status`: 'sent', 'delivered', 'failed'
- `error_message`: Détails si échec

---

## Configuration Requise (Actions Utilisateur)

1. **Secrets Twilio** (pour SMS)
   - Créer un compte Twilio
   - Ajouter `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

2. **Template WhatsApp** (pour rappels marketing)
   - Créer et faire approuver le template `birthday_reminder` dans Meta Business Manager

3. **Numéro de téléphone utilisateur**
   - S'assurer que le champ `phone` est renseigné dans `profiles`

---

## Estimation

- **Complexité** : Moyenne à élevée
- **Edge Functions** : 3 nouvelles + 1 modifiée
- **Secrets requis** : 3 (Twilio)
- **Templates Meta** : 1 nouveau
- **CRON Jobs** : 1 nouveau
