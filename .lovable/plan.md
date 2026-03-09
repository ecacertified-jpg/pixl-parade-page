

## Plan : Modifier la fenêtre d'édition à 48h + transition automatique de statut

Le mécanisme existe déjà (hook `useEditRating`, modal `EditRatingModal`, bouton dans `Orders.tsx`). Il faut ajuster deux choses :

### 1. Réduire la fenêtre d'édition de 7 jours à 48 heures

**Fichier : `src/hooks/useEditRating.ts`**
- Changer `EDIT_WINDOW_DAYS = 7` en `EDIT_WINDOW_HOURS = 48`
- Adapter `canEditReview` et `getRemainingDays` → `getRemainingHours` pour calculer en heures au lieu de jours
- Mettre à jour les messages d'erreur ("48 heures" au lieu de "7 jours")

### 2. Transition automatique de statut lors du changement de catégorie

**Fichier : `src/hooks/useEditRating.ts`** (dans `updateRating`)
- Supprimer la restriction qui empêche de passer de ≥3 à <3
- Ajouter la logique de transition automatique :
  - Si `newRating < 3` et ancien statut `receipt_confirmed` → mettre à jour le statut en `refund_requested` + remplir `refund_reason` et `refund_requested_at`
  - Si `newRating >= 3` et ancien statut `refund_requested` → remettre le statut en `receipt_confirmed` + effacer `refund_reason`
- Notifier via toast du changement de statut

### 3. Adapter le modal et l'affichage

**Fichier : `src/components/EditRatingModal.tsx`**
- Supprimer `minAllowedRating` — toutes les étoiles sont cliquables
- Afficher le temps restant en heures au lieu de jours
- Ajouter un avertissement si le client change de catégorie (≥3 → <3 ou inverse) : message explicatif avant soumission

**Fichier : `src/pages/Orders.tsx`**
- Adapter l'affichage du temps restant (heures au lieu de jours)

### Fichiers impactés
- `src/hooks/useEditRating.ts`
- `src/components/EditRatingModal.tsx`
- `src/pages/Orders.tsx`

