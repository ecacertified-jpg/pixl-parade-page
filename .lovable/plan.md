
# Adapter les titres et compteurs au filtre pays actif

## Probleme

Le filtrage par pays fonctionne deja correctement (les requetes Supabase utilisent `.eq('country_code', selectedCountry)`). Cependant, les titres des tableaux ne refletent pas le pays selectionne :
- **Entreprises** : "Tous les prestataires (20)" meme quand seul le Benin est selectionne
- **Utilisateurs** : "Utilisateurs filtres" sans indication du pays

L'admin ne voit pas clairement qu'il consulte les donnees d'un pays specifique.

## Modifications

### 1. `src/pages/Admin/BusinessManagement.tsx`

- Importer `getCountryFlag` depuis `@/utils/countryFlags` et les configs pays
- Modifier le `CardTitle` (ligne 635-638) pour afficher le nom du pays quand un filtre est actif :
  - Sans filtre : "Tous les prestataires (20)"
  - Avec filtre BJ : "Prestataires - Benin (2)"
- Ajouter le drapeau emoji dans le titre

### 2. `src/pages/Admin/UserManagement.tsx`

- Modifier le `CardTitle` (ligne 472-474) pour afficher le pays :
  - Sans filtre : "Tous les utilisateurs (187)"
  - Avec filtre BJ : "Utilisateurs - Benin (5)"
- Ajouter le drapeau emoji dans le titre

### 3. Detail des changements de titre

Dans les deux fichiers, recuperer `selectedCountry` et `accessibleCountries` depuis `useAdminCountry()` (deja importe), puis construire un titre dynamique :

```
const countryName = selectedCountry 
  ? accessibleCountries.find(c => c.code === selectedCountry)?.name 
  : null;

// Titre dynamique
const tableTitle = countryName 
  ? `Prestataires - ${getCountryFlag(selectedCountry)} ${countryName}` 
  : 'Tous les prestataires';
```

## Impact

- 2 fichiers modifies
- Modification purement visuelle (les titres des CardTitle)
- Aucune modification de logique de filtrage (deja fonctionnel)
- L'admin saura immediatement quel pays il consulte
