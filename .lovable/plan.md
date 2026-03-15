

# Plan : Onboarding actionnel en 3 étapes

## Objectif

Transformer le modal d'onboarding actuel (informatif seulement) en un parcours guidé qui mène directement l'utilisateur vers les actions clés après inscription.

## Étapes du nouvel onboarding

| Étape | Contenu | Action principale |
|-------|---------|-------------------|
| 1 - Bienvenue | Félicitations + explication rapide de la plateforme | → Suivant |
| 2 - Ajoutez vos amis | Expliquer l'importance du cercle d'amis, plus d'amis = meilleurs cadeaux | → "Ajouter mes amis" (navigue vers `/dashboard?tab=amis&add=true`) |
| 3 - Liste de souhaits | Expliquer que les proches verront vos souhaits | → "Créer ma liste" (navigue vers `/wishlist-catalog`) |

Chaque étape a aussi un bouton "Plus tard" pour passer.

## Changements

### 1. `src/components/OnboardingModal.tsx`

- **Refondre les 3 steps** avec le nouveau contenu orienté action :
  - Step 1 : Bienvenue (confetti conservé) — bouton "C'est parti !"
  - Step 2 : Cercle d'amis — icône Users, gradient orange, bouton principal "Ajouter mes amis" → navigue `/dashboard?tab=amis&add=true`, bouton secondaire "Plus tard" → passe à step 3
  - Step 3 : Liste de souhaits — icône Gift, gradient pink, bouton principal "Créer ma liste de souhaits" → navigue `/wishlist-catalog`, bouton secondaire "Plus tard" → complète l'onboarding
- **Ajouter une barre de progression** (composant `Progress`) en haut du modal pour montrer l'avancement (étape 1/3, 2/3, 3/3)
- Les navigations vers amis/wishlist appellent `onComplete()` avant de naviguer (marquer l'onboarding comme terminé)

### 2. `src/hooks/useOnboarding.ts`

- **Ajouter un tracking par étape** : stocker dans localStorage non pas juste `onboarding_completed` mais aussi `onboarding_step` pour que si l'utilisateur revient, il reprenne là où il s'est arrêté (step 2 ou 3)
- Exposer `currentStep` et `setCurrentStep` dans le hook

### 3. Aucun changement côté Dashboard ou routes

Les pages `/dashboard?tab=amis&add=true` et `/wishlist-catalog` existent déjà et fonctionnent.

## Résumé technique

- 2 fichiers modifiés : `OnboardingModal.tsx` (refonte UI/contenu), `useOnboarding.ts` (tracking step)
- Pas de changement DB
- Conservation des animations (confetti, framer-motion)
- Progression visuelle avec `Progress` component existant

