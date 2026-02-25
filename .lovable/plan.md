

# Nettoyage automatique des sessions corrompues (bad_jwt)

## Probleme

L'erreur `bad_jwt: missing sub claim` survient quand un token JWT corrompu ou invalide est stocke dans le localStorage du navigateur. Les requetes Supabase echouent avec une erreur 403, mais l'utilisateur reste bloque car le code ne nettoie pas automatiquement ces sessions invalides.

## Solution

Ajouter un mecanisme de detection et nettoyage automatique dans `AuthContext.tsx` a deux niveaux :

1. **Au demarrage** : quand `getSession()` retourne une erreur, deconnecter proprement et vider le state
2. **En continu** : quand `onAuthStateChange` recoit un evenement `TOKEN_REFRESHED` qui echoue ou un `SIGNED_OUT` inattendu
3. **Sur les requetes** : ajouter une fonction utilitaire `handleAuthError` qui detecte les erreurs `bad_jwt` / `missing sub` et force un sign-out + redirect

## Fichiers modifies

### 1. `src/contexts/AuthContext.tsx`

Modifications dans le `useEffect` principal :

- Dans `getSession().then(...)` : si une erreur est retournee (token corrompu), appeler `supabase.auth.signOut()` pour nettoyer le localStorage et remettre user/session a null
- Dans `onAuthStateChange` : intercepter les evenements avec session null quand on attendait une session, et logger pour diagnostic
- Dans `refreshSession` : si l'erreur contient `bad_jwt` ou `missing sub`, forcer un `signOut()` au lieu de simplement mettre le state a null
- Ajouter une nouvelle fonction `cleanupCorruptedSession` qui :
  - Appelle `supabase.auth.signOut()`
  - Nettoie les cles `sb-*` du localStorage en fallback
  - Remet user/session a null

### 2. `src/utils/authErrorHandler.ts` (nouveau)

Fonction utilitaire reutilisable :

```text
isCorruptedSessionError(error) -> boolean
  Detecte les erreurs : 'bad_jwt', 'missing sub', 'invalid claim'

handleAuthError(error, signOut) -> boolean
  Si erreur de session corrompue, force signOut et retourne true
```

### 3. `src/pages/Checkout.tsx`

Utiliser `isCorruptedSessionError` dans le bloc existant qui detecte deja les erreurs JWT (ligne ~111) pour nettoyer automatiquement au lieu de simplement verifier la session.

## Flux de nettoyage

```text
App demarre
  |
  v
getSession() -> erreur?
  |         |
  non       oui -> signOut() + nettoyer localStorage + redirect /auth
  |
  v
Session OK -> requete API -> erreur bad_jwt?
  |                            |
  non                          oui -> signOut() + toast "Session expiree" + redirect /auth
  |
  v
refreshSession() -> erreur bad_jwt?
                      |
                      oui -> signOut() + nettoyer
```

## Impact utilisateur

- Un utilisateur avec une session corrompue sera automatiquement deconnecte avec un toast explicatif en francais
- Il pourra se reconnecter immediatement sans intervention manuelle
- Aucun impact sur les utilisateurs avec des sessions valides

