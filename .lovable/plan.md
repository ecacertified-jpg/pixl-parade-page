

# Plan d'Integration SMS Twilio

## Contexte

Les 3 secrets Twilio sont maintenant configures :
- `TWILIO_ACCOUNT_SID` 
- `TWILIO_AUTH_TOKEN` 
- `TWILIO_SENDER_ID` (Alphanumeric: "JoieDvivre")

L'objectif est d'ajouter le canal SMS aux notifications existantes, en complement de Push, WhatsApp et Email.

---

## Architecture Proposee

```text
                    +---------------------------+
                    |      Edge Functions       |
                    +---------------------------+
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
    +-----------------+ +-----------+ +---------------+
    | notify-business | | birthday- | | daily-notif-  |
    | order           | | reminder  | | ications-check|
    +-----------------+ +-----------+ +---------------+
              |               |               |
              +-------+-------+-------+-------+
                      |               |
                      v               v
              +---------------+ +---------------+
              | _shared/      | | _shared/      |
              | sms-sender.ts | | whatsapp.ts   |
              +---------------+ +---------------+
                      |               |
                      v               v
              +---------------+ +---------------+
              | Twilio API    | | Meta WhatsApp |
              | (SMS)         | | Cloud API     |
              +---------------+ +---------------+
```

---

## Etape 1 : Creer le Module Partage SMS

### Fichier : `supabase/functions/_shared/sms-sender.ts`

Ce module centralisera toute la logique d'envoi SMS via Twilio :

**Fonctions exportees :**

| Fonction | Description |
|----------|-------------|
| `sendSms(to, message)` | Envoie un SMS via Twilio |
| `getPreferredChannel(phone)` | Determine SMS ou WhatsApp selon le prefixe |
| `formatPhoneForTwilio(phone)` | Formatte le numero au format E.164 |

**Logique de routage par pays :**

| Prefixe | Pays | Canal | Raison |
|---------|------|-------|--------|
| +225 | Cote d'Ivoire | SMS | Haute fiabilite |
| +221 | Senegal | SMS | Haute fiabilite |
| +229 | Benin | WhatsApp | SMS moins fiable |
| Autres | - | WhatsApp | Fallback securise |

**Gestion des erreurs :**
- Retry automatique (1 tentative)
- Logging detaille pour debug
- Fallback vers WhatsApp si SMS echoue

---

## Etape 2 : Creer une Fonction de Test SMS

### Fichier : `supabase/functions/test-sms/index.ts`

Fonction pour valider la configuration Twilio avant integration :

**Endpoint :** `POST /test-sms`

**Body :**
```json
{
  "phone": "+225XXXXXXXXXX",
  "message": "Test de configuration SMS JoieDvivre"
}
```

**Reponse succes :**
```json
{
  "success": true,
  "sid": "SMxxxxxxxxxxxxxxxx",
  "status": "queued",
  "channel": "sms"
}
```

**Reponse erreur :**
```json
{
  "success": false,
  "error": "TWILIO_CREDENTIALS_MISSING",
  "details": "TWILIO_ACCOUNT_SID not configured"
}
```

---

## Etape 3 : Integrer SMS dans notify-business-order

### Modifications :

1. Importer le module `_shared/sms-sender.ts`
2. Recuperer le telephone du proprietaire business
3. Apres l'envoi Push et in-app, envoyer un SMS

**Message SMS (max 160 caracteres) :**
```text
JoieDvivre: Nouvelle commande #{shortId} de {amount} XOF. Acceptez dans l'app.
```

**Condition d'envoi :**
- Si le proprietaire a un numero valide (+225 ou +221)
- Toujours envoyer pour les commandes (haute priorite)

---

## Etape 4 : Integrer SMS dans notify-order-confirmation

### Modifications :

1. Importer le module `_shared/sms-sender.ts`
2. Envoyer SMS **uniquement pour les demandes de remboursement** (urgent)

**Message SMS :**
```text
URGENT JoieDvivre: Demande remboursement #{shortId}. Connectez-vous maintenant.
```

