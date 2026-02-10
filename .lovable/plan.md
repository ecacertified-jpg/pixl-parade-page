

# Renforcer la persistance du filtre pays via URL

## Diagnostic

Le code actuel est architecturalement correct :
- `handleNavigate` dans CountryDetailPage ajoute `?country=BJ` a l'URL
- `AdminCountryContext` lit ce parametre au montage via `useState(() => ...)`
- `fetchUsers` filtre par `country_code` quand `selectedCountry` est defini

Cependant, il peut exister un probleme de synchronisation (race condition) entre :
1. Le remontage du `AdminCountryProvider` (dans `AdminLayout`)
2. Le premier appel a `fetchUsers` dans `UserManagement`

Le `useEffect([selectedCountry])` peut se declencher avant que le context soit pleinement synchronise, provoquant un appel avec `selectedCountry = null`.

## Solution : double securite

### 1. `src/pages/Admin/UserManagement.tsx`

- Modifier `fetchUsers` pour lire directement le query parameter comme fallback si `selectedCountry` est null :

```
const fetchUsers = async () => {
  const countryFilter = selectedCountry || searchParams.get('country');
  // ...
  if (countryFilter) {
    query = query.eq('country_code', countryFilter);
  }
};
```

- S'assurer que le `useEffect` de synchronisation URL-vers-context se declenche aussi quand `searchParams` change (pas seulement au montage)

### 2. `src/pages/Admin/BusinessManagement.tsx`

- Meme logique de fallback sur le query parameter dans `fetchBusinesses`

### 3. `src/pages/Admin/UserManagement.tsx` et `BusinessManagement.tsx`

- Adapter le `backPath` du `AdminPageHeader` pour utiliser aussi le fallback :

```
const activeCountry = selectedCountry || searchParams.get('country');
const backPath = activeCountry ? `/admin/countries/${activeCountry}` : '/admin';
```

- Utiliser `activeCountry` aussi pour le titre dynamique et le bouton "Retour au pays"

## Impact

- 2 fichiers modifies
- Aucune modification de base de donnees
- Le filtre est garanti : meme si le context n'est pas encore synchronise, le query parameter est lu directement
- Le flux fonctionne de maniere fiable dans tous les cas de timing
