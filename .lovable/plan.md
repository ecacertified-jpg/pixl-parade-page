

# Plan : Corriger la route `/anniversaire/:slug` → 404

## Problème

Les liens partagés depuis l'onboarding utilisent `/anniversaire/{slug}` mais la route définie dans `App.tsx` est `/birthday/:slug`. Résultat : 404.

## Solution

Deux corrections complémentaires :

### 1. `src/App.tsx` — Ajouter une route alias

Ajouter une route `/anniversaire/:slug` qui redirige vers `/birthday/:slug`, ou mieux, qui rend directement le composant `BirthdayPage` :

```typescript
<Route path="/anniversaire/:slug" element={<L><BirthdayPage /></L>} />
```

Cela rend les deux URLs valides (`/birthday/` et `/anniversaire/`).

### 2. `src/components/OnboardingExperience.tsx` — Harmoniser les URLs

Remplacer les 3 occurrences de `/anniversaire/` par `/birthday/` dans les fonctions de partage (`handleSharePageWhatsApp`, `handleSharePageSMS`, `handleCopyPageLink`) pour que les futurs liens soient cohérents avec la route principale.

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `src/App.tsx` | Ajouter route `/anniversaire/:slug` → `BirthdayPage` |
| `src/components/OnboardingExperience.tsx` | Remplacer `/anniversaire/` par `/birthday/` (3 endroits) |

