## Objectif

Améliorer la page `/wishlist-catalog` (`src/pages/WishlistCatalog.tsx`) sur trois axes :
1. Chargement nettement plus rapide des cartes de souhait
2. Affichage du **lieu** de chaque article sur sa carte
3. Recherche libre par **nom d'article** (lingettes, robe, chemise…) ou par **catégorie** (en plus des filtres "goûts" actuels)

---

## 1. Accélération du chargement

### Problèmes actuels
- Deux requêtes Supabase en série : d'abord `business_accounts` (pour récupérer les `id`), puis `products` filtrés par `business_id IN (...)`. Cela double la latence réseau.
- `limit(1000)` alors qu'on n'affiche que ~20 cartes en haut de page.
- Aucun cache : à chaque montage du composant, tout est rechargé.
- Pas de pagination ni de virtualisation.
- Image hero : utilise `loading="lazy"` (bien) mais aucune dimension réservée → re-layout.

### Changements
- **Une seule requête** sur `products` filtrée directement par `country_code` (la colonne existe sur `products` grâce au trigger de synchronisation pays). On supprime la requête préalable sur `business_accounts`.
- **Pagination par lots** : charger 24 produits initialement, puis charger 24 de plus à la demande (bouton "Voir plus" ou défilement infini avec `IntersectionObserver`).
- **Migration vers TanStack Query** (`useQuery`) avec `queryKey: ['wishlist-catalog', countryCode, page]`, `staleTime: 5 min`, et `placeholderData` pour conserver l'affichage existant pendant le rechargement.
- **Sélection minimale** des colonnes : `id, name, price, currency, image_url, category_name, location_name` + jointure légère `business_accounts(business_name, address)`.
- **Tri optimisé** : `order('popularity_score', { ascending: false, nullsFirst: false })` puis `created_at desc` pour mettre en avant les produits populaires.
- **Debounce** de la recherche (300 ms) via un petit `useDebounce` local pour éviter les re-rendus à chaque frappe.
- **Réservation de hauteur d'image** (`aspect-square` est déjà là, garder) + `decoding="async"` sur les `<img>`.

---

## 2. Lieu sur chaque carte

Afficher le lieu sous le nom du commerçant, en utilisant cette priorité :
1. `product.location_name` (si renseigné côté produit, ex: pour les expériences)
2. Sinon `business_accounts.address` (adresse de la boutique)
3. Sinon, ne rien afficher

Présentation : petite ligne grise avec l'icône `MapPin` (lucide), `text-xs text-muted-foreground truncate`, sous le nom de la boutique.

```text
┌─────────────────────────┐
│       [image]           │
├─────────────────────────┤
│ Lingettes               │
│ Boutique XYZ            │
│ 📍 Cocody, Abidjan      │
│ 2 000 XOF               │
└─────────────────────────┘
```

---

## 3. Recherche par nom OU catégorie

La recherche actuelle (lignes 64–71) filtre déjà sur `name` ET `category_name` côté client, mais elle est limitée aux 1000 produits chargés et **bridée par le filtre "goûts" actif**. Améliorations :

- **Recherche serveur** quand l'utilisateur tape : si la requête fait ≥ 2 caractères, lancer une requête Supabase avec `.or('name.ilike.%q%,category_name.ilike.%q%')` pour chercher dans **tout le catalogue du pays** (pas seulement les 24 premiers chargés).
- **Réinitialiser** les résultats à la liste paginée standard quand le champ est vidé.
- Le filtre "goûts" reste appliqué par-dessus la recherche (intersection logique), avec un message clair ("Aucun article pour 'robe' dans la catégorie Tech — essayez 'Tous'") si l'intersection est vide.
- Mettre à jour le placeholder du champ : « Rechercher par nom (lingettes, robe…) ou catégorie ».

---

## Détails techniques (résumé pour développeurs)

**Fichiers modifiés**
- `src/pages/WishlistCatalog.tsx` — refonte du fetch (TanStack Query + pagination + recherche serveur), affichage du lieu, debounce.

**Fichiers potentiellement créés**
- `src/hooks/useWishlistCatalog.ts` — extraction de la logique de fetch/pagination/search dans un hook dédié pour clarté et réutilisation future.

**Schéma BDD** : aucune migration nécessaire. `products.location_name`, `products.country_code` et `business_accounts.address` existent déjà.

**Index recommandé (à vérifier, sinon ajouté via migration mineure)** : `CREATE INDEX IF NOT EXISTS idx_products_country_active ON products(country_code, is_active) WHERE is_active = true;` pour accélérer le filtrage initial.

**Aucune autre page n'est impactée.**
