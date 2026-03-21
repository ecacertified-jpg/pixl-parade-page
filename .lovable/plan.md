

# Plan : Empêcher les doublons de numéro de téléphone dans les contacts

## Problème

L'utilisateur peut actuellement :
1. Ajouter son propre numéro de téléphone comme contact
2. Ajouter le même numéro de téléphone plusieurs fois dans ses contacts (cercle principal ou sous-cercles)

## Solution

Ajouter une vérification **avant l'insertion** dans les deux fonctions `handleAddFriend` qui existent :

### 1. `src/pages/Dashboard.tsx` (lignes ~240-320)

Avant l'insertion du contact (ligne 270), ajouter :

- **Vérification propre numéro** : comparer `newFriend.phone` avec `userProfile?.phone` (déjà disponible via `useDashboardData`). Si identique → toast d'erreur + return
- **Vérification doublon** : chercher dans la liste `friends` (déjà chargée) si un contact avec le même numéro existe déjà. Si oui → toast d'erreur avec le nom du contact existant + return

### 2. `src/components/FriendsCircleReminderCard.tsx` (lignes ~87-153)

Même logique mais nécessite d'accéder au profil utilisateur et aux contacts existants :

- Récupérer le phone du profil via une requête `supabase.from('profiles').select('phone')` avant la vérification
- Récupérer les contacts existants via `supabase.from('contacts').select('phone, name').eq('user_id', user.id)` pour vérifier les doublons
- Mêmes messages d'erreur toast

### Messages affichés

- **Propre numéro** : "Vous ne pouvez pas ajouter votre propre numéro de téléphone comme contact."
- **Doublon** : "Ce numéro de téléphone est déjà utilisé par {nom_contact} dans votre cercle d'amis."

### Normalisation

Comparer les numéros en supprimant espaces, tirets et parenthèses (`phone.replace(/[\s\-()]/g, '')`) pour éviter les faux négatifs.

## Fichiers modifiés

- `src/pages/Dashboard.tsx` — ajout vérifications avant insert
- `src/components/FriendsCircleReminderCard.tsx` — ajout vérifications avant insert

