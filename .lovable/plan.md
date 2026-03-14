

# Plan : Filtrer les cagnottes existantes par occasion

## Problème

Actuellement, quand on vérifie les cagnottes existantes pour un bénéficiaire, **toutes** les cagnottes actives sont remontées quel que soit l'événement. Résultat : si une cagnotte "anniversaire" existe, l'alerte s'affiche même quand on veut créer une cagnotte "mariage" — ce qui est un faux doublon.

## Solution

Filtrer les résultats de `useExistingFundsForBeneficiary` par l'**occasion** de la cagnotte en cours de création. Une cagnotte "anniversaire" existante ne doit pas bloquer la création d'une cagnotte "mariage" pour le même bénéficiaire.

## Changements

### 1. `src/hooks/useExistingFundsForBeneficiary.ts`

- Ajouter un paramètre optionnel `occasion?: string` à `checkFundsByContactId` et `checkFundsByUserId`
- Quand `occasion` est fourni, ajouter `.eq('occasion', occasion)` aux requêtes Supabase
- Si `occasion` n'est pas fourni, comportement inchangé (rétro-compatible)

### 2. `src/components/CollaborativeGiftModal.tsx`

- Le flow actuel ajoute au panier sans sélection d'occasion explicite (l'occasion est déterminée implicitement comme "anniversaire")
- Pas de changement nécessaire ici pour l'instant — l'occasion par défaut sera passée

### 3. `src/components/BusinessCollaborativeGiftModal.tsx`

- Vérifier comment l'occasion est définie dans `create_business_collective_fund` et la passer au check

### 4. `src/components/ExistingFundsAlert.tsx`

- Afficher l'occasion de chaque cagnotte existante dans la carte (badge) pour que l'utilisateur voie clairement pourquoi l'alerte s'affiche

## Impact

Minimal — seul le filtrage des requêtes est modifié. Aucun changement de schéma DB nécessaire puisque la colonne `occasion` existe déjà sur `collective_funds`.

