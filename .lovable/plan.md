

# Activer l'envoi WhatsApp pour les notifications d'ajout d'amis

## Situation actuelle

Deux lacunes identifiees dans le systeme de notifications d'amis :

1. **Ajout d'un ami** (`notify-contact-added`) : quand le canal prefere est WhatsApp (pays hors CI/SN), le message est seulement "logge" dans la console mais jamais envoye (lignes 202-205).

2. **Completion du cercle d'amis** (`useFriendsCircleReminder`) : la notification de celebration n'est envoyee que par push et in-app, sans SMS ni WhatsApp.

Les secrets WhatsApp (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`) sont deja configures.

---

## Ce qui va changer

### 1. Module partage : `supabase/functions/_shared/sms-sender.ts`

Ajouter une fonction `sendWhatsApp(to, message)` qui envoie un message texte libre via l'API WhatsApp Cloud (meme pattern que dans `send-whatsapp-otp` mais sans template). La fonction `sendNotification()` existante l'utilisera automatiquement au lieu de retourner `WHATSAPP_ROUTING_REQUIRED`.

### 2. Edge Function : `supabase/functions/notify-contact-added/index.ts`

Remplacer le bloc "log placeholder" (lignes 202-205) par un vrai appel a `sendWhatsApp()` pour les contacts hors CI/SN. Le message sera adapte au format WhatsApp (emojis autorises, pas de limite 160 chars).

### 3. Hook : `src/hooks/useFriendsCircleReminder.ts`

Ajouter un appel a une Edge Function pour envoyer un SMS/WhatsApp au moment de la completion du cercle, en plus du push et de la notification in-app.

---

## Details techniques

### Fichier 1 : `supabase/functions/_shared/sms-sender.ts`

Nouvelle fonction exportee :

```text
export async function sendWhatsApp(to: string, message: string): Promise<SmsResult>
```

- Lit `WHATSAPP_ACCESS_TOKEN` et `WHATSAPP_PHONE_NUMBER_ID` depuis l'environnement
- Envoie un message texte simple via `graph.facebook.com/v18.0/{phoneId}/messages`
- Retourne un `SmsResult` avec `channel: 'whatsapp'`

Modification de `sendNotification()` : remplacer le placeholder WhatsApp par l'appel reel a `sendWhatsApp()`.

### Fichier 2 : `supabase/functions/notify-contact-added/index.ts`

- Importer `sendWhatsApp` depuis le module partage
- Remplacer lignes 202-206 par un vrai envoi WhatsApp quand `channel === 'whatsapp'` et `preferences.whatsapp_enabled`
- Adapter le message WhatsApp avec emojis (plus lisible sur mobile)

### Fichier 3 : `src/hooks/useFriendsCircleReminder.ts`

- Dans `sendCompletionNotification`, ajouter un appel a `notify-contact-added` (ou une edge function dediee) pour envoyer un SMS/WhatsApp de celebration au propre numero de l'utilisateur
- Recuperer le telephone de l'utilisateur depuis son profil

---

## Aucune migration SQL requise

Les tables et secrets necessaires existent deja.

