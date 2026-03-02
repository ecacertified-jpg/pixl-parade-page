
# Ajouter un badge gateau pour les anniversaires proches

## Objectif
Afficher un petit badge avec une icone gateau sur l'avatar des utilisateurs suggeres dont l'anniversaire est dans les 14 prochains jours.

## Fichier modifie

### `src/components/UserSuggestionsSection.tsx`

1. **Importer `Cake`** depuis `lucide-react`
2. **Detecter l'anniversaire proche** : verifier `suggestion.days_until_birthday` (deja fourni par le hook quand l'anniversaire est dans les 30 jours, `null` sinon)
3. **Ajouter un badge superpose sur l'avatar** : envelopper le composant `Avatar` dans un `div` relatif et ajouter un petit cercle positionne en bas a droite contenant l'icone `Cake` quand `days_until_birthday` est entre 1 et 14

Rendu visuel :
```text
  ┌──────────┐
  │  Avatar  │
  │          │
  └────[🎂]──┘   <-- petit badge rose/accent en bas a droite
```

Le badge sera :
- Un cercle de 20x20px avec fond `bg-gift` (rose) et icone blanche
- Positionne en `absolute -bottom-1 -right-1`
- Avec un `ring-2 ring-background` pour separer visuellement du avatar
- Un tooltip au survol affichant "Anniversaire dans X jours"

Aucun autre fichier n'est modifie. Le champ `days_until_birthday` est deja calcule et retourne par `useUserSuggestions`.
