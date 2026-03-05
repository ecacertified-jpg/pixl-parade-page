

# Harmoniser les hauteurs des cartes Expériences

## Problème

Les cartes du carrousel "Expériences Premium" ont des hauteurs différentes car le contenu textuel (description, catégorie, prix) varie d'une carte à l'autre. La description utilise `line-clamp-2` mais si une carte n'a pas de description, elle est plus courte.

## Solution

Appliquer une structure à hauteur fixe sur chaque carte en utilisant `flex` et en forçant les zones de contenu à occuper un espace constant :

### Fichier : `src/components/FeaturedExperiencesCarousel.tsx`

1. **Card** : ajouter `h-full` pour que toutes les cartes prennent la hauteur du conteneur
2. **CardContent** : utiliser `flex flex-col h-full` pour structurer verticalement
3. **Description** : toujours rendre le `<p>` même sans description (avec `min-h-[2.5rem]` + `line-clamp-2`) pour réserver l'espace
4. **Metadata row** : ajouter `min-h-[1.5rem]` pour uniformiser
5. **Footer prix/bouton** : utiliser `mt-auto` pour le pousser en bas de la carte

Cela garantit que toutes les cartes ont exactement la même hauteur, quel que soit le contenu.

