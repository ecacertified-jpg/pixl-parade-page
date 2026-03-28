

# Plan : Corriger le titre masque par la barre de navigation

## Probleme

La barre de navigation (fleches + label "Gouts 3/5") chevauche le titre de l'etape car le header (`z-10`) et le contenu (`z-10`) se superposent. Le contenu commence sous le header mais ne laisse pas assez d'espace pour la zone de navigation ajoutee.

## Solution

Ajouter un `pb-3` au conteneur du header (ligne 214) pour que la barre de navigation ait son espace, et le contenu scrollable en dessous ne soit pas chevauche.

**`src/components/OnboardingExperience.tsx` — ligne 214**

Remplacer :
```tsx
<div className="relative z-10 p-4 pb-0">
```

Par :
```tsx
<div className="relative z-20 p-4 pb-3 bg-background">
```

Cela :
- Augmente le `z-index` du header a `z-20` (au-dessus du contenu `z-10`)
- Ajoute `pb-3` pour espacer sous les fleches
- Ajoute `bg-background` pour que le header ne soit pas transparent et ne laisse pas le contenu visible en dessous

## Fichier concerne

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Corriger z-index et padding du header |

