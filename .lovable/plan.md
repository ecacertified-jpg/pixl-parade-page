

# Ajouter une barre de recherche inline dans "Mon cercle d'amis"

## Constat actuel

Un bouton "Rechercher" existe deja et ouvre un modal (`SearchAndAddFriendModal`). L'objectif est d'ajouter une **barre de recherche inline** directement dans la section "Mon cercle d'amis", sans avoir besoin d'ouvrir un modal, pour une experience plus fluide et accessible.

## Changements prevus

### 1. `src/pages/Dashboard.tsx`

- **Ajouter un champ de recherche inline** entre les filtres (Inscrits / A inviter) et les composants de suggestions (ligne ~789)
- Le champ `Input` avec une icone `Search` permet de taper un nom/prenom
- Quand le champ contient au moins 2 caracteres, les resultats de recherche s'affichent directement dans la section (au lieu de la liste de contacts habituelle)
- Quand le champ est vide, la vue normale (suggestions + contacts) s'affiche
- Utiliser la fonction `searchUsers` deja fournie par `useFriendRequests` pour la recherche
- Ajouter un etat `inlineSearchQuery` et `inlineSearchResults` pour gerer la recherche debounced

### 2. Nouveau composant : `src/components/InlineUserSearchResults.tsx`

- Affiche les resultats de recherche inline avec :
  - Avatar, nom complet, bio (tronquee)
  - Bouton "Ajouter" pour envoyer une demande d'amitie (via `sendRequest`)
  - Indicateur "Envoyee" si deja envoyee (`pendingSentIds`)
  - Option "+ Message" pour ajouter un message personnalise
- Affiche un skeleton pendant la recherche
- Affiche "Aucun utilisateur trouve" si aucun resultat
- Design coherent avec les cartes existantes du Dashboard

### Flux utilisateur

```text
1. L'utilisateur voit la barre de recherche en haut de "Mon cercle d'amis"
2. Il tape un nom (ex: "Aminata")
3. Apres 300ms de debounce, les resultats apparaissent inline
4. Il peut envoyer une demande d'amitie directement
5. En effacant la recherche, la vue normale reapparait
```

### Details techniques

- Debounce de 300ms sur la saisie pour eviter les requetes excessives
- Reutilisation de `searchUsers` du hook `useFriendRequests` (pas de nouvelle requete Supabase a creer)
- Le bouton modal "Rechercher" existant est conserve comme alternative (pour les utilisateurs habitues)
- Aucune modification de base de donnees necessaire

