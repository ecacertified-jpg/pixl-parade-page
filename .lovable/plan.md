
# Corriger le pays dans le modal de modification admin

## Probleme

Le composant `AdminEditBusinessModal` passe `countryCode="CI"` en dur au `LocationPicker`. Quand un admin modifie une boutique beninoise (comme "Ese Shop"), le selecteur de localisation affiche "Cote d'Ivoire" au lieu du "Benin".

## Solution

3 modifications dans `src/components/admin/AdminEditBusinessModal.tsx` :

### 1. Ajouter `country_code` a l'interface `Business`

Ajouter le champ `country_code: string | null` dans l'interface `Business` pour que le composant recoive cette information.

### 2. Ajouter `country_code` au `formData`

Inclure `country_code` dans l'etat du formulaire, initialise depuis `business.country_code` (avec fallback sur `"CI"`).

### 3. Passer le bon `countryCode` au `LocationPicker`

Remplacer `countryCode="CI"` par `countryCode={formData.country_code || "CI"}` pour que le selecteur d'adresse affiche le bon pays.

## Impact

- 1 seul fichier modifie : `src/components/admin/AdminEditBusinessModal.tsx`
- Aucune modification de base de donnees
- Les boutiques de chaque pays afficheront desormais le bon pays dans le modal de modification
