
# Correction de l'affichage des produits dans AdminProductsModal

## Problème identifié

Le modal "Produits de LUNE & LOOK" affiche 4 produits mais le 4ème produit en bas est partiellement visible et non accessible par scroll. L'image montre que le produit est coupé en bas du modal.

### Cause technique

Le composant `ScrollArea` de Radix UI ne fonctionne pas correctement avec `flex-1` seul. Le composant nécessite une **hauteur explicite ou calculable** pour que le scroll interne fonctionne. Actuellement :

```text
DialogContent (max-h-[90vh], flex flex-col)
  └── DialogHeader
  └── Button container (mb-4)
  └── ScrollArea (flex-1, pr-4)  <-- Manque de hauteur définie
        └── Grid de produits
  └── Footer (pt-4, border-t)
```

Le `flex-1` sans contrainte de hauteur sur le parent ne permet pas au `ScrollArea.Viewport` de calculer sa zone de scroll.

---

## Solution proposée

Modifier le `ScrollArea` pour lui donner une hauteur maximale explicite et ajouter un padding bottom pour garantir que le dernier élément soit entièrement visible.

### Modifications dans `AdminProductsModal.tsx`

**Ligne 117** - Remplacer :
```typescript
<ScrollArea className="flex-1 pr-4">
```

Par :
```typescript
<ScrollArea className="flex-1 max-h-[60vh] pr-4">
```

**Alternative plus robuste** - Utiliser une approche avec `overflow-y-auto` natif :

```typescript
<div className="flex-1 overflow-y-auto pr-4 max-h-[60vh]">
  {/* contenu de la grille */}
</div>
```

Et ajouter un padding-bottom à la grille pour éviter que le dernier produit soit coupé :

**Ligne 136** - Modifier la grille :
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
```

---

## Changements détaillés

| Fichier | Ligne | Modification |
|---------|-------|--------------|
| `AdminProductsModal.tsx` | 117 | Ajouter `max-h-[60vh]` au ScrollArea |
| `AdminProductsModal.tsx` | 136 | Ajouter `pb-4` à la grille pour padding en bas |

---

## Résultat attendu

Après cette correction :
- Le 4ème produit sera visible en scrollant vers le bas
- Une barre de scroll verticale apparaîtra quand il y a plus de 3 produits (sur les écrans standards)
- Le dernier produit aura suffisamment d'espace en bas pour être entièrement visible
- L'expérience utilisateur sera améliorée avec un scroll fluide

---

## Impact

- Fichier unique modifié : `AdminProductsModal.tsx`
- Pas d'impact sur les autres composants
- Correction applicable immédiatement
