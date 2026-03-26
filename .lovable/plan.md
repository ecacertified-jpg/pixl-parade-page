

# Plan : Transmettre le paramètre `?for=` via le redirect `/go/birthday`

## Problème

Le redirect dans `App.tsx` est statique :
```tsx
<Route path="/go/birthday" element={<Navigate to="/auth?tab=signup&redirect=create-fund&occasion=birthday&utm_source=deep_link" replace />} />
```

Quand le template WhatsApp envoie `/go/birthday?for=Françoise`, le paramètre `?for=` est perdu car `<Navigate>` écrase tous les query params.

Ensuite, après login, `Auth.tsx` (ligne 273) fait `navigate(redirectParam)` qui navigue vers `create-fund` — sans le paramètre `for`.

## Changement — `src/App.tsx`

Remplacer le `<Navigate>` statique par un petit composant wrapper `DeepLinkRedirect` qui :

1. Lit les query params de l'URL actuelle (ex: `?for=Françoise`)
2. Les transmet au redirect vers `/auth` en ajoutant `&beneficiaryName=Françoise`
3. Après login, `Auth.tsx` redirige vers `create-fund?occasion=birthday&beneficiaryName=Françoise`

Concrètement :
- Créer un composant inline `DeepLinkRedirect` qui utilise `useSearchParams` pour capturer `for` et le passer comme `beneficiaryName` dans l'URL auth
- Modifier le redirect `Auth.tsx` (ligne 272-273) pour inclure les query params `occasion` et `beneficiaryName` quand `redirectParam === 'create-fund'`

## Changement — `src/pages/Auth.tsx`

Ligne 272-273 : quand `redirectParam` est `create-fund`, construire l'URL de redirection avec les params `occasion` et `beneficiaryName` depuis `searchParams`.

## Fichiers modifiés

- `src/App.tsx` — composant `DeepLinkRedirect` + remplacement du `<Navigate>` statique
- `src/pages/Auth.tsx` — transmission des query params lors du redirect post-login

