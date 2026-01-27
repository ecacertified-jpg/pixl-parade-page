
Contexte et constat (d’après votre capture)
- Le modal “Produits de LUNE & LOOK” affiche bien “4 produits”, mais le dernier est coupé et on ne peut pas scroller correctement.
- Nous avons déjà ajouté `max-h-[60vh]` au `ScrollArea` et `pb-4` à la grille. Malgré ça, le scroll peut rester “cassé” à cause de deux points fréquents avec Radix + flex:
  1) Le `DialogContent` de shadcn ajoute par défaut `overflow-y-auto` (voir `src/components/ui/dialog.tsx`). Si on n’écrase pas ce style, c’est le contenu global du modal qui essaie de scroller, pas le `ScrollArea`, ce qui crée un comportement incohérent (double scroll / scroll capturé au mauvais niveau).
  2) En layout flex, un enfant scrollable doit souvent avoir `min-h-0` (sinon il ne “rétrécit” pas correctement et déborde au lieu d’activer le scroll).

Objectif
- Faire en sorte que la zone centrale (liste de produits) soit la seule zone scrollable, et que le footer (“4 produits” + bouton Fermer) reste toujours visible.
- Assurer que le dernier produit soit entièrement accessible.

Changements proposés (ciblés, sans refactor global)
1) Forcer le modal à ne pas scroller globalement (éviter le conflit avec ScrollArea)
   - Fichier: `src/components/admin/AdminProductsModal.tsx`
   - Modifier `DialogContent` pour écraser le `overflow-y-auto` par défaut de shadcn:
     - Ajouter `overflow-hidden`
     - Conserver le layout `flex flex-col` (déjà présent)
   - Exemple attendu:
     - Avant: `className="max-w-4xl max-h-[90vh] flex flex-col"`
     - Après: `className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"`

2) Rendre la zone ScrollArea “flex-compatible” et réellement scrollable
   - Fichier: `src/components/admin/AdminProductsModal.tsx`
   - Ajouter `min-h-0` sur le `ScrollArea` (très important en flex)
   - Conserver `flex-1` et éventuellement garder `max-h-[60vh]` si nécessaire (mais une fois `overflow-hidden` + `min-h-0` en place, `max-h` peut devenir optionnel).
   - Exemple attendu:
     - `className="min-h-0 flex-1 max-h-[60vh] pr-4"`

3) Vérification visuelle
   - Ouvrir le modal prestataire dans Super Admin
   - Vérifier:
     - Le footer reste visible (ne scrolle pas)
     - La grille scrolle correctement
     - Le 4e produit est entièrement visible en bas (le `pb-4` aide à éviter qu’il soit collé/coupé)

Risques / impacts
- Impact limité à `AdminProductsModal` (pas de changement global dans le composant Dialog partagé).
- Améliore la cohérence UX sur mobile/desktop, évite le double-scroll.

Critères d’acceptation
- Quand il y a 4+ produits, une barre de scroll apparaît dans la zone centrale et permet d’atteindre le dernier produit.
- Aucun produit n’est tronqué.
- Le bouton “Fermer” reste accessible sans scroller tout le modal.
