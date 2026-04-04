

# Plan : Ajouter un compteur de produits aux catégories de goût dans VendorShop

## Constat

- **Shop.tsx** : a déjà `getTasteCount()` et affiche `{taste.label} ({count})` — rien à faire.
- **VendorShop.tsx** : affiche uniquement `{taste.label}` sans compteur dans les deux onglets (produits et expériences).

## Modification

### `src/pages/VendorShop.tsx`

1. Ajouter une fonction `getTasteCount(tasteId, isExperience)` qui compte les produits correspondant au goût pour l'onglet courant :

```typescript
const getTasteCount = (tasteId: string, isExperience: boolean) => {
  return products.filter(p => 
    p.isExperience === isExperience && matchesTaste(p.categoryName, tasteId)
  ).length;
};
```

2. Dans les deux blocs `TASTE_CATEGORIES.map` (lignes ~352-366 et ~407-421), ajouter le compteur au label du bouton :

```
{taste.label} ({getTasteCount(taste.id, false)})   // onglet produits
{taste.label} ({getTasteCount(taste.id, true)})     // onglet expériences
```

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/pages/VendorShop.tsx` | Ajouter `getTasteCount` + afficher le compteur sur chaque bouton filtre |

