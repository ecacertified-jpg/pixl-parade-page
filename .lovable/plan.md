

## Corriger la redirection apres connexion depuis une cagnotte

### Probleme

Quand l'utilisateur clique "Contribuer a cette cagnotte", il est redirige vers `/auth?redirect=/f/{fundId}`. Mais dans `Auth.tsx`, le code de redirection (ligne 232-251) ne lit **jamais** le parametre `redirect` de l'URL. Il verifie uniquement `localStorage.getItem('returnUrl')`, qui n'est defini que par `ProtectedRoute.tsx` (quand un utilisateur non connecte tente d'acceder a une route protegee).

Resultat : le parametre `?redirect=/f/{fundId}` est ignore et l'utilisateur est redirige par `handleSmartRedirect` vers le dashboard (onglet AMIS par defaut).

### Solution

Modifier la logique de redirection dans `Auth.tsx` pour lire aussi le parametre `redirect` des query params de l'URL.

### Modification

**Fichier : `src/pages/Auth.tsx`** (lignes 232-251)

Ajouter la lecture de `searchParams.get('redirect')` comme source alternative de redirection :

```typescript
useEffect(() => {
  if (user) {
    const handleRedirect = async () => {
      const adminRef = searchParams.get('admin_ref') || sessionStorage.getItem('jdv_admin_ref');
      if (adminRef) {
        await processAdminAutoAssign(user.id);
      }

      // 1. Check returnUrl from localStorage (set by ProtectedRoute)
      const returnUrl = localStorage.getItem('returnUrl');
      // 2. Check redirect param from URL query string (set by FundPreview, etc.)
      const redirectParam = searchParams.get('redirect');

      if (returnUrl) {
        localStorage.removeItem('returnUrl');
        navigate(returnUrl);
      } else if (redirectParam) {
        navigate(redirectParam);
      } else {
        handleSmartRedirect(user, navigate);
      }
    };
    handleRedirect();
  }
}, [user, navigate, searchParams]);
```

### Impact

- Les liens "Contribuer" depuis FundPreview redirigeront correctement vers la cagnotte apres connexion
- Le comportement existant (returnUrl via ProtectedRoute, smart redirect par defaut) reste inchange
- Tout autre composant pourra utiliser `?redirect=/chemin` pour forcer une redirection apres authentification

