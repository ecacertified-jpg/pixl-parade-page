
# Ajouter une colonne Pays dans les tableaux Utilisateurs et Entreprises

## Objectif

Afficher le pays de chaque utilisateur et entreprise directement dans les tableaux d'administration, permettant une identification visuelle rapide par pays (drapeau + code).

## Constat

Le filtrage par pays fonctionne deja correctement via `AdminCountryContext` (les donnees sont bien filtrees cote requete Supabase). Cependant, **aucune colonne "Pays" n'est visible dans les tableaux**, ce qui empeche l'admin de distinguer visuellement les utilisateurs/entreprises par pays, notamment quand le filtre est sur "Tous les pays".

## Modifications

### 1. `src/pages/Admin/UserManagement.tsx` - Ajouter colonne Pays

**Table desktop** :
- Ajouter un `<TableHead>Pays</TableHead>` entre "Utilisateur" et "Telephone"
- Ajouter une cellule affichant le drapeau emoji via `getCountryFlag(user.country_code)` + le code pays
- Afficher "N/A" si `country_code` est null

**Vue mobile** :
- Ajouter le drapeau a cote du nom de l'utilisateur pour une identification rapide

### 2. `src/pages/Admin/BusinessManagement.tsx` - Ajouter colonne Pays

**Table desktop** :
- Ajouter un `<TableHead>Pays</TableHead>` entre "Nom du business" et "Type"
- Afficher le drapeau + code pays via `getCountryFlag(business.country_code)`

**Vue mobile (si applicable)** :
- Ajouter le drapeau dans la vue carte mobile

### 3. Import requis

- Importer `getCountryFlag` depuis `@/utils/countryFlags` dans les deux fichiers

## Rendu visuel attendu

Les colonnes afficheront un format compact :

```
| Pays     |
|----------|
| CI       |
| BJ       |
| SN       |
```

Avec le drapeau emoji devant le code pays pour une lecture rapide.

## Impact

- 2 fichiers modifies : `UserManagement.tsx` et `BusinessManagement.tsx`
- Aucune modification de requete (le `country_code` est deja selectionne dans les deux pages)
- Visuel coherent avec les drapeaux utilises partout dans l'admin
