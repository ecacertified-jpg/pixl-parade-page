

# Ecran de recherche de cagnottes existantes avant creation

## Objectif

Ajouter une etape intermediaire avant le flux de creation de cagnotte : un ecran qui permet a l'utilisateur de rechercher des cagnottes publiques existantes par nom de beneficiaire ou titre, et de les rejoindre directement. Si rien ne correspond, l'utilisateur continue vers la creation normale.

## Flux utilisateur modifie

1. L'utilisateur clique sur "Creer" (Dashboard, CreateActionMenu, CelebrateMenu)
2. **NOUVEAU** : Un modal intermediaire `SearchExistingFundsModal` s'ouvre
   - Champ de recherche par nom de beneficiaire ou titre de cagnotte
   - Affiche les cagnottes publiques actives correspondantes avec progression, createur, occasion
   - Bouton "Contribuer" sur chaque resultat pour rejoindre la cagnotte
   - Bouton "Creer une nouvelle cagnotte" en bas pour continuer vers `ShopForCollectiveGiftModal`
3. Si l'utilisateur choisit "Creer une nouvelle cagnotte" : le flux actuel reprend normalement (selection produit, puis contact, puis creation)

## Plan technique

### Etape 1 -- Hook `useSearchPublicFunds`

Nouveau fichier `src/hooks/useSearchPublicFunds.ts` :

- `searchFunds(query: string)` : recherche dans `collective_funds` actives et publiques
  - Joint `contacts` pour chercher par nom de beneficiaire (`ilike`)
  - Cherche aussi par titre de la cagnotte (`ilike`)
  - Joint `profiles` sur `creator_id` pour afficher le nom du createur
  - Joint `products` pour l'image produit
  - Compte les contributions par fund
- Retourne `results[]`, `loading`, `searchFunds(query)`, `clearResults()`
- Debounce integre : ne lance la requete qu'apres 300ms d'inactivite, minimum 2 caracteres

### Etape 2 -- Composant `SearchExistingFundsModal`

Nouveau fichier `src/components/SearchExistingFundsModal.tsx` :

- Modal (Dialog) avec :
  - Titre "Rejoindre ou creer une cagnotte"
  - Champ de recherche avec icone Search
  - Etat vide initial : texte explicatif + icone, encourageant a chercher d'abord
  - Resultats : carte par cagnotte avec image produit, titre, nom beneficiaire, barre de progression, nombre de contributeurs, nom du createur, bouton "Contribuer"
  - Clic sur "Contribuer" : ferme le modal et navigue vers `/collective-fund/{id}`
  - Bouton fixe en bas : "Creer une nouvelle cagnotte" qui ferme ce modal et ouvre `ShopForCollectiveGiftModal`
- Props : `isOpen`, `onClose`, `onCreateNew()` (callback pour ouvrir le flux de creation)

### Etape 3 -- Integration dans les points d'entree

Modifier 3 fichiers pour inserer le modal intermediaire :

**`src/pages/Dashboard.tsx`** :
- Ajouter state `showSearchFundsModal`
- Le bouton "Creer" ouvre `SearchExistingFundsModal` au lieu de `ShopForCollectiveGiftModal`
- `onCreateNew` de SearchExistingFundsModal ouvre `ShopForCollectiveGiftModal`

**`src/components/CreateActionMenu.tsx`** :
- L'action "Creer une cagnotte" ouvre `SearchExistingFundsModal`
- `onCreateNew` ouvre `ShopForCollectiveGiftModal`

**`src/components/CelebrateMenu.tsx`** :
- Meme logique : intermediaire avant `ShopForCollectiveGiftModal`

### Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/hooks/useSearchPublicFunds.ts` | Creer -- logique de recherche de cagnottes publiques |
| `src/components/SearchExistingFundsModal.tsx` | Creer -- UI de recherche et resultats |
| `src/pages/Dashboard.tsx` | Modifier -- inserer le modal intermediaire |
| `src/components/CreateActionMenu.tsx` | Modifier -- inserer le modal intermediaire |
| `src/components/CelebrateMenu.tsx` | Modifier -- inserer le modal intermediaire |

### Aucune migration SQL necessaire

La recherche utilise les colonnes existantes de `collective_funds` (`title`, `is_public`, `status`), `contacts` (`name`) et `profiles` (`first_name`, `last_name`). Les politiques RLS existantes sur `collective_funds` autorisent deja la lecture des fonds publics.

