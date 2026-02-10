
# Rendre les cartes pays cliquables dans le dashboard admin

## Constat

La route `/admin/countries/:countryCode` et la page `CountryDetailPage` existent deja. Il suffit de rendre les cartes cliquables pour naviguer vers cette page.

## Modification

### `src/components/admin/CountryStatsCards.tsx`

- Ajouter `useNavigate` de `react-router-dom`
- Ajouter un `onClick` et `cursor-pointer` sur chaque `Card`
- Naviguer vers `/admin/countries/{code}` au clic

```tsx
import { useNavigate } from 'react-router-dom';

// Dans le composant :
const navigate = useNavigate();

// Sur chaque Card :
<Card
  key={country.code}
  className="hover:shadow-md transition-shadow cursor-pointer"
  onClick={() => navigate(`/admin/countries/${country.code}`)}
>
```

## Impact

- 1 seul fichier modifie : `CountryStatsCards.tsx`
- Ajout de 3 lignes (import, hook, onClick)
- Navigation vers la page de detail pays existante
