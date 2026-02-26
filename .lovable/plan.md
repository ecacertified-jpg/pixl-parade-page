

## Ajouter une barre de recherche de boutiques dans la page Boutique

### Objectif
Permettre aux utilisateurs de rechercher une boutique specifique par nom dans la page principale `/shop`, en filtrant la section "Boutiques populaires" et en recherchant parmi toutes les boutiques actives.

### Emplacement
La barre de recherche sera placee juste au-dessus de la section "Boutiques populaires" (ligne ~779), avec une icone `Store` et un placeholder "Rechercher une boutique...".

### Comportement
- **Sans saisie** : La section "Boutiques populaires" s'affiche normalement (top 6 boutiques)
- **Avec saisie** : Recherche en temps reel parmi toutes les boutiques actives (via `business_public_info`), affichage des resultats correspondants au nom saisi
- **Clic sur une boutique** : Navigation vers `/boutique/:id` (comportement existant)

### Modifications techniques

**Fichier : `src/pages/Shop.tsx`**

1. Ajouter un state `shopSearchQuery` pour la saisie utilisateur
2. Ajouter un state `searchedShops` pour les resultats de recherche
3. Ajouter une fonction `searchShops(query)` qui interroge `business_public_info` avec un filtre `ilike` sur `business_name`
4. Utiliser un debounce (setTimeout 300ms) pour eviter trop de requetes
5. Ajouter le champ de recherche (Input avec icone Store) au-dessus de la section "Boutiques populaires"
6. Afficher `searchedShops` au lieu de `popularShops` quand une recherche est active
7. Afficher un message "Aucune boutique trouvee" si la recherche ne retourne rien

### Interface utilisateur

```text
+------------------------------------------+
| [Store icon] Rechercher une boutique...  |
+------------------------------------------+
|  [Logo] Boutique A   [Logo] Boutique B   |  <-- resultats filtres ou populaires
+------------------------------------------+
```

### Details d'implementation

- La recherche utilise la vue `business_public_info` (deja utilisee par `loadPopularShops`)
- Filtre : `.ilike('business_name', '%query%')` avec `.eq('is_active', true)`
- Les resultats incluent le nombre de produits et la note moyenne (meme logique que `loadPopularShops`)
- Limite a 10 resultats pour la recherche
- Un bouton X apparait pour effacer la recherche quand du texte est saisi

