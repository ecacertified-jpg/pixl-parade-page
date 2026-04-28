## Objectif

Permettre à un utilisateur de créer une **cagnotte Joie de Vivre** pour financer collectivement l'achat d'un produit qui se trouve sur **une plateforme externe** (Amazon, Jumia, AliExpress, boutique Instagram, site marchand quelconque, etc.). La mécanique de cagnotte JDV (collecte, partage, contributions, complétion à 100%) reste identique. Seule la phase d'achat final change : c'est l'équipe JDV qui procède à l'achat sur la plateforme externe une fois la cagnotte complétée.

## Parcours utilisateur

1. Sur la wishlist ou un nouveau bouton « Cagnotte produit externe », l'utilisateur clique sur **« Ajouter un produit d'une autre plateforme »**.
2. Une modale lui demande :
   - URL du produit (Amazon, Jumia, etc.)
   - Nom du produit
   - Prix estimé (XOF) — sert de `target_amount`
   - Photo (upload ou URL de l'image récupérée du lien)
   - Bénéficiaire (lui-même, un contact, ou une page d'anniversaire)
   - Occasion + date limite + visibilité
3. La cagnotte est créée comme une cagnotte JDV classique, **mais marquée « externe »**. Elle est partageable, recevant des contributions normalement (Wave, etc.).
4. Quand la cagnotte atteint 100 %, au lieu de déclencher un `business_order` chez un prestataire JDV, le système :
   - Crée une **demande d'achat externe** (`external_purchase_requests`) en statut `pending`.
   - Notifie les admins (WhatsApp + tableau de bord).
   - Notifie le bénéficiaire que sa cagnotte est complète et que JDV s'occupe de l'achat.
5. Un admin ouvre la demande, clique sur le lien externe, achète le produit, saisit le numéro de commande / preuve d'achat, et marque la demande `purchased`.
6. Le bénéficiaire et le créateur reçoivent une notification de confirmation. Quand le colis est livré, l'admin marque `delivered` (réutilisation du flux satisfaction/livraison existant si possible).

## Conformité avec l'architecture existante

- Réutilise **`collective_funds`** (mécanique de collecte, partage, contributions inchangée).
- Réutilise **`fund_contributions`**, **partage viral**, **complétion 100%**.
- Le split paiement Wave actuel (vendeur/plateforme) ne s'applique pas : la totalité va à JDV qui rachète ailleurs. La marge = différence entre montant collecté et coût réel d'achat (saisi par l'admin).

## Changements techniques

### 1. Base de données (migration)

Sur `collective_funds`, ajouter :
- `is_external_product boolean default false`
- `external_product_url text`
- `external_product_name text`
- `external_product_image_url text`
- `external_platform text` (Amazon, Jumia, etc., détecté depuis l'URL ou saisi)

Nouvelle table `external_purchase_requests` :
- `id`, `fund_id` (FK collective_funds), `status` (pending / purchased / shipped / delivered / cancelled)
- `external_url`, `product_name`, `estimated_price`, `actual_purchase_amount`
- `purchased_by_admin_id`, `purchased_at`, `external_order_reference`, `proof_url`
- `delivery_address`, `beneficiary_phone`, `admin_notes`
- `created_at`, `updated_at`

RLS :
- `collective_funds` : pas de changement (les nouveaux champs suivent les policies existantes).
- `external_purchase_requests` : SELECT pour le créateur de la cagnotte et le bénéficiaire, ALL pour les admins (via `has_role`).

### 2. Front-end

**Nouveau composant** `ExternalProductFundModal.tsx` :
- Champs URL / nom / prix / image / bénéficiaire / occasion / deadline.
- Bouton « Récupérer les infos » (optionnel, V2) qui appelle une edge function de scraping léger (oEmbed / og:image). Pour la V1, saisie manuelle suffit.
- À la validation, insère dans `collective_funds` avec `is_external_product = true`.

**Intégration UI** :
- Bouton « Ajouter un produit externe » dans :
  - La wishlist (`Favorites` / wishlist du dashboard),
  - Le menu de création de cagnotte (`CelebrateMenu`, `WishlistFundPickerModal`, `EmptyFundsState`),
  - La page d'anniversaire (section cagnotte permanente).
- Sur la **page publique d'une cagnotte externe**, afficher un badge « Produit externe » + un lien sortant vers le produit (avec `rel="noopener nofollow"`).

### 3. Edge function `process-fund-completion`

Adapter la logique de complétion : si `is_external_product = true`, ne pas créer de `business_order` ni appeler `process-wave-payment`. À la place :
- Insérer un `external_purchase_requests` en `pending`.
- Envoyer une notification WhatsApp aux admins (template existant ou simple message) avec lien vers `/admin/external-purchases/:id`.
- Notifier le bénéficiaire et le créateur.

### 4. Tableau de bord admin

Nouvelle page `/admin/external-purchases` :
- Liste des demandes (filtres par statut, pays).
- Détail : lien externe cliquable, infos cagnotte, bénéficiaire, adresse de livraison.
- Actions : « Marquer acheté » (saisie référence + montant réel + preuve), « Marquer expédié », « Marquer livré », « Annuler + rembourser ».
- Lien dans la sidebar admin sous Commissions / Financial Management.

## Ce qui n'est PAS dans ce plan

- Scraping automatique des pages produit externes (peut être une V2 avec une edge function dédiée + clé API type `microlink.io`).
- Conversion automatique de devises (l'utilisateur saisit le prix estimé en XOF).
- Remboursement automatique en cas d'échec d'achat (à faire manuellement via l'admin pour la V1).

## Estimation du périmètre

- 1 migration SQL (colonnes + nouvelle table + RLS).
- 1 nouvelle modale front + intégration dans 3-4 points d'entrée.
- Adaptation de `process-fund-completion`.
- 1 nouvelle page admin + 1 hook.
- Adaptation de la page publique de cagnotte (badge + lien).
