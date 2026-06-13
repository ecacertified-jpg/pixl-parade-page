# Fix — Prompt notifications push

## Diagnostic

1. **Le bandeau anglais "Subscribe to our notifications…"** vu dans la capture est le *slidedown natif OneSignal v16*, configuré côté **Dashboard OneSignal** (Web Configuration → Slide Prompt). Dans la v16 du SDK, `promptOptions.slidedown.prompts` passé à `init()` **n'écrase plus** la configuration dashboard — c'est pour ça qu'il s'affiche malgré `autoRegister: false`.
2. **Initialisation trop précoce** : `src/main.tsx` appelle `initOneSignal()` au boot, donc le SDK se lance même pour les visiteurs anonymes sur la page publique `/` → le slidedown dashboard apparaît.
3. **La modale FR `PushNotificationPrompt`** n'est montée que dans `src/pages/Dashboard.tsx` (utilisateur connecté). Sur la home publique de la capture, elle ne peut donc pas s'afficher — d'où l'impression qu'elle "ne marche pas".
4. Le **toast post-activation avec bouton « Tester »** existe déjà dans `usePushNotifications.subscribe()` et redirige bien vers `/notification-settings` — rien à refaire, mais il ne se déclenche jamais tant que le point 3 bloque l'activation.

## Changements code

### 1. `src/main.tsx`
- Retirer l'appel `initOneSignal()` au boot. Le SDK ne sera plus chargé tant que l'utilisateur n'a pas explicitement cliqué « Activer ».

### 2. `src/lib/onesignal.ts`
- Ajouter `autoPrompt: false` sur chaque prompt (sécurité v16) et garder `autoRegister: false`.
- Conserver l'init paresseuse via `initOneSignal()` appelée uniquement depuis `subscribe()` / settings.

### 3. `src/hooks/usePushNotifications.ts`
- Ne plus appeler `initOneSignal()` dans le `useEffect` initial. On expose `isSupported` via une heuristique légère (`'serviceWorker' in navigator && 'PushManager' in window` + pas en iframe preview) **sans** charger OneSignal.
- L'init réelle ne se fait qu'à `subscribe()` (geste utilisateur) ou à l'ouverture de `/notification-settings`.

### 4. `src/components/PushNotificationPrompt.tsx`
- Inchangé fonctionnellement, mais s'assurer qu'il ne déclenche pas `initOneSignal` tant que l'utilisateur n'a pas cliqué « Activer ».

### 5. Affichage de la modale FR aussi pour les visiteurs connectés sur la home
- Monter `<PushNotificationPrompt>` dans un composant global réservé aux utilisateurs **authentifiés** (ex. dans `App.tsx` derrière `useAuth().user`), avec la même garde `localStorage[push_prompted_${user.id}]` + délai 8s, pour qu'il s'affiche sur n'importe quelle page (pas seulement Dashboard).
- **Important** : pas d'affichage pour les visiteurs anonymes (conforme à la stratégie produit : opt-in après inscription).

## Action manuelle requise (hors code)

Dans **OneSignal Dashboard → Settings → Web Configuration → Permission Prompt Setup** :
- Désactiver **"Slide Prompt"** (et "Native Prompt" auto) afin que le bandeau anglais ne soit plus envoyé par OneSignal lui-même.

Sans cette désactivation côté dashboard, le slidedown anglais peut continuer d'apparaître pour les comptes qui ont déjà chargé le SDK une fois (cache SW). Je documenterai ça dans le plan d'implémentation.

## Vérification

1. Charger `/` en navigation privée non connecté → aucun bandeau OneSignal.
2. Se connecter → après ~8s, la modale FR avec 3 bénéfices + mention « Vous pouvez désactiver à tout moment » s'affiche.
3. Cliquer « Activer » → permission navigateur → toast vert avec bouton « Tester » → clic → redirection `/notification-settings`.
