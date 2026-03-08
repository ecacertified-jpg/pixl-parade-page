

## Constat

Le flux `handleAddFriend` dans `UserSuggestionsSection.tsx` insere bien un contact dans la table `contacts`, mais **n'invalide pas le cache React Query** du dashboard (`['dashboard-data', user?.id]`). Le nouveau contact n'apparait donc pas dans le cercle d'amis tant que l'utilisateur ne recharge pas la page.

## Correction

### `src/components/UserSuggestionsSection.tsx`

1. Importer `useQueryClient` de `@tanstack/react-query`
2. Appeler `queryClient.invalidateQueries({ queryKey: ['dashboard-data'] })` apres l'insertion reussie du contact dans `handleAddFriend`

```typescript
// After the supabase.from('contacts').insert(...)
queryClient.invalidateQueries({ queryKey: ['dashboard-data', user.id] });
```

Cela garantit que le cercle d'amis se met a jour immediatement apres l'ajout.

### Fichier concerne
- `src/components/UserSuggestionsSection.tsx` uniquement

