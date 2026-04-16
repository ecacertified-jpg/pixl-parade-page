

# Plan : Rediriger "Accueil" vers la bonne page d'accueil

## Problème

L'onglet "Accueil" dans la bottom bar navigue vers `/index` (ancienne page avec WelcomeSection + ActionCards), alors que la vraie page d'accueil souhaitée est `/home` (avec WhatDoYouWantCard, carrousels, fil d'actualité).

## Changement — `src/components/RecentActivitySection.tsx`

Modifier la navigation et l'état actif de l'onglet "Accueil" :

```typescript
// Avant
isActive: location.pathname === "/" || location.pathname === "/index",
onClick: () => navigate("/index")

// Après
isActive: location.pathname === "/" || location.pathname === "/home",
onClick: () => navigate("/home")
```

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/components/RecentActivitySection.tsx` | Changer `/index` → `/home` pour l'onglet Accueil |

