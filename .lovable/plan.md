

# Plan : Validation de doublon téléphone + messages informatifs

## Changements

### 1. `src/components/AddFriendModal.tsx`

**A. Prop pour les contacts existants**
- Ajouter une prop `existingPhones: string[]` pour recevoir la liste des numéros déjà dans le cercle d'amis

**B. Validation doublon avant soumission**
- Dans `handleSubmit`, normaliser le numéro (retirer espaces/tirets) et vérifier s'il existe déjà dans `existingPhones`
- Si doublon : afficher un toast d'erreur et bloquer la soumission

**C. Bannière informative**
- Ajouter un bloc d'information stylisé (Alert ou encadré coloré) en haut du formulaire avec 3 points :
  1. Les numéros de téléphone doivent être distincts entre contacts
  2. Plus d'amis = plus de chances de recevoir des cadeaux de grande valeur
  3. Possibilité de créer des sous-cercles pour maximiser les cadeaux reçus

### 2. `src/pages/Dashboard.tsx`

- Extraire la liste des numéros de téléphone des `friends` existants
- Passer cette liste en prop `existingPhones` à `AddFriendModal`

## Pas de changement DB nécessaire — validation côté client uniquement.

