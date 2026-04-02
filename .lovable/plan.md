

# Plan : Flèche "Suivant" rouge et très visible dans l'onboarding

## Modification

### Fichier : `src/components/OnboardingExperience.tsx` (lignes 372-384)

Transformer le bouton flèche droite (ChevronRight) en un bouton rouge vif, plus grand, avec un fond coloré permanent et une animation pulsante :

- Fond `bg-red-500` avec texte blanc quand actif
- Taille du bouton augmentée (`p-2.5` au lieu de `p-1.5`)
- Icône plus grande (`h-7 w-7`)
- Ombre `shadow-lg shadow-red-500/40` pour l'effet "marqué"
- Animation `animate-pulse` en plus du bounce
- Bordure `ring-2 ring-red-300` pour renforcer la visibilité

Le bouton désactivé (dernière étape) reste grisé comme actuellement.

