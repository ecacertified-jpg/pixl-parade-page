
# Corriger le badge "Initié par commerce" et ajouter la date de création

## Problème 1 : Badge "Initié par commerce" affiché à tort

La cagnotte de Françoise pour Marie Belle affiche "Initié par commerce" alors qu'elle a été créée par Françoise (un utilisateur). La cause se trouve dans `useCollectiveFunds.ts` ligne 180 :

```
const isBusinessInitiated = !!fund.created_by_business_id || !!businessFundData;
```

Le `!!businessFundData` est trop permissif : il suffit qu'un produit d'un commerce soit lié à la cagnotte (via `business_collective_funds`) pour que le badge s'affiche. Or, lier un produit ne signifie pas que le commerce a **initié** la cagnotte.

**Correction** : ne garder que `!!fund.created_by_business_id` comme condition. Si le champ `created_by_business_id` est null, la cagnotte n'a PAS été initiée par un commerce, même si un produit business y est associé.

## Problème 2 : Aucune date de création affichée

L'utilisateur ne sait pas quand la cagnotte a été créée. Le champ `created_at` est déjà récupéré dans la requête (utilisé pour le tri) mais n'est pas transmis à l'interface.

**Corrections** :
1. Ajouter `createdAt: string` à l'interface `CollectiveFund` dans `useCollectiveFunds.ts`
2. Mapper `fund.created_at` vers `createdAt` dans la transformation
3. Afficher la date de création dans `CollectiveFundCard.tsx`, sous le nom du bénéficiaire, au format "Créée le 28 fév. 2026"

## Fichiers modifiés

### `src/hooks/useCollectiveFunds.ts`
- Ligne 180 : retirer `|| !!businessFundData` de la condition `isBusinessInitiated`
- Ajouter `createdAt?: string` à l'interface `CollectiveFund` (ligne 32)
- Ajouter `created_at` au select query (déjà implicitement récupéré)
- Ajouter `createdAt: fund.created_at` dans l'objet de retour (ligne 204)

### `src/components/CollectiveFundCard.tsx`
- Importer `format` depuis `date-fns` et `fr` depuis `date-fns/locale/fr`
- Sous la ligne "Pour: {fund.beneficiaryName}" (ligne 218), ajouter la date de création formatée : "Créée le 28 fév. 2026"
- Affichée en texte discret (`text-xs text-muted-foreground`)
