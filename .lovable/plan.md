## Problème

Dans `src/components/birthday/messages/NewPostModal.tsx`, le `DialogContent` est en `flex-col` avec `max-h-[92vh]` et `overflow-hidden`. Toutes les sections sous les onglets (aperçu média, sélecteur de ton, textarea, vocal, identité visiteur, footer) sont en hauteur fixe. Sur un viewport mobile (628 px), il ne reste qu'environ 50 px pour le `TabsContent` scrollable — les GIFs/stickers/cartes sont à peine visibles et non sélectionnables.

## Correctif (UI/présentation uniquement)

1. **Passer le `DialogContent` en scroll global sur mobile** : retirer `overflow-hidden` + `flex flex-col`, laisser tout le contenu défiler verticalement. Conserver `flex` uniquement en `sm:` (desktop) où la hauteur est suffisante.

2. **Donner une hauteur minimale au panneau onglets** : appliquer `min-h-[280px]` (mobile) / `min-h-[340px]` (sm+) sur le wrapper `div.flex-1.overflow-y-auto` qui contient les `TabsContent`. Garantit une grille GIPHY/cartes utilisable même quand le reste est long.

3. **Compacter les sections basses sur mobile** pour réduire la pression verticale :
   - Réduire les paddings (`pt-3` → `pt-2`, `p-4` footer → `p-3`).
   - Le bloc "Visitor identity" et "Voice recorder" restent inchangés fonctionnellement.

4. **Conserver le sticky footer** (Annuler / Publier) accessible : sur mobile il devient un footer normal en fin de flux scrollable ; sur `sm:` il reste en bas du dialog.

## Fichiers modifiés

- `src/components/birthday/messages/NewPostModal.tsx` — uniquement les classes Tailwind sur `DialogContent`, le wrapper des `TabsContent`, et quelques paddings. Aucune logique métier, aucun changement de hook, aucune modif backend.

## Vérification

- Ouvrir `/birthday/:slug` en visiteur (non connecté), viewport 758×628.
- Cliquer "Nouveau post" → vérifier que la grille GIFs est entièrement visible et scrollable.
- Tester chaque onglet : Emoji (picker complet), Cartes, Stickers, Texte animé, YouTube, Photo.
- Vérifier desktop : layout inchangé.
