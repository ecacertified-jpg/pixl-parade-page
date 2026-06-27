## Objectif
Modifier le hero des pages d'événement mariage pour :
1. Positionner **verticalement** les 2 avatars de profil avec une légère superposition (au lieu de l'alignement horizontal actuel)
2. **Supprimer l'icône Cœur** entre les deux photos
3. **Libérer de l'espace horizontal** pour que le titre de l'événement soit moins tronqué
4. Rendre le titre **cliquable** pour afficher son texte complet (tooltip ou expansion)

## Fichiers concernés
- `src/components/event/EventHeroOverlay.tsx`

## Implémentation

### 1. Repositionnement vertical des avatars mariage
- Remplacer le conteneur flex horizontal (`flex items-center`) par une colonne (`flex flex-col items-center`)
- Appliquer un `margin-top: -8px` (ou `-0.5rem`) au second avatar pour créer la superposition harmonieuse
- Supprimer le composant `<Heart />` et son import
- Réduire légèrement la taille des avatars si nécessaire pour s'adapter à la nouvelle orientation sans augmenter la hauteur totale du hero

### 2. Adaptation du layout titre + countdown
- Le conteneur parent du hero (`flex items-end gap-3`) reste en horizontal : avatars à gauche, texte à droite
- La zone texte (`flex-1 min-w-0 pb-1`) gagne en largeur utilisable car les avatars occupent moins d'espace horizontal
- Le titre conserve ses classes (`text-xl md:text-3xl font-bold font-poppins text-white drop-shadow-lg truncate`)

### 3. Titre cliquable pour lecture complète
- Envelopper le `<h1>` du titre dans un `<button>` ou un élément cliquable
- Au clic, afficher le titre complet dans une petite modale / tooltip / toast (ex. `sonner` toast ou un état local d'expansion)
- Conserver le `truncate` par défaut ; l'état "expand" n'est activé que temporairement ou via un overlay
- Si solution la plus légère : utiliser l'attribut HTML natif `title` sur le h1 pour le tooltip navigateur, ou un composant Tooltip de shadcn/ui

### 4. Gestion responsive
- S'assurer que sur mobile (largeur < md), le titre ait suffisamment d'espace avec le nouvel empilement vertical des avatars
- Vérifier que le countdown reste bien positionné sous le titre sans chevauchement

## Non régression
- Les événements non-mariage (baptême, diplôme, etc.) conservent leur avatar unique horizontal existant
- Le style visuel global du hero (ombres, rings, couleurs) reste identique
