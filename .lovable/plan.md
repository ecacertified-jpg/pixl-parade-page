

# Plan : Afficher automatiquement la page créée dans le fil d'actualités

## Problème

Quand un utilisateur crée sa page d'anniversaire via l'onboarding ("Créer ma page"), elle n'apparaît pas visiblement dans le fil d'actualités car :
- La page est créée sans photos ni cagnotte
- Le tri actuel place les pages avec contenu en premier → la nouvelle page se retrouve noyée parmi 160+ autres pages vides

## Solution

Deux changements :

### 1. `usePagesFeed.ts` — Prioriser les pages de l'utilisateur connecté

Ajouter un niveau de priorité dans le tri : les pages créées par l'utilisateur connecté apparaissent **toujours en premier**, quel que soit leur contenu.

```typescript
feedPages.sort((a, b) => {
  // User's own pages always first
  const aIsOwn = user?.id && a.creator.user_id === user.id ? 1 : 0;
  const bIsOwn = user?.id && b.creator.user_id === user.id ? 1 : 0;
  if (bIsOwn !== aIsOwn) return bIsOwn - aIsOwn;
  
  // Then pages with content
  const aHasContent = (a.album_count > 0 || a.cover_image_url || a.fund) ? 1 : 0;
  const bHasContent = (b.album_count > 0 || b.cover_image_url || b.fund) ? 1 : 0;
  if (bHasContent !== aHasContent) return bHasContent - aHasContent;
  
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
});
```

### 2. `PageFeedCard.tsx` — Badge "Ma page" pour l'utilisateur

Ajouter un badge visuel "Ma page" sur les cartes appartenant à l'utilisateur connecté, pour qu'il repère immédiatement sa page dans le fil.

## Fichiers concernés

| Fichier | Changement |
|---------|------------|
| `src/hooks/usePagesFeed.ts` | Priorité de tri pour les pages de l'utilisateur |
| `src/components/PageFeedCard.tsx` | Badge "Ma page" si le créateur est l'utilisateur connecté |

