
# Ajouter la Vue Plein Écran des Images dans la Boutique

## Objectif

Permettre aux utilisateurs de cliquer sur un bouton (icône d'expansion) pour voir l'image du produit en plein écran dans la page Shop, comme c'est déjà le cas dans les pages vendeur (`/boutique/:businessId`).

## Diagnostic

| Page | Fonctionnalité d'agrandissement |
|------|--------------------------------|
| `VendorShop.tsx` | ✅ Bouton Expand avec `FullscreenGallery` |
| `Shop.tsx` | ❌ Aucun bouton, juste l'image cliquable |

## Solution

Ajouter un bouton "Expand" (icône `Expand` de Lucide) sur chaque carte produit dans `Shop.tsx` qui ouvrira le composant `FullscreenGallery` avec toutes les images du produit.

## Modifications Techniques

### Fichier : `src/pages/Shop.tsx`

**1. Importer le composant FullscreenGallery et l'icône**

```typescript
import { FullscreenGallery } from "@/components/FullscreenGallery";
import { Expand } from "lucide-react"; // Déjà disponible via Play
```

**2. Ajouter un état pour gérer la galerie plein écran**

```typescript
// État pour la galerie plein écran
const [fullscreenProduct, setFullscreenProduct] = useState<{
  images: string[];
  name: string;
} | null>(null);
```

**3. Ajouter le bouton Expand sur chaque carte produit**

Dans la grille de produits (ligne ~730), ajouter un bouton entre le bouton Share et le bouton Favoris :

```tsx
{/* Expand Button */}
<Button 
  variant="ghost" 
  size="icon" 
  className="absolute top-2 right-[5.5rem] bg-white/80 hover:bg-white transition-all h-8 w-8 rounded-full z-10"
  onClick={(e) => {
    e.stopPropagation();
    setFullscreenProduct({
      images: product.images || [product.image],
      name: product.name
    });
  }}
>
  <Expand className="h-4 w-4" />
</Button>
```

**4. Ajouter le composant FullscreenGallery à la fin du JSX**

Après les modaux existants (VideoPlayer, ProductShareMenu) :

```tsx
{/* Fullscreen Gallery */}
<FullscreenGallery
  images={fullscreenProduct?.images || []}
  alt={fullscreenProduct?.name || "Produit"}
  initialIndex={0}
  isOpen={!!fullscreenProduct}
  onClose={() => setFullscreenProduct(null)}
/>
```

## UI Résultante

Sur chaque carte produit, l'utilisateur verra :
- **Position top-2 right-2** : Bouton Favoris ❤️
- **Position top-2 right-12** : Bouton Partage 📤
- **Position top-2 right-22** : **Nouveau** Bouton Expand ⛶

Quand l'utilisateur clique sur le bouton Expand :
1. Le `FullscreenGallery` s'ouvre avec un fond noir
2. L'image est affichée en grand avec possibilité de zoom
3. Si le produit a plusieurs images, l'utilisateur peut naviguer entre elles
4. Les raccourcis clavier fonctionnent (← → pour naviguer, Esc pour fermer)
5. Des miniatures sont affichées en bas pour la navigation

## Fichier à Modifier

| Fichier | Modification |
|---------|--------------|
| `src/pages/Shop.tsx` | Ajouter import, état, bouton Expand et composant FullscreenGallery |

## Compatibilité

- ✅ Fonctionne sur mobile (tap pour ouvrir)
- ✅ Fonctionne sur desktop (clic + navigation clavier)
- ✅ Support du zoom par pincement (mobile) et boutons (desktop)
- ✅ Réutilise le composant `FullscreenGallery` existant
