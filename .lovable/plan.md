# Migration vers OneSignal Web Push

## Objectif
Remplacer le système Web Push VAPID actuel (basé sur `push_subscriptions` + `_shared/web-push.ts`) par OneSignal Web SDK, plus fiable, multi-plateforme et avec dashboard de suivi inclus.

## Configuration acquise
- ✅ App OneSignal créée : `Joie de Vivre Africa`
- ✅ App ID public : `52d13eb4-510f-4bb0-8909-d3eb996e91cd` (en clair dans le code, c'est normal)
- ✅ Secret `ONESIGNAL_REST_API_KEY` ajouté côté edge functions

## Architecture cible

```text
┌─────────────────────────────┐
│  Client (React PWA)         │
│  ─ OneSignal Web SDK v16    │
│  ─ Player ID stocké dans    │
│    profiles.onesignal_id    │
└──────────────┬──────────────┘
               │
       ┌───────▼────────┐
       │ Edge Function  │
       │ send-push-     │
       │ notification   │
       │ (réécrite)     │
       └───────┬────────┘
               │ REST
       ┌───────▼────────┐
       │ OneSignal API  │
       │ /notifications │
       └────────────────┘
```

## Étapes

### 1. Base de données
- Ajouter colonne `onesignal_player_id text` à `profiles` (indexée).
- Garder `push_subscriptions` pour l'historique mais marquer la table comme dépréciée (pas de drop, on évite la régression).

### 2. Client — SDK OneSignal
- Installer `react-onesignal`.
- Créer `src/lib/onesignal.ts` : initialisation unique avec `appId`, `safari_web_id` non requis, `allowLocalhostAsSecureOrigin: true` en dev.
- Initialiser dans `src/main.tsx` (après le mount) uniquement en prod ou preview publié (pas dans l'iframe Lovable).
- Réécrire `src/hooks/usePushNotifications.ts` :
  - `isSupported` ← `OneSignal.Notifications.isPushSupported()`
  - `permission` ← `OneSignal.Notifications.permission`
  - `subscribe()` ← `OneSignal.Notifications.requestPermission()` puis `OneSignal.login(user.id)` et upsert `profiles.onesignal_player_id`
  - `unsubscribe()` ← `OneSignal.User.PushSubscription.optOut()`
- `PushNotificationPrompt.tsx` : aucun changement de logique nécessaire (utilise déjà le hook).

### 3. Service Worker
- OneSignal exige `OneSignalSDKWorker.js` à la racine du site.
- Ajouter `public/OneSignalSDKWorker.js` (1 ligne : `importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');`).
- Compatible avec la PWA existante (scope distinct, n'interfère pas avec un éventuel app-shell SW).

### 4. Edge function `send-push-notification`
- Garder l'interface d'appel (même `user_ids`, `title`, `message`, `type`, etc.) pour ne rien casser dans les ~30 fonctions qui l'appellent.
- Remplacer la logique interne :
  - Récupérer les `onesignal_player_id` depuis `profiles` pour `user_ids`.
  - POST `https://api.onesignal.com/notifications` avec `Authorization: Key <ONESIGNAL_REST_API_KEY>`, `app_id`, `include_player_ids`, `headings`, `contents`, `url`, `chrome_web_icon`, `data`.
  - Mapper `type` → `android_channel_id` / `web_buttons` si pertinent.
  - Garder l'écriture dans `notification_analytics`.
- Supprimer la dépendance à `_shared/web-push.ts` et aux secrets `VAPID_*` (les laisser en place, on les retirera plus tard).

### 5. Fichiers supprimés / inchangés
- ❌ Plus utilisé : `supabase/functions/_shared/web-push.ts` (à laisser, supprimé après vérif que rien d'autre ne l'importe).
- ✅ Inchangé : toutes les fonctions appelantes (`notify-*`, crons WhatsApp, etc.).

### 6. Validation
- Build + déploiement de la edge function.
- Test manuel : se logger sur le site publié, accepter la permission, vérifier que `profiles.onesignal_player_id` est rempli.
- Envoyer une notif de test via `supabase--curl_edge_functions` → vérifier réception navigateur + dashboard OneSignal "Delivery".

## Détails techniques (pour mémoire)

**Endpoint OneSignal REST**
```
POST https://api.onesignal.com/notifications
Authorization: Key <REST_API_KEY>
Content-Type: application/json

{
  "app_id": "52d13eb4-510f-4bb0-8909-d3eb996e91cd",
  "include_player_ids": ["..."],
  "headings": {"fr": "Titre", "en": "Title"},
  "contents": {"fr": "Message", "en": "Message"},
  "url": "https://joiedevivre-africa.com/...",
  "chrome_web_icon": "https://.../pwa-192x192.png",
  "data": { "type": "birthday", ... }
}
```

**Auto-resubscribe** déjà coché côté OneSignal dashboard ✅.

## Risques & mitigations
- **Préviews Lovable** : ne pas initialiser OneSignal dans l'iframe (`window.top !== window.self`) pour éviter la pollution de scope SW.
- **Migration douce** : les utilisateurs déjà inscrits via VAPID seront re-promptés au prochain login (acceptation OneSignal). Pas de perte d'historique.
- **Auto-resubscribe** activé côté OneSignal → reconnexion transparente.

## Hors scope (livré plus tard si besoin)
- Mobile push natif via OneSignal SDK Capacitor (uniquement si tu ajoutes une app native).
- Segmentation avancée (tags pays, langue) — peut être ajoutée plus tard via `OneSignal.User.addTag()`.
- Suppression du code VAPID legacy (faire après 2-3 semaines de stabilité).
