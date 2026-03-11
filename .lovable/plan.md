

# Plan : Sélecteur de pays dans la Boutique

## Problème actuel

La boutique utilise un toggle binaire (`CountryFilterToggle`) : "Mon pays" ou "Tous". L'utilisateur ne peut pas choisir un pays spécifique parmi les pays disponibles.

## Solution

Remplacer le `CountryFilterToggle` par un **sélecteur de pays dédié** (dropdown) dans le header de la boutique. Ce sélecteur :

- Liste tous les pays configurés (CI, BJ, SN, TG, ML, BF) + option "Tous les pays"
- Sélectionne par défaut le pays de l'utilisateur (`profileCountryCode` ou `'CI'`)
- Filtre les produits affichés selon le pays sélectionné

## Modifications

### `src/pages/Shop.tsx`

1. Ajouter un state local `selectedCountryFilter` initialisé à `profileCountryCode || 'CI'`
2. Remplacer le `CountryFilterToggle` (ligne 450) par un `Select` dropdown avec les pays depuis `COUNTRIES` config
3. Remplacer la logique `activeCountryFilter` (ligne 264) pour utiliser `selectedCountryFilter` (`null` si "all")
4. Afficher le drapeau + nom du pays dans le trigger du Select

### Aperçu UI

Le sélecteur remplace le toggle compact existant, à côté du `CitySelector`. Il affiche le drapeau du pays sélectionné et permet de choisir parmi tous les pays ou un pays spécifique.

```text
[🔍 Rechercher un lieu    ] [🇨🇮 Côte d'Ivoire ▾]
```

### Fichier impacté

| Fichier | Changement |
|---------|-----------|
| `src/pages/Shop.tsx` | Remplacer toggle par Select pays, state local, filtre adapté |

