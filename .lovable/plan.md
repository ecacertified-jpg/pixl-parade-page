# Préserver l'action utilisateur après auth

## Constat

Non, ce n'est pas le comportement attendu. La logique de retour existe (`AuthGateContext` enregistre `jdv_pending_intent` + `localStorage.returnUrl`, `ProtectedRoute` enregistre `returnUrl`, `handleSmartRedirect` les honore), **mais plusieurs chemins de `src/pages/Auth.tsx` court-circuitent cette logique et redirigent en dur vers `/dashboard`** :

- `Auth.tsx:839` — vérification OTP réussie (signin & signup) → `navigate('/dashboard?onboarding=true' | '/dashboard')`
- `Auth.tsx:1245` — inscription email réussie → `navigate('/dashboard?onboarding=true')`
- Ces deux chemins ne lisent que `searchParams.get('redirect')` et ignorent :
  - le param URL `returnTo` (utilisé par `AuthGateContext`)
  - le `sessionStorage.jdv_pending_intent`
  - le `localStorage.returnUrl`

Résultat : un visiteur qui clique "Écrire un message" / "Uploader une photo" sur une page d'anniversaire est envoyé sur la modale d'auth → après OTP/email, il atterrit sur `/dashboard` et perd la page d'origine.

## Proposition

Unifier **un seul utilitaire de redirection post-auth** et l'appeler depuis tous les points de succès d'auth. Conformément au choix produit déjà acté ("rejouer l'action et rester sur la page"), on ramène l'utilisateur sur l'URL d'origine ; il n'a qu'à recliquer sur le bouton (la modale d'auth ne ressurgira plus puisqu'il est connecté).

### 1. Étendre `src/utils/authRedirect.ts`

Ajouter `resolvePostAuthPath(user, searchParams)` qui résout dans cet ordre :

1. `searchParams.get('returnTo')` (si commence par `/` et ≠ `/auth`)
2. `sessionStorage.jdv_pending_intent.returnTo` (puis purge)
3. `localStorage.returnUrl` (puis purge)
4. `searchParams.get('redirect')` (compat existante, y compris cas `create-fund` avec `occasion` / `beneficiaryName`)
5. `localStorage.last_visited_route` si ≠ `/`, `/auth`
6. `getRedirectPath(user)` (business vs `/dashboard`)

Pour les nouveaux utilisateurs (`isNewUser`), si le path résolu n'a pas déjà `onboarding=true` et ne vise pas `/dashboard`, **ne pas forcer** l'onboarding : l'utilisateur a une intention concrète, on l'y ramène. L'onboarding obligatoire reste déclenché par `useOnboarding` une fois sur la page (overlay), ce qui préserve le parcours obligatoire sans perdre le contexte.

### 2. Brancher partout dans `src/pages/Auth.tsx`

Remplacer les `navigate('/dashboard…')` en dur des chemins suivants par `resolvePostAuthPath` :

- ligne ~839 (vérif OTP SMS — signin/signup)
- ligne ~1245 (signup email)
- bloc `useEffect` ligne ~302 (déjà partiellement correct, à harmoniser pour utiliser la même fonction et lire aussi `returnTo` URL param)

### 3. Côté composants d'action (visiteur)

Vérifier que **toutes** les actions visiteur passent par `useAuthGate().requireAuth(...)` (qui pose déjà `returnTo = location.pathname + location.search`). Auditer rapidement :

- upload photo/vidéo album anniversaire
- écrire un message / souhait
- réagir / commenter (déjà fait)
- contribuer à une cagnotte
- ajouter au panier

Pour chaque bouton "action personnelle" sur une page publique encore branché directement sur `navigate('/auth')`, le remplacer par `requireAuth(intent, action, { returnTo })`.

### 4. Côté "Connexion" / "S'inscrire" depuis le header public

Quand l'utilisateur clique manuellement sur "Connexion" ou "S'inscrire" depuis le header d'une page publique (ex. page anniversaire visitée), passer `returnTo=<url courante>` dans l'URL `/auth?...`. Cela couvre le cas où l'utilisateur ne clique pas sur une action mais veut juste se connecter avant d'agir.

## Détails techniques

```text
[Page publique]
  └─ action visiteur (upload/écrire/…) 
       └─ AuthGate ouvre modale
             └─ navigate('/auth?tab=signup&returnTo=<currentUrl>&intent=…')
                   └─ pose sessionStorage.jdv_pending_intent + localStorage.returnUrl
                         └─ après OTP/email/Google → resolvePostAuthPath()
                               └─ navigate(<currentUrl>)
                                     └─ user revient sur la page, peut re-cliquer
```

## Hors périmètre

- Pas de re-déclenchement automatique de l'action (choix produit déjà acté : "rejouer l'action et rester sur la page").
- Pas de modification de la logique d'onboarding obligatoire (`useOnboarding`) : elle reste déclenchée en overlay sur la page de destination.
- Pas de changement des routes ni du modèle de données.

## Fichiers impactés (estimation)

- `src/utils/authRedirect.ts` — ajout `resolvePostAuthPath`
- `src/pages/Auth.tsx` — 3 points de redirection unifiés
- 1–3 composants d'action visiteur si certains shuntent encore `AuthGate` (à confirmer après audit ciblé)
- éventuellement header public (`Landing`, `BirthdayPage`) pour propager `returnTo` sur "Connexion" / "S'inscrire"
