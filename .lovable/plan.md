## Diagnostic

Vous voyez des gâteaux de la boutique **« Aury mode »** située à **Cotonou (Bénin)** alors que vous êtes en **Côte d'Ivoire** (`profile.country_code = 'CI'`). L'investigation en base révèle la cause réelle :

- La boutique **Aury mode** a `business_accounts.country_code = 'BJ'` (Bénin) ✅
- Mais **274 de ses produits** ont `products.country_code = 'CI'` (Côte d'Ivoire) ❌
- Le filtre du catalogue est correct (`products.country_code = 'CI'`), mais il retourne ces produits mal étiquetés.

D'après `mem://features/product-country-synchronization`, un trigger SQL `trg_sync_product_country` est censé garantir que tout produit hérite du `country_code` de sa boutique parente. **Ce trigger n'existe pas en base** (vérifié via `information_schema.triggers`) — il a probablement été supprimé ou n'a jamais été créé. C'est ce qui a permis la dérive.

## Correctif

### 1. Migration SQL — corriger les données + recréer le trigger

Une migration unique qui :

1. **Resynchronise** les 274 produits incohérents : `UPDATE products SET country_code = b.country_code FROM business_accounts b WHERE products.business_id = b.id AND products.country_code IS DISTINCT FROM b.country_code`.
2. **(Re)crée la fonction** `sync_product_country()` qui force `NEW.country_code` à celui de la boutique lors de tout `INSERT`/`UPDATE` sur `products`.
3. **(Re)crée la fonction** `sync_business_country_to_products()` qui propage un changement de `business_accounts.country_code` à tous les produits de cette boutique.
4. **Attache les triggers** correspondants sur `products` (BEFORE INSERT/UPDATE) et `business_accounts` (AFTER UPDATE OF country_code).

Conséquence immédiate : votre catalogue ne montrera plus les produits d'Aury mode quand vous êtes en CI, et toute future incohérence est mécaniquement empêchée.

### 2. Stabiliser le `CountryContext` (en complément)

Un second souci, déjà présent, est que l'effet d'auto-détection IP s'exécute en parallèle du chargement du profil et **peut écraser le pays du profil** au premier tour, sans respecter le flag « manual ». Ajustement :

- L'auto-détection (`useEffect` de `SESSION_DETECTED_KEY`) ne doit s'appliquer **que si aucun pays manuel n'a été choisi ET que le profil n'est pas connu** (utilisateur non connecté). Sinon, on attend le profil et le `loadProfileCountry` aligne tout seul.
- Le `loadProfileCountry` doit également **effacer le flag `SESSION_DETECTED_KEY`** s'il prend le relais, pour éviter qu'une auto-détection ultérieure ne reparte sur de mauvaises bases.

Cela renforce la garantie : un utilisateur ivoirien connecté reste sur **CI** par défaut, même si son IP est ailleurs.

## Fichiers / changements

- **Nouvelle migration SQL** (via l'outil de migration Supabase) :
  - `UPDATE` ponctuel des 274 produits
  - `CREATE OR REPLACE FUNCTION public.sync_product_country()`
  - `CREATE OR REPLACE FUNCTION public.sync_business_country_to_products()`
  - `CREATE TRIGGER trg_sync_product_country BEFORE INSERT OR UPDATE ON public.products`
  - `CREATE TRIGGER trg_sync_business_country_to_products AFTER UPDATE OF country_code ON public.business_accounts`
- **`src/contexts/CountryContext.tsx`** : ne pas auto-détecter quand un profil utilisateur est en cours de chargement / présent ; nettoyer la valeur auto-détectée si le profil prend le relais.

## Hors-scope

- Aucune modification de l'UI du catalogue (le filtre est déjà bon).
- Aucune réorganisation des boutiques ni de leur adresse.