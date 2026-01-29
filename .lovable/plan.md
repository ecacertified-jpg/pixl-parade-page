
# Corriger le Scroll du Modal "Gérer les Produits" sur Mobile

## Problème

Dans le modal `AdminProductsModal`, il est impossible de scroller pour voir les produits en bas de liste sur mobile. L'utilisateur voit les premiers produits mais ne peut pas accéder aux suivants.

## Diagnostic

| Élément | Problème identifié |
|---------|-------------------|
| `DialogContent` | Utilise `overflow-hidden` qui bloque le scroll |
| `ScrollArea` | Hauteur max de `60vh` trop restrictive sur mobile |
| Structure flex | Le `flex-1` et `min-h-0` ne fonctionnent pas correctement avec la hauteur fixe |

## Solution

Restructurer le modal pour permettre un scroll natif fiable sur mobile :

1. **Retirer `overflow-hidden`** du DialogContent
2. **Ajuster la hauteur du ScrollArea** pour mobile avec des classes responsive
3. **Ajouter un conteneur scrollable** avec une hauteur calculée qui s'adapte mieux à l'espace disponible

## Modifications Techniques

### Fichier : `src/components/admin/AdminProductsModal.tsx`

**Ligne 99 - DialogContent** : Changer les classes pour permettre le scroll

```typescript
// Avant
<DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

// Après
<DialogContent className="max-w-4xl max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
```

**Ligne 117 - ScrollArea** : Améliorer les classes de hauteur pour mobile

```typescript
// Avant
<ScrollArea className="min-h-0 flex-1 max-h-[60vh] pr-4">

// Après  
<ScrollArea className="min-h-0 flex-1 max-h-[50vh] sm:max-h-[60vh] pr-4 overflow-y-auto">
```

**Alternative plus robuste** : Remplacer ScrollArea par un div scrollable natif pour mobile

```typescript
// Solution plus robuste pour mobile
<div className="min-h-0 flex-1 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pr-2">
  {/* Contenu de la grille */}
</div>
```

## Comportement Attendu

| Device | Résultat |
|--------|----------|
| Mobile | Scroll tactile fluide, peut voir tous les produits |
| Tablet | Scroll adapté à la taille d'écran |
| Desktop | Scroll avec molette/trackpad + scrollbar visible |

## Fichier à Modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/admin/AdminProductsModal.tsx` | Ajuster les classes de hauteur et overflow |
