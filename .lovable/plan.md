
# Migration vers WhatsApp Prioritaire pour les Notifications

## Contexte du Problème

Les SMS envoyés via Twilio avec l'ID "JoieDvivre" ne sont plus délivrés en Côte d'Ivoire, malgré un statut "delivered" côté Twilio. Cela suggère un filtrage opérateur (DLT/anti-spam) qui a changé récemment.

## Solution Proposée

Inverser la logique de routage : **WhatsApp devient le canal principal**, SMS devient le fallback pour les pays sans WhatsApp.

### Architecture Actuelle vs Future

```text
AVANT (SMS prioritaire)
┌─────────────┐     ┌──────────┐
│   CI/SN     │ ──► │   SMS    │  ──► Bloqué par opérateur
│   (+225)    │     │ (Twilio) │
└─────────────┘     └──────────┘

APRÈS (WhatsApp prioritaire)
┌─────────────┐     ┌───────────────┐
│   CI/SN     │ ──► │   WhatsApp    │  ──► Délivré 99%+
│   (+225)    │     │ (Meta Cloud)  │
└─────────────┘     └───────────────┘
                           │
                    (SMS fallback si
                     WhatsApp échoue)
```

---

## Fichiers à Créer/Modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `supabase/functions/_shared/whatsapp-sender.ts` | **Créer** | Module partagé pour envoi WhatsApp (réutilise la logique de send-whatsapp-otp) |
| `supabase/functions/_shared/sms-sender.ts` | Modifier | Inverser la logique : WhatsApp prioritaire partout |
| `supabase/functions/notify-contact-added/index.ts` | Modifier | Utiliser WhatsApp en priorité |
| `supabase/functions/check-birthday-alerts-for-contacts/index.ts` | Modifier | Utiliser WhatsApp en priorité |
| `src/config/countries.ts` | Modifier | Marquer CI comme `smsReliability: 'unreliable'` |

---

## Détails Techniques

### 1. Nouveau Module : `_shared/whatsapp-sender.ts`

Ce module centralisera l'envoi de messages WhatsApp (texte libre, pas de template OTP) :

```typescript
// Types
export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Configuration via secrets existants
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");

/**
 * Envoie un message WhatsApp texte libre
 * Utilise l'API Meta Cloud (Graph API)
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<WhatsAppResult> {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    return { success: false, error: 'WHATSAPP_NOT_CONFIGURED' };
  }

  // Format: retirer le + du numéro
  const formattedPhone = to.replace(/^\+/, '');

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: { body: message },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    return { success: false, error: errorData };
  }

  const result = await response.json();
  return { 
    success: true, 
    messageId: result.messages?.[0]?.id 
  };
}
```

### 2. Modification du Routage dans `sms-sender.ts`

Inverser la logique du canal préféré :

```typescript
// AVANT: SMS pour CI/SN
const SMS_RELIABLE_PREFIXES = ['+225', '+221'];

function getPreferredChannel(phone: string): 'sms' | 'whatsapp' {
  if (SMS_RELIABLE_PREFIXES.includes(prefix)) return 'sms';
  return 'whatsapp';
}

// APRÈS: WhatsApp partout (sauf exceptions futures)
const SMS_FALLBACK_ONLY_PREFIXES: string[] = []; // Aucun pays en SMS prioritaire

function getPreferredChannel(phone: string): 'sms' | 'whatsapp' {
  // WhatsApp prioritaire pour tous les pays
  return 'whatsapp';
}
```

### 3. Modification de `notify-contact-added/index.ts`

```typescript
// Ajouter l'import
import { sendWhatsAppMessage } from "../_shared/whatsapp-sender.ts";

// Dans la logique d'envoi, inverser la priorité
const channel = 'whatsapp'; // Toujours WhatsApp en premier

if (preferences.whatsapp_enabled) {
  // WhatsApp prioritaire
  const waResult = await sendWhatsAppMessage(contact_phone, message);
  sendResult = { success: waResult.success, error: waResult.error };
  
  // Fallback SMS si WhatsApp échoue
  if (!waResult.success && preferences.sms_enabled) {
    console.log('WhatsApp failed, trying SMS fallback...');
    const smsResult = await sendSms(contact_phone, message);
    sendResult = { success: smsResult.success, error: smsResult.error };
    channel = 'sms';
  }
} else if (preferences.sms_enabled) {
  // SMS seulement si WhatsApp désactivé
  const smsResult = await sendSms(contact_phone, message);
  sendResult = { success: smsResult.success, error: smsResult.error };
}
```

### 4. Mise à jour de `countries.ts`

Refléter la réalité du terrain :

```typescript
CI: {
  // ...
  smsReliability: "unreliable", // ← Changé de "reliable"
  whatsappFallbackEnabled: true  // ← Changé de false
},
```

---

## Prérequis WhatsApp Business

Les secrets nécessaires sont **déjà configurés** :
- `WHATSAPP_PHONE_NUMBER_ID` ✅
- `WHATSAPP_ACCESS_TOKEN` ✅

**Important** : L'envoi de messages texte libre (hors template) nécessite que l'utilisateur ait initié une conversation dans les 24 dernières heures OU que vous utilisiez un template approuvé.

Pour les notifications d'ajout de contact, un **template WhatsApp** serait plus fiable. Je peux créer un template si nécessaire.

---

## Plan d'Exécution

1. Créer `_shared/whatsapp-sender.ts` (nouveau module)
2. Modifier `_shared/sms-sender.ts` (inverser la priorité)
3. Modifier `notify-contact-added/index.ts` (WhatsApp prioritaire + fallback SMS)
4. Modifier `check-birthday-alerts-for-contacts/index.ts` (même logique)
5. Mettre à jour `countries.ts` (marquer CI comme unreliable)
6. Déployer et tester avec votre numéro

---

## Avantages de cette Solution

| Critère | SMS (avant) | WhatsApp (après) |
|---------|-------------|------------------|
| Délivrabilité CI | ~0% (bloqué) | ~99% |
| Coût | ~0.05€/SMS | Gratuit (messages utilisateur-initiés) |
| Liens cliquables | Filtrés | ✅ Fonctionnent |
| Médias (images) | Non | ✅ Possible |
| Confirmation lecture | Non | ✅ Double coche |

---

## Note sur les Templates WhatsApp

Pour garantir la délivrabilité même sans conversation préalable, je recommande de créer un template WhatsApp Business pour les notifications. Cela nécessite une approbation Meta (24-48h).

Voulez-vous que j'inclue la création d'un template dans le plan ?
