## Objectif

Ajouter un bouton **"Ajouter un ami"** (icône `UserPlus`) dans l'en-tête du modal **"Associer mes amis à ma page"** (`BirthdayPageFriendsPicker`), réutilisant le même `AddFriendModal` que celui du dashboard ("Mon cercle d'amis"). Une fois l'ami créé, il apparaît immédiatement dans la liste sélectionnable du picker.

## Contexte

- Le modal `BirthdayPageFriendsPicker` (Sheet bottom) liste les contacts de l'utilisateur (`contacts` table) avec une barre de recherche et un bouton "Enregistrer".
- Sur le Dashboard, l'ajout d'ami se fait via `AddFriendModal` (formulaire complet : nom, téléphone, relation, adresse, anniversaire) couplé au handler `handleAddFriend` qui insère dans `contacts` + crée éventuellement une `contact_relationships`.
- Aujourd'hui, si l'utilisateur n'a pas encore l'ami dans son carnet, il doit fermer le picker, retourner au dashboard, ajouter l'ami, puis rouvrir le picker.

## Changements

### 1. `src/components/BirthdayPageFriendsPicker.tsx`

- Ajouter un bouton icône **"Ajouter"** (`UserPlus`, variant outline, taille sm) dans le `SheetHeader`, aligné à droite du titre (flex justify-between).
- Ajouter un état local `showAddFriendModal`.
- Importer et monter `<AddFriendModal>` à l'intérieur du Sheet.
- Implémenter un handler `handleAddFriend` local qui :
  - Reproduit la logique d'insertion (`contacts` + recherche `profiles` par téléphone + `contact_relationships`) déjà présente dans `Dashboard.handleAddFriend` (extraite ou dupliquée — duplication acceptable, code court).
  - Recharge la liste des contacts (relance du `useEffect` via un compteur `refreshKey` ou refetch direct).
  - Pré-coche automatiquement le contact nouvellement créé (`setSelected(prev => [...prev, newContactId])`).
  - Ferme le `AddFriendModal` et affiche un toast succès.
- Passer `existingPhones={contacts.map(c => c.phone || '')}` pour empêcher les doublons.

### 2. UI

- Le bouton reprend le style exact du Dashboard : `Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs"` avec icône `UserPlus` 3.5×3.5 + label "Ajouter".
- Placé dans le header du Sheet à droite du titre (X de fermeture reste à sa place native du Sheet).

## Détails techniques

- Le `AddFriendModal` est un `Dialog` Radix : il s'ouvre par-dessus le `Sheet` sans conflit (z-index gérés).
- Refresh des contacts : ajouter un `refreshKey` au state et l'inclure dans les deps du `useEffect` de chargement, puis `setRefreshKey(k => k+1)` après création réussie.
- Le nouvel ami sera automatiquement coché pour fluidifier le flow (l'utilisateur a cliqué "Ajouter" précisément pour l'associer).

## Fichiers modifiés

- `src/components/BirthdayPageFriendsPicker.tsx` (ajout bouton + modal + handler + refresh)

Aucune migration DB, aucune nouvelle dépendance.