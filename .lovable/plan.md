

# Plan : Appliquer le correctif domaine de production aux autres fichiers

## Constat

`OnboardingExperience.tsx` a déjà le correctif `import.meta.env.PROD`. Mais d'autres fichiers génèrent aussi des liens d'invitation/parrainage avec `window.location.origin` sans correction :

| Fichier | Lignes | Lien généré |
|---------|--------|-------------|
| `InviteFriendsModal.tsx` | 71, 274 | `/auth?invited=true` |
| `ReferralCodes.tsx` | 34, 97 | `/auth?ref=CODE` |

## Solution

1. **Créer un utilitaire centralisé** `src/utils/appUrl.ts` :
```tsx
export const getAppBaseUrl = () =>
  import.meta.env.PROD ? 'https://joiedevivre-africa.com' : window.location.origin;
```

2. **Remplacer `window.location.origin`** par `getAppBaseUrl()` dans :
   - `InviteFriendsModal.tsx` (lignes 71, 274)
   - `ReferralCodes.tsx` (lignes 34, 97)
   - `OnboardingExperience.tsx` (ligne 182-184 — simplifier avec l'utilitaire)

## Remarque importante

En preview Lovable, le lien continuera à pointer vers le domaine de preview (comportement choisi). Sur le site publié, il pointera vers `joiedevivre-africa.com`.

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `src/utils/appUrl.ts` | Créer — utilitaire centralisé |
| `src/components/InviteFriendsModal.tsx` | Utiliser `getAppBaseUrl()` |
| `src/pages/ReferralCodes.tsx` | Utiliser `getAppBaseUrl()` |
| `src/components/OnboardingExperience.tsx` | Simplifier avec `getAppBaseUrl()` |

