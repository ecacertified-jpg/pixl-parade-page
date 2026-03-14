

# Plan : Corriger les contacts masqués dans la modale Profil utilisateur

## Problème

La liste des contacts dans l'onglet "Contacts" de `UserProfileModal` utilise un `ScrollArea` avec `max-h-[400px]` fixe, à l'intérieur d'un dialog qui a déjà `max-h-[85vh] overflow-y-auto`. Sur mobile, cette imbrication de conteneurs scrollables coupe les contacts en bas sans indication claire de scroll.

## Solution

Dans `src/components/admin/UserProfileModal.tsx` :

- Remplacer le `ScrollArea` avec `max-h-[400px]` par un simple `div` sans hauteur max fixe
- Laisser le `DialogContent` (qui a `max-h-[85vh] overflow-y-auto`) gérer le scroll global
- Tous les contacts seront ainsi accessibles par scroll naturel dans le dialog

## Fichier impacté

| Fichier | Changement |
|---------|-----------|
| `src/components/admin/UserProfileModal.tsx` | Supprimer `ScrollArea max-h-[400px]`, utiliser un `div` simple |

