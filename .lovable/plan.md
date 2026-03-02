
# Ajouter une confirmation avant la suppression d'une cagnotte

## Probleme

Le bouton suppression (icone poubelle) sur la carte de cagnotte supprime directement sans avertissement. L'utilisateur pourrait supprimer sa cagnotte par erreur, perdant les contributions existantes.

## Solution

Ajouter un `AlertDialog` de confirmation qui s'affiche au clic sur le bouton supprimer, avec un message clair indiquant les consequences (perte des contributions, action irreversible).

### Fichier : `src/components/CollectiveFundCard.tsx`

1. **Importer AlertDialog** depuis `@/components/ui/alert-dialog` (AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle)

2. **Ajouter un state** `showDeleteConfirm` (boolean, default false)

3. **Modifier le bouton Trash2** : au lieu d'appeler `handleDelete` directement, ouvrir le dialog avec `setShowDeleteConfirm(true)`

4. **Ajouter le composant AlertDialog** dans le JSX avec :
   - Titre : "Supprimer cette cagnotte ?"
   - Description : "Cette action est irreversible. Toutes les contributions ({montant} {devise}) et les commentaires seront perdus."
   - Bouton Annuler
   - Bouton Confirmer (rouge) qui appelle `handleDelete`

## Fichier modifie

- `src/components/CollectiveFundCard.tsx`
