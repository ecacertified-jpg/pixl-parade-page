

# Suggestions d'amitie : confirmer les relations detectees

## Contexte

Actuellement, quand un contact a un `linked_user_id` (telephone reconnu sur l'app), une relation dans `contact_relationships` n'est pas toujours creee automatiquement (bug de numero, timing, etc.). En base, on constate deja plusieurs contacts avec `linked_user_id` mais sans `contact_relationships` correspondante.

Ce mecanisme proposera a l'utilisateur de confirmer ces liens manquants directement depuis le Dashboard.

## Fonctionnement

1. Au chargement du Dashboard, comparer les contacts ayant un `linked_user_id` avec les `contact_relationships` existantes
2. Identifier les contacts lies mais sans relation confirmee
3. Afficher une banniere de suggestion dans la section "Mon cercle d'amis"
4. L'utilisateur peut confirmer (cree la relation) ou ignorer chaque suggestion

## Plan technique

### Etape 1 -- Hook `useFriendshipSuggestions`

Nouveau fichier `src/hooks/useFriendshipSuggestions.ts` :

- Prend en entree la liste des contacts avec `linked_user_id`
- Charge les `contact_relationships` de l'utilisateur courant
- Identifie les contacts ou `linked_user_id` existe mais aucune relation `contact_relationships` n'est presente
- Enrichit chaque suggestion avec le profil du `linked_user_id` (nom, avatar)
- Expose : `suggestions`, `loading`, `confirmRelationship(contactId, linkedUserId)`, `dismissSuggestion(contactId)`

La fonction `confirmRelationship` insere dans `contact_relationships` avec `LEAST/GREATEST` (respect de l'index symetrique) et `can_see_funds = true`.

Les suggestions ignorees sont stockees dans un state local (Set) pour ne pas les reafficher dans la session.

### Etape 2 -- Composant `FriendshipSuggestionsCard`

Nouveau fichier `src/components/FriendshipSuggestionsCard.tsx` :

- Carte avec icone et titre "Relations a confirmer"
- Liste les suggestions avec avatar, nom du contact, nom du profil lie
- Deux boutons par suggestion : "Confirmer l'amitie" (primary) et "Ignorer" (ghost, X)
- Animation de sortie quand une suggestion est confirmee/ignoree
- La carte disparait quand il n'y a plus de suggestions

### Etape 3 -- Integration dans le Dashboard

Dans `src/pages/Dashboard.tsx` :

- Apres le chargement des contacts (`loadFriendsFromSupabase`), passer les contacts avec `linked_user_id` au hook
- Afficher `FriendshipSuggestionsCard` juste au-dessus de la liste des amis, dans la section "Mon cercle d'amis"
- Apres confirmation, rafraichir la liste des contacts pour mettre a jour les badges

### Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/hooks/useFriendshipSuggestions.ts` | Creer -- logique de detection et confirmation |
| `src/components/FriendshipSuggestionsCard.tsx` | Creer -- UI des suggestions |
| `src/pages/Dashboard.tsx` | Modifier -- integrer le composant et le hook |

### Aucune migration necessaire

Les tables `contacts`, `contact_relationships` et `profiles` existent deja avec toutes les colonnes necessaires. L'insertion utilise l'index symetrique `idx_contact_relationships_symmetric` existant.

