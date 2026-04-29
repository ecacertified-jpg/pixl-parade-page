## Objectif

Ajouter dans le **Catalogue de souhaits** un bouton **Jumia** (sous la barre de recherche) qui permet à l'utilisateur d'importer un produit depuis Jumia.ci via son lien, de l'épingler dans ses favoris au même titre qu'un produit JDV, puis de lancer une cagnotte JDV qui, une fois complète, débloque les fonds vers le bénéficiaire (lien Wave + lien Jumia direct) pour qu'il finalise lui-même l'achat.

## Pourquoi cette approche

Jumia n'expose pas d'API publique et leurs CGU interdisent le scraping de catalogue complet. La voie sûre, légale et rapide est **l'import par URL** : l'utilisateur va sur Jumia.ci (ouvert dans un nouvel onglet), copie le lien d'un produit, le colle dans JDV. Une edge function récupère uniquement les **métadonnées Open Graph** publiques (titre, image, prix) — comme le ferait un partage WhatsApp — et crée l'entrée.

## UX — Catalogue de souhaits

```text
┌─ Catalogue de souhaits ─────────────────────┐
│  [🇨🇮▼] [🔍 Rechercher...]                  │
│  [🛒 Ajouter depuis Jumia.ci]   ← NOUVEAU   │
│  Essayez plutôt: Robe • Chemise • Parfum    │
│  ...grille produits JDV + favoris Jumia ... │
└─────────────────────────────────────────────┘
```

1. Bouton **"Ajouter depuis Jumia.ci"** sous la barre de recherche (style outline + logo Jumia orange).
2. Au clic → modal `JumiaImportModal` :
   - Lien "Ouvrir Jumia.ci ↗" (nouvelle fenêtre, copie automatique d'un message d'aide).
   - Champ **URL produit Jumia** + bouton **Aperçu**.
   - Aperçu auto-rempli (image, nom, prix XOF) — éditable si la détection échoue.
   - Bouton **Ajouter à mes souhaits**.
3. Le produit Jumia apparaît dans la grille du catalogue avec un **badge orange "Jumia"** sur la carte, mélangé aux favoris JDV.
4. Sur la carte favori Jumia : icône cœur + bouton **"Lancer une cagnotte"** qui pré-remplit le modal de cagnotte externe existant.

## UX — Cagnotte → bénéficiaire

Pour les cagnottes liées à un produit Jumia (`is_external_product = true` + `external_platform = 'Jumia'`), à 100% :
1. Le créateur reçoit une notification **"Cagnotte complète — versement vers le bénéficiaire"**.
2. La page de la cagnotte affiche un panneau dédié au bénéficiaire :
   - Bouton **"Recevoir mes fonds (Wave)"** → lien Wave pré-rempli vers son numéro avec le montant collecté (net de la commission JDV).
   - Bouton **"Acheter sur Jumia ↗"** → ouvre l'URL du produit Jumia.
   - Mémo : "Vous avez X jours pour finaliser l'achat. Confirmez la réception ensuite."
3. Bouton **"J'ai reçu le produit"** côté bénéficiaire → marque la cagnotte `delivered` (réutilise le flow de satisfaction existant).

## Changements techniques

### Base de données
Aucune table nouvelle nécessaire. Réutilise l'infrastructure `external_product` existante sur `collective_funds` (champs `is_external_product`, `external_product_url`, `external_product_name`, `external_product_image_url`, `external_platform`).

Nouvelle table légère pour stocker les **favoris externes** (Jumia ne peut pas FK vers `products`) :

```sql
CREATE TABLE public.external_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL,           -- 'Jumia', 'Amazon', etc.
  external_url text NOT NULL,
  product_name text NOT NULL,
  image_url text,
  estimated_price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'XOF',
  country_code text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, external_url)
);
ALTER TABLE public.external_favorites ENABLE ROW LEVEL SECURITY;
-- SELECT/INSERT/DELETE: owner only
```

### Edge function `fetch-external-product-meta` (nouvelle)
- Auth obligatoire (JWT).
- Validation Zod de l'URL + allowlist (`jumia.ci`, `jumia.com`, `amazon.*`, etc.).
- Fetch HTML, parse les balises Open Graph (`og:title`, `og:image`, `product:price:amount`).
- Retourne `{ name, image_url, price, currency, platform }`.
- Pas de stockage / pas de scraping massif — une URL à la fois.
- Rate-limit 30 req/h/user.

### Frontend
| Fichier | Action |
|---|---|
| `src/components/wishlist/JumiaImportModal.tsx` | **Nouveau** — saisie URL, aperçu, sauvegarde |
| `src/hooks/useExternalFavorites.ts` | **Nouveau** — CRUD external_favorites |
| `src/pages/WishlistCatalog.tsx` | Bouton "Ajouter depuis Jumia.ci" + fusion grille |
| `src/components/wishlist/ExternalFavoriteCard.tsx` | **Nouveau** — carte Jumia (badge, prix, CTA cagnotte) |
| `src/pages/FundPreview.tsx` | Panneau bénéficiaire (Wave + lien Jumia) pour funds externes complets |
| `src/components/ExternalProductFundModal.tsx` | Pré-rempli quand lancé depuis un favori Jumia |

### Logique cagnotte complète (réutilisation)
L'edge function `process-fund-completion` existante détecte déjà `is_external_product`. On l'étend pour les funds **Jumia** : au lieu de créer une `external_purchase_request` (achat manuel admin), on bascule en mode **payout bénéficiaire** :
- Crée une notification au bénéficiaire avec lien Wave + lien Jumia.
- L'admin reste copié pour traçabilité dans `/admin/external-purchases` (statut `awaiting_beneficiary_purchase` — nouveau statut).

## Limitations à connaître
- Le parsing Open Graph dépend de Jumia : si la page produit n'a pas de balise `og:image` ou `product:price`, l'utilisateur devra remplir manuellement. Le modal le permet.
- Les prix Jumia peuvent évoluer entre l'import et la fin de la cagnotte → on affiche un message "Prix indicatif au jour de l'import".
- Pas d'inventaire/stock vérifié : si le produit n'est plus dispo sur Jumia au moment du payout, le bénéficiaire choisit un équivalent.

## Étapes de livraison
1. Migration `external_favorites` + RLS.
2. Edge function `fetch-external-product-meta` + secret allowlist.
3. Hook `useExternalFavorites` + modal `JumiaImportModal`.
4. Intégration dans `WishlistCatalog` (bouton + grille fusionnée + carte Jumia).
5. Adaptation `process-fund-completion` + panneau bénéficiaire dans `FundPreview`.
6. Mémo `mem://features/jumia-external-wishlist`.
