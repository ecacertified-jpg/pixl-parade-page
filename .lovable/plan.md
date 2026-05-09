## Objectif
Sur la carte « Compte à rebours d'anniversaire » (`BirthdayCountdownCard`), le bouton **Partager** copie/partage actuellement l'URL racine de l'app (`getAppBaseUrl()`). Le remplacer par le lien direct de la page d'anniversaire publiée de l'utilisateur (`/birthday/:slug`) pour un partage plus pertinent.

## Changements

### `src/components/BirthdayCountdownCard.tsx`
- Importer le hook `useMyBirthdayPageSlug` (déjà existant) pour récupérer le slug de la page publiée de l'année en cours.
- Dans le handler du bouton **Partager** :
  - Si un slug existe → construire l'URL `${getAppBaseUrl()}/birthday/${slug}` et l'utiliser dans `navigator.share` / `clipboard`.
  - Si aucun slug (page non publiée) → garder le fallback actuel (URL racine) **ou** afficher un toast invitant l'utilisateur à créer/publier sa page d'anniversaire avant de partager. Recommandation : utiliser l'URL racine en fallback silencieux pour ne pas bloquer l'action.
- Ajuster légèrement le texte viral pour rester cohérent (le message reste le même, seule l'URL change).

## Détails techniques
- Le hook `useMyBirthdayPageSlug` filtre déjà sur `celebration_year = currentYear`, `is_active = true` et `published_at` non null — exactement ce qu'on veut.
- Aucune modification backend, aucune autre carte impactée.
- Aucune nouvelle dépendance.
