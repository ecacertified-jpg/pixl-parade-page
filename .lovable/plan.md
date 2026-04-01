
Plan : diagnostiquer et corriger la vraie cause de l’erreur OTP persistante

## Conclusion rapide

Non, le problème ne ressemble pas principalement à un mauvais alignement du template WhatsApp avec Supabase.

Ce que j’ai pu confirmer :
- `send-whatsapp-otp` répond bien `200 success`
- le client vérifie bien avec la méthode `whatsapp`
- le payload template actuel est cohérent avec la documentation Meta pour un template “copy code” :
  - `type: "template"`
  - `components.body` avec le code
  - `components.button` avec le même code

Donc si le code d’envoi était mal aligné avec le template, l’échec apparaîtrait surtout à l’envoi. Or ici l’envoi réussit, et l’erreur apparaît à la vérification.

## Vrai problème probable

Le bug le plus probable est que `verify-whatsapp-otp` retourne une erreur serveur non-2xx, mais l’UI l’affiche à tort comme “Code invalide”.

Preuve dans le code :
- `src/pages/Auth.tsx` et `src/pages/BusinessAuth.tsx` font :
  - `if (error || !result?.success) => toast "Code invalide"`
- donc un `500 internal_error` est actuellement masqué comme une erreur de code

Cela explique très bien :
- pourquoi le message WhatsApp arrive
- pourquoi le bon canal est utilisé
- pourquoi l’utilisateur voit quand même “Code invalide”

## Ce que je corrigerais

### 1. Corriger l’affichage d’erreur côté client
Dans :
- `src/pages/Auth.tsx`
- `src/pages/BusinessAuth.tsx`

Modifier la gestion de `supabase.functions.invoke('verify-whatsapp-otp')` pour :
- distinguer un vrai `400 invalid_code`
- d’un `500 internal_error` ou autre erreur serveur
- afficher un message utilisateur correct :
  - `Code invalide ou expiré` seulement pour les erreurs métier
  - `Erreur temporaire de vérification, veuillez réessayer` pour les erreurs serveur

Impact :
- on ne confondra plus un crash serveur avec un mauvais OTP

### 2. Durcir `verify-whatsapp-otp`
Dans `supabase/functions/verify-whatsapp-otp/index.ts`, renforcer les zones fragiles après la validation du code :
- lookup utilisateur
- création utilisateur
- `updateUserById`
- `generateLink`
- extraction du token
- création de session

Ajouter :
- logs structurés à chaque étape critique
- `requestId` renvoyé dans les erreurs serveur
- réponses JSON explicites par type d’échec

Objectif :
- identifier précisément l’étape qui casse réellement

### 3. Vérifier la stratégie de session utilisée après OTP
La zone la plus sensible est la partie :
- email synthétique `@phone.joiedevivre.app`
- `generateLink({ type: 'magiclink' })`
- `verifyOtp({ token_hash, type: 'magiclink' })`

C’est probablement là que se produit le crash si le code OTP lui-même est déjà trouvé.

Je garderais l’architecture actuelle, mais je la sécuriserais avec :
- validation stricte des données retournées
- fallback propre si `action_link` ou `token`/`token_hash` n’est pas présent
- message serveur explicite au lieu d’un simple échec générique

### 4. Confirmer la version réellement déployée
Le fait qu’aucun log n’apparaisse pour `verify-whatsapp-otp` malgré l’appel côté client suggère aussi un point à vérifier :
- soit la fonction déployée ne correspond pas exactement au code lu
- soit le logging actuel n’est pas suffisant sur la version active

Je prévoirais donc dans l’implémentation :
- redéploiement propre de `verify-whatsapp-otp`
- puis retest immédiat du flux OTP

### 5. Vérifier les deux écrans
Tester après correction :
- `src/pages/Auth.tsx`
- `src/pages/BusinessAuth.tsx`

Scénarios :
- envoi WhatsApp puis collage du code
- retour depuis WhatsApp vers l’app
- code invalide réel
- erreur serveur simulée
- renvoi du code avant/après cooldown

## Fichiers concernés

| Fichier | Action |
|---|---|
| `src/pages/Auth.tsx` | Ne plus transformer toute erreur serveur en “Code invalide” |
| `src/pages/BusinessAuth.tsx` | Même correction |
| `supabase/functions/verify-whatsapp-otp/index.ts` | Ajouter logs, requestId, erreurs explicites, durcir la création de session |

## Résultat attendu

Après correction :
- si le code est réellement faux, l’utilisateur voit une erreur OTP correcte
- si le serveur casse, l’utilisateur voit une erreur technique temporaire adaptée
- on identifie enfin la vraie étape en échec dans `verify-whatsapp-otp`
- on confirme ou écarte définitivement l’hypothèse “template WhatsApp mal aligné”

## Réponse à votre question

Mon diagnostic est :
- le template WhatsApp semble globalement correctement aligné
- le problème est beaucoup plus probablement dans la phase de vérification/session côté Edge Function
- et surtout dans le fait que le front masque actuellement toute erreur backend en “Code invalide”
