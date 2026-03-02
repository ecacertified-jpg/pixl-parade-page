
# Corriger le chargement lent du Dashboard

## Probleme identifie

Le Dashboard est extremement lent a cause d'un **bug de boucle infinie** dans le hook `useFriendsCircleBadgeCelebration`. Les logs reseau montrent **20+ requetes identiques** a `user_badges` par seconde.

### Cause racine

Dans `src/hooks/useFriendsCircleBadgeCelebration.ts` (ligne 112), le `useEffect` a des dependances instables :

```text
useEffect(() => { ... }, [user, friendCircleBadgeKeys, getCelebratedBadges, checkForNewBadge]);
```

- `friendCircleBadgeKeys` (ligne 14) est recree a chaque render via `.map()` -- nouvelle reference a chaque fois
- `getCelebratedBadges` et `checkForNewBadge` dependent l'un de l'autre via `useCallback`, creant une cascade de recreations
- Resultat : le `useEffect` se relance en boucle, chaque execution declenchant un re-render qui relance le cycle

## Corrections prevues

### 1. `src/hooks/useFriendsCircleBadgeCelebration.ts` -- Stabiliser les dependances

- **Memoriser `friendCircleBadgeKeys`** avec `useMemo` au lieu d'un simple `.map()` a chaque render
- **Utiliser `useRef`** pour `getCelebratedBadges` au lieu de `useCallback` (les fonctions de lecture localStorage n'ont pas besoin d'etre reactives)
- **Simplifier les dependances du `useEffect`** a `[user?.id]` uniquement, en accedant aux valeurs courantes via refs
- Cela eliminera completement la boucle de requetes

### 2. `src/hooks/useFriendsCircleBadgeCelebration.ts` -- Dupliquer le canal realtime

Le hook cree un canal `'friend-circle-badges'` avec un nom fixe. Si le hook est monte 2 fois (Dashboard + Home), cela cree un conflit. Ajouter un suffixe unique au nom du canal.

## Impact attendu

- Reduction de ~20 requetes/seconde a 1 seule requete au montage
- Temps de chargement du Dashboard significativement ameliore
- Suppression de l'erreur "Lock broken by another request with the 'steal' option" (liee aux requetes concurrentes excessives)

## Details techniques

Le fichier `useFriendsCircleBadgeCelebration.ts` sera refactorise pour :
1. Deplacer `FRIEND_CIRCLE_BADGES.map(b => b.key)` dans un `useMemo(() => ..., [])` 
2. Remplacer les `useCallback` imbriques par des refs ou des fonctions inline dans le `useEffect`
3. Reduire les dependances du `useEffect` principal a `[user?.id]`
