

# Plan : Corriger le titre masque dans les etapes de l'onboarding

## Probleme

Le conteneur du contenu (ligne 265) utilise `items-center justify-center` qui centre verticalement le contenu. Quand le contenu est trop grand (comme l'etape "Gouts" avec sa grille de categories), le titre en haut est pousse hors de la zone visible.

## Solution

Remplacer `items-center justify-center` par `items-start` et ajouter du padding top pour que le contenu commence toujours depuis le haut de la zone disponible, sans etre masque par le header.

**`src/components/OnboardingExperience.tsx` — ligne 265**

Remplacer :
```tsx
<div className="relative z-10 flex-1 flex items-center justify-center px-4 overflow-y-auto">
```

Par :
```tsx
<div className="relative z-10 flex-1 flex items-start justify-center px-4 pt-6 overflow-y-auto">
```

Cela force le contenu a demarrer depuis le haut avec un espacement de `pt-6`, et le scroll vertical gere le debordement.

## Fichier concerne

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | `items-center` → `items-start` + `pt-6` |

