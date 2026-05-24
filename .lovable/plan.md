## Objectif
Rendre la carte « Messages d'anniversaire » visuellement harmonieuse et corriger les soucis de scroll dans le modal « Créer ma carte ».

## 1. Header harmonisé de `MessageWall.tsx`
Aligner sur le style du header « Cadeau collectif » : titre sur une seule ligne avec icône à gauche, compteur discret, bouton CTA à droite qui ne casse pas le titre.

- Restructurer le header en deux lignes sur mobile pour éviter le retour à la ligne du titre :
  - Ligne 1 : `Heart` + titre `Messages d'anniversaire` (font-poppins, semibold) + badge `(0)` en pill discrète
  - Ligne 2 : bouton « + Nouveau post » pleine largeur sur mobile, auto sur desktop (`w-full sm:w-auto sm:ml-auto`)
- Le bouton ne se chevauche plus avec le titre, et le titre n'est plus coupé en 2 morceaux désalignés.
- La barre recherche + tri reste en dessous, inchangée fonctionnellement.

## 2. Onglets scrollables du `NewPostModal.tsx` (Stickers, YouTube, etc.)
Le `ScrollArea` actuel autour du `TabsList` ne scrolle pas horizontalement sur mobile car `whitespace-nowrap` seul ne déclenche pas la scrollbar et le fade gradient masque la zone scrollable.

- Remplacer le `ScrollArea` par un conteneur natif `overflow-x-auto` avec `scrollbar-thin` masquée et `-webkit-overflow-scrolling: touch`, qui fonctionne de manière fiable sur mobile.
- Ajouter `flex-nowrap` + `min-w-max` sur `TabsList`.
- Garder le fade gradient à droite **uniquement** comme indicateur visuel (pointer-events-none).
- Ajouter un petit chevron `→` discret animé à droite pour suggérer le scroll au premier rendu, qui disparaît après scroll.

Résultat : l'utilisateur fait glisser horizontalement et voit Stickers, Texte animé, YouTube, Photo.

## 3. Cartes de vœux scrollables verticalement (onglet « Cartes »)
Actuellement la liste de cartes (`CardTemplates`) s'étend et fait grandir le contenu du modal, ce qui pousse la zone hors écran.

- Donner au conteneur des cartes une **hauteur maximale fixe** (`max-h-[55vh]`) et un `overflow-y-auto` interne, de sorte que le scroll des cartes se fasse à l'intérieur sans agrandir la `<Card>` Messages d'anniversaire ni le modal.
- Conserver la grille `grid-cols-2 sm:grid-cols-3` et le filtre catégories au-dessus (sticky en haut du scroll interne).
- Appliquer la même approche aux autres pickers grille (GIFs, Stickers, Texte animé) : `max-h-[50vh] overflow-y-auto` pour éviter que les grilles longues poussent les onglets et le bouton Publier hors-écran.

## Détails techniques

- Fichier `src/components/birthday/messages/MessageWall.tsx` : restructurer le bloc `<div className="flex items-center gap-2 mb-3">` en deux rangées flex, classes responsive Tailwind.
- Fichier `src/components/birthday/messages/NewPostModal.tsx` :
  - Remplacer `<ScrollArea>` ligne 221 par `<div className="overflow-x-auto no-scrollbar -mx-1 px-1">` + utilitaire CSS `no-scrollbar` (ajouter dans `src/index.css` si absent).
  - `TabsList` : ajouter `flex-nowrap min-w-max`.
  - Dans `CardTemplates` : envelopper la grille dans `<div className="max-h-[55vh] overflow-y-auto pr-1">` ; rendre la barre catégories sticky `sticky top-0 bg-background/95 backdrop-blur z-10 py-1`.
  - Dans `GiphyGrid` : envelopper la grille dans `<div className="max-h-[50vh] overflow-y-auto pr-1">`.

## Hors scope
- Pas de changement de logique de modération, d'upload ou de publication.
- Pas de modification du edge function `post-birthday-message`.
- Pas de modification du schéma `birthday_card_templates`.
