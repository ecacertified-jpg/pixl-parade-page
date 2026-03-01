

# Demandes d'amitie par recherche de nom

## Contexte

La table `contact_requests` existe deja en base avec les colonnes necessaires (`requester_id`, `target_id`, `status`, `message`, `expires_at`) et les politiques RLS configurees. Il n'y a aucune migration a faire. Il manque uniquement le code frontend.

## Fonctionnalites

1. **Recherche d'utilisateurs** : un champ de recherche par nom/prenom dans les profils publics
2. **Envoi de demande** : bouton pour envoyer une demande avec message optionnel
3. **Reception et gestion** : notification des demandes recues avec boutons Accepter/Refuser
4. **Acceptation** : cree automatiquement une `contact_relationship` normalisee (LEAST/GREATEST)

## Plan technique

### Etape 1 -- Hook `useFriendRequests`

Nouveau fichier `src/hooks/useFriendRequests.ts` :

- `searchUsers(query)` : recherche dans `profiles` par `first_name` ou `last_name` (ilike), exclut l'utilisateur courant et les amis existants
- `sendRequest(targetId, message?)` : insert dans `contact_requests` avec `status = 'pending'` et `expires_at = now() + 30 jours`
- `pendingReceived` : liste des demandes recues en attente (enrichies avec le profil de l'expediteur)
- `pendingSent` : liste des demandes envoyees en attente
- `acceptRequest(requestId, requesterId)` : met a jour le statut a 'accepted', insere dans `contact_relationships` avec LEAST/GREATEST
- `declineRequest(requestId)` : met a jour le statut a 'declined'

### Etape 2 -- Composant `SearchAndAddFriendModal`

Nouveau fichier `src/components/SearchAndAddFriendModal.tsx` :

- Modal (Dialog) avec un champ de recherche
- Debounce de 300ms sur la saisie
- Affiche les resultats avec avatar, nom, bio
- Bouton "Envoyer une demande" par utilisateur (ou "Demande envoyee" si deja pending)
- Champ optionnel pour un message personnalise

### Etape 3 -- Composant `FriendRequestsNotification`

Nouveau fichier `src/components/FriendRequestsNotification.tsx` :

- Badge compteur sur l'icone dans le Dashboard (onglet Amis)
- Liste des demandes recues avec avatar, nom, message
- Boutons "Accepter" et "Refuser" par demande
- Animation de sortie a la confirmation/refus
- Carte affichee en haut de la section "Mon cercle d'amis" (au-dessus de FriendshipSuggestionsCard)

### Etape 4 -- Integration

- **Dashboard.tsx** : ajouter le composant `FriendRequestsNotification` dans l'onglet Amis, ajouter un bouton pour ouvrir `SearchAndAddFriendModal`
- **UserSuggestionsSection.tsx** : ajouter un bouton "Ajouter en ami" a cote de "Suivre" dans les suggestions (envoie une demande via `contact_requests`)

### Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/hooks/useFriendRequests.ts` | Creer -- logique de recherche, envoi, acceptation |
| `src/components/SearchAndAddFriendModal.tsx` | Creer -- modal de recherche et envoi |
| `src/components/FriendRequestsNotification.tsx` | Creer -- affichage et gestion des demandes recues |
| `src/pages/Dashboard.tsx` | Modifier -- integrer les deux composants |
| `src/components/UserSuggestionsSection.tsx` | Modifier -- ajouter bouton demande d'amitie |

### Aucune migration SQL necessaire

La table `contact_requests` et ses RLS existent deja. L'index symetrique sur `contact_relationships` est en place.