**Condition d'envoi :**
- `isSatisfied === false` (demande de remboursement)
- Numero valide

---

## Etape 5 : Integrer SMS dans birthday-reminder-with-suggestions

### Modifications :

1. Importer le module `_shared/sms-sender.ts`
2. Envoyer SMS pour les rappels J-1 (critiques)

**Message SMS :**
```text
JoieDvivre: L'anniversaire de {contactName} est DEMAIN! Offrez un cadeau memorable.
```

**Condition d'envoi :**
- `priority_score === 'critical'` (J-1)
- Utilisateur a un numero valide
- Preferences utilisateur autorisent SMS

---

## Etape 6 : Integrer SMS dans daily-notifications-check

### Modifications :

1. Importer le module `_shared/sms-sender.ts`
2. Envoyer SMS pour les deadlines de cagnottes a 3 jours

**Message SMS :**
```text
URGENT JoieDvivre: Cotisation "{fundTitle}" expire dans 3 jours!
```

**Condition d'envoi :**
- `daysUntilDeadline === 3`
- Contributeur a un numero valide

---

## Etape 7 : Mettre a jour supabase/config.toml

Ajouter la configuration pour la nouvelle fonction de test :

```toml
[functions.test-sms]
verify_jwt = false
```

---

## Fichiers a Creer

| Fichier | Description |
|---------|-------------|
| `supabase/functions/_shared/sms-sender.ts` | Module partage pour envoi SMS Twilio |
| `supabase/functions/test-sms/index.ts` | Fonction de test de configuration |

## Fichiers a Modifier

| Fichier | Modification |
|---------|--------------|
| `supabase/functions/notify-business-order/index.ts` | Ajouter envoi SMS au prestataire |
| `supabase/functions/notify-order-confirmation/index.ts` | Ajouter SMS pour remboursements |
| `supabase/functions/birthday-reminder-with-suggestions/index.ts` | Ajouter SMS pour J-1 |
| `supabase/functions/daily-notifications-check/index.ts` | Ajouter SMS pour deadlines J-3 |
| `supabase/config.toml` | Ajouter `[functions.test-sms]` |

---

## Specification Technique : Module sms-sender.ts

```text
// Types
interface SmsResult {
  success: boolean;
  sid?: string;
  status?: string;
  error?: string;
  channel: 'sms' | 'whatsapp';
}

interface TwilioErrorResponse {
  code: number;
  message: string;
  more_info: string;
}

// Constants
TWILIO_API_URL = "https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json"

// Main Functions
sendSms(to: string, message: string): Promise<SmsResult>
getPreferredChannel(phone: string): 'sms' | 'whatsapp'
formatPhoneForTwilio(phone: string): string

// Internal Helpers
buildTwilioAuthHeader(): string  // Basic Auth avec SID:AuthToken
truncateMessage(message: string, maxLength: number): string
```

---

## Limites de l'Alphanumeric Sender ID

| Aspect | Comportement |
|--------|--------------|
| Direction | Unidirectionnel (envoi uniquement) |
| Reponses | Impossible de recevoir des reponses |
| Pays supportes | Verifier la liste Twilio |
| Longueur | 11 caracteres max ("JoieDvivre" = 10) |

**Note :** Pour la Cote d'Ivoire et le Senegal, les Alphanumeric Sender IDs sont generalement supportes. Pour le Benin, il faudrait verifier la compatibilite ou utiliser WhatsApp.

---

## Estimation du Travail

| Phase | Duree |
|-------|-------|
| Module `_shared/sms-sender.ts` | 10 min |
| Fonction `test-sms` | 5 min |
| Integration `notify-business-order` | 5 min |
| Integration `notify-order-confirmation` | 5 min |
| Integration `birthday-reminder` | 5 min |
| Integration `daily-notifications-check` | 5 min |
| Tests et validation | 10 min |
| **Total** | ~45 min |

---

## Tests de Validation

Apres implementation :

1. **Test unitaire** : Appeler `test-sms` avec un numero de test
2. **Test integration** : Creer une commande et verifier le SMS
3. **Test fallback** : Verifier que WhatsApp est utilise pour +229

