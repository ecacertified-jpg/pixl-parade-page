

# Plan : Rendre le champ catégorie obligatoire dans les formulaires produit

## Constat

3 formulaires de création/modification de produits existent :

| Formulaire | Validation catégorie | Statut |
|---|---|---|
| `AddProductModal.tsx` (business) | Oui, lignes 177-184 | OK |
| `EditProductModal.tsx` (business) | Non, ligne 147 ne vérifie que name/price | A corriger |
| `AdminAddProductModal.tsx` (admin) | Non, ligne 160 ne vérifie que business/name/price | A corriger |

## Modifications

### 1. `src/components/EditProductModal.tsx`

Ajouter une validation catégorie dans `handleSubmit` (après ligne 150) :
- Si `useCustomCategory` et pas de `business_category_id` → toast erreur
- Si catégorie prédéfinie et pas de `category_name` → toast erreur
- Ajouter un indicateur visuel `*` sur le label catégorie (ligne ~386)

### 2. `src/components/admin/AdminAddProductModal.tsx`

- Ajouter une validation dans `handleSubmit` (après ligne 163) : si pas de `category_id` → toast erreur
- Remplacer le label "Catégorie" par "Catégorie *" (ligne ~395)
- Aussi ajouter `category_name` dans l'insert (ligne ~217) en résolvant le nom depuis la liste des catégories, pour que le mapping taste fonctionne

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `src/components/EditProductModal.tsx` | Ajouter validation catégorie obligatoire |
| `src/components/admin/AdminAddProductModal.tsx` | Ajouter validation catégorie obligatoire + label `*` |

