
# Transformer les suggestions en carousel horizontal swipeable sur mobile

## Objectif
Sur mobile, afficher les suggestions d'utilisateurs sous forme de cartes individuelles dans un carousel horizontal swipeable (au lieu d'une liste verticale). Sur desktop, conserver la liste verticale actuelle.

## Fichier modifie

### `src/components/UserSuggestionsSection.tsx`

1. **Importer les composants carousel** : `Carousel, CarouselContent, CarouselItem` depuis `@/components/ui/carousel`
2. **Importer `useIsMobile`** depuis `@/hooks/use-mobile`

3. **Refactorer le rendu des suggestions** :
   - Extraire le contenu de chaque suggestion dans un sous-composant ou une fonction `renderSuggestionCard`
   - Sur mobile (`isMobile`), envelopper les cartes dans un `Carousel` horizontal avec `CarouselContent` et `CarouselItem`
   - Sur desktop, conserver le rendu vertical actuel (`space-y-3`)

4. **Design des cartes carousel (mobile)** :
   - Chaque `CarouselItem` contient une carte verticale compacte (au lieu du layout horizontal actuel)
   - Layout de la carte :
     ```text
     ┌─────────────────┐
     │    [Avatar]      │  <-- centre, plus grand (w-16 h-16)
     │     [Badge 🎂]   │
     │   Nom Prenom     │
     │   🇨🇮 Pays       │
     │   "Raison..."    │
     │  [Ami] [Suivre]  │
     │      [✕]         │
     └─────────────────┘
     ```
   - Largeur de chaque carte : `basis-[75%]` pour laisser voir la carte suivante (effet peek)
   - Fond avec gradient subtil `from-primary/5 to-secondary/5`
   - Coins arrondis `rounded-xl`, padding `p-4`

5. **Indicateurs de pagination** : ajouter des petits dots sous le carousel indiquant la position actuelle (via l'API embla `selectedScrollSnap`)

6. **Skeleton loading (mobile)** : afficher 2 cartes skeleton dans un carousel au lieu de 3 lignes

## Aucun autre fichier modifie
- Les composants `Carousel` et `useIsMobile` existent deja
- Pas de nouveau hook ou utilitaire necessaire
