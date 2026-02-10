
# Corriger la redirection vers /home lors du clic sur les cartes pays

## Probleme identifie

Quand vous cliquez sur la carte "Utilisateurs 5" du Benin, le flux suivant se produit :

1. Navigation vers `/admin/users?country=BJ`
2. Un **nouveau** composant `AdminRoute` se monte avec un **nouveau** hook `useAdmin()`
3. `useAdmin` re-interroge la base de donnees pour verifier votre statut admin
4. Pendant un bref instant, `loading` passe a `false` alors que `isAdmin` est encore `false` (condition de course)
5. `AdminRoute` vous redirige vers `/` (racine)
6. La page Landing detecte que vous etes connecte et vous redirige vers `/home`

Le probleme fondamental : chaque page admin cree une **nouvelle instance** de `useAdmin()` qui re-verifie le statut admin depuis la base, ce qui cree une fenetre de temps ou le systeme pense que vous n'etes pas admin.

## Solution

Creer un **AdminAuthContext** qui persiste le statut admin en memoire entre les navigations, au lieu de re-interroger la base a chaque changement de route.

### 1. Creer `src/contexts/AdminAuthContext.tsx`

Un context React place en haut de l'arbre des composants (dans App.tsx, au-dessus des routes) qui :
- Appelle `useAdmin()` **une seule fois** au montage
- Stocke le resultat (isAdmin, adminRole, permissions, assignedCountries) de facon persistante
- Expose ces valeurs a tous les composants enfants sans re-fetch

### 2. Modifier `src/components/AdminRoute.tsx`

Au lieu d'appeler `useAdmin()` directement (ce qui cree un hook local), utiliser le context `AdminAuthContext` qui contient deja l'etat admin valide.

```text
Avant:
  AdminRoute monte → useAdmin() → query DB → brief false → redirect /

Apres:
  AdminRoute monte → useAdminAuth() (context) → etat deja charge → pas de redirect
```

### 3. Modifier `src/App.tsx`

Envelopper les routes admin avec `AdminAuthProvider` au meme niveau que `AuthProvider`, pour que le context persiste entre les navigations.

### 4. Alternative plus simple (recommandee)

Au lieu de creer un nouveau context, simplement modifier `AdminRoute` pour ne pas rediriger tant que le hook `useAdmin` n'a pas fait au moins un appel reussi. Concretement :

- Ajouter un flag `hasChecked` dans `useAdmin` qui passe a `true` seulement apres le premier `checkAdminStatus` complet
- Dans `AdminRoute`, ne rediriger que si `!loading && hasChecked && !isAdmin`
- Tant que `hasChecked` est `false`, afficher le spinner de chargement

Cela garantit qu'aucune redirection ne se produit avant que la verification admin soit reellement terminee.

## Modifications techniques

### Fichier 1 : `src/hooks/useAdmin.ts`

- Ajouter un state `hasChecked` initialise a `false`
- Le passer a `true` dans le `finally` de `checkAdminStatus`
- L'exposer dans le retour du hook

### Fichier 2 : `src/components/AdminRoute.tsx`

- Recuperer `hasChecked` depuis `useAdmin()`
- Modifier la condition de redirection : `if (!loading && hasChecked && !isAdmin)` au lieu de `if (!isAdmin)`
- Tant que `!hasChecked`, afficher le spinner (comme pour `loading`)

## Impact

- 2 fichiers modifies
- Aucune modification de base de donnees
- Le filtre pays via URL (`?country=BJ`) continuera de fonctionner
- Les boutons "Retour au pays" et "Effacer le filtre" restent fonctionnels
- La verification admin se fait toujours, mais sans redirection prematuree
