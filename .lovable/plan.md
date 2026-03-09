

## Plan : Aligner BusinessAuth.tsx avec Auth.tsx pour la détection de doublons serveur

### Problème actuel
`BusinessAuth.tsx` utilise un appel `fetch()` direct vers l'edge function `check-existing-account` (ligne 1192), tandis que `Auth.tsx` utilise le hook `useAccountLinking` qui encapsule proprement `supabase.functions.invoke()`. De plus, le flux téléphone de BusinessAuth utilise uniquement `useDuplicateAccountDetection` (client-side) sans la vérification serveur.

### Modifications

**Fichier : `src/pages/BusinessAuth.tsx`**

1. Importer `useAccountLinking` depuis `@/hooks/useAccountLinking`
2. Initialiser `const { checkExistingAccount } = useAccountLinking();`
3. **`handleEmailSignUp`** (ligne ~1190-1206) : Remplacer le bloc `fetch()` direct par `checkExistingAccount(undefined, data.email, data.firstName)`
4. **`sendOtpSignUp`** (ligne ~789-801) : Ajouter la vérification serveur via `checkExistingAccount(fullPhone, undefined, data.firstName)` avant le `checkForDuplicate` client-side, identique au pattern de Auth.tsx

Pas de nouveau fichier, pas de migration DB. Uniquement un refactoring d'appel dans BusinessAuth.tsx.

