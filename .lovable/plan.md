## Problèmes constatés

1. **Notification en anglais** ("Subscribe to our notifications…") : c'est le **slidedown natif d'OneSignal**, affiché en plus de notre belle modale française `PushNotificationPrompt`. Il s'affiche parce que `OneSignal.init()` est appelé sans désactiver explicitement le prompt automatique.
2. **Bouton "Envoyer notification de test" introuvable** : il existe bien (page **Paramètres → Notifications**, `/notification-settings`), mais il n'apparaît que si `isSubscribed === true`. Et il n'est pas accessible depuis le Dashboard.

## Plan

### 1. Désactiver le slidedown natif OneSignal (`src/lib/onesignal.ts`)
Ajouter à `OneSignal.init({...})` :
```ts
promptOptions: { slidedown: { prompts: [] } },
notifyButton: { enable: false },
autoResubscribe: true,
autoRegister: false,
```
Résultat : plus aucun pop-up anglais. Seule notre modale française `PushNotificationPrompt` déclenche `requestPermission()`.

### 2. Rendre la modale française plus persuasive (`src/components/PushNotificationPrompt.tsx`)
- Titre plus émotionnel : « 🎁 Ne ratez aucun anniversaire »
- 3 bénéfices clairs avec icônes (Anniversaires, Cagnottes, Messages de gratitude)
- Mention rassurante : « Vous pouvez désactiver à tout moment. »
- CTA principal : « Activer » ; secondaire : « Plus tard »
- Garder le localStorage `push_prompted_${user.id}` pour ne pas réafficher.

### 3. Améliorer l'accès au test
- Sur la page **Notification Settings**, afficher le bouton **« Envoyer une notification de test »** même si `isSubscribed` est `false` mais que `permission === 'granted'` (cas où le player_id n'est pas encore remonté), avec message d'aide.
- Ajouter, dans la modale après activation réussie, un toast avec lien « Tester maintenant » → `/notification-settings`.

### 4. Vérification
Après publication :
- Visiter le site → seule la modale française apparaît
- Accepter → toast de succès + lien vers le test
- Aller dans Paramètres → bouton « Tester » visible et fonctionnel

## Fichiers modifiés
- `src/lib/onesignal.ts` (désactivation slidedown natif)
- `src/components/PushNotificationPrompt.tsx` (copy + design)
- `src/pages/NotificationSettings.tsx` (condition d'affichage du bouton test)
- `src/hooks/usePushNotifications.ts` (toast avec lien après subscribe)

Aucun changement de schéma DB, aucune migration.
