## Problème constaté

Sur la page d'anniversaire publique d'un ami (`/birthday/:slug`), le bouton **"Créer une cagnotte pour {Prénom}"** :

1. Ouvre `WishlistFundPickerModal` → sélection d'un article de la liste de souhaits de l'ami → ajoute au panier (`isCollaborativeGift: true`, `beneficiaryId = ami`) → redirige vers `/cart` puis `/collective-checkout`.
2. `/collective-checkout` impose un parcours **acheteur unique** : téléphone donneur, adresse de livraison, méthode de paiement, et **paiement immédiat du montant total** par le créateur.
3. La cagnotte créée a `is_public = false` (défaut DB, jamais surchargé) → les autres amis ne peuvent pas y contribuer via `/f/:id`.
4. La cagnotte n'est **pas liée à `birthday_pages.fund_id`** de l'ami → la page d'anniversaire continue d'afficher "Créer une cagnotte" au lieu de "Participer au cadeau".

Conséquence : le visiteur ne peut qu'**acheter seul** l'article. Impossible de lancer une cagnotte collaborative pour les autres amis.

## Objectif

Quand un visiteur clique "Créer une cagnotte pour {ami}" depuis la page d'anniversaire publique d'un ami :
- Créer immédiatement une **cagnotte publique** liée à un article de la wishlist de l'ami.
- Pas de checkout / paiement / livraison à cette étape (le visiteur n'achète rien — il **lance la collecte**).
- Lier la cagnotte à la `birthday_pages` de l'ami.
- Rediriger vers `/f/:id` avec une invitation à **partager** + **contribuer** son propre montant.

## Changements

### 1. Nouveau flux dans `WishlistFundPickerModal` (cas `isExternalBeneficiary`)

Au clic sur **"Créer"** d'un article :
- Si bénéficiaire externe → ne PAS passer par le panier. Appeler directement un nouveau handler `createPublicFundForFriend(product)` qui :
  - INSERT dans `collective_funds` :
    - `creator_id` = visiteur connecté
    - `beneficiary_user_id` = `beneficiaryUserId` (nouveau lien direct utilisateur → utilisateur)
    - `title` = `"${product.name} pour ${prenom}"`
    - `description` = description produit
    - `target_amount` = `product.price`
    - `business_product_id` = `product.id`
    - `created_by_business_id` = `business_account_id` du produit (lookup)
    - `occasion = 'birthday'`
    - `is_public = true` ← clé
    - `status = 'active'`
    - `currency = 'XOF'`
  - INSERT dans `business_collective_funds` (cohérent avec le flux existant).
  - UPDATE `birthday_pages SET fund_id = <new>` pour la page courante de l'ami (année en cours, `is_active = true`) **uniquement si elle n'a pas déjà un `fund_id` actif**.
  - Fermer le modal et `navigate('/f/' + fund.id)`.
- Si bénéficiaire = soi-même → conserver le comportement actuel (panier + `/collective-checkout`, qui sert aussi de "self-fund").

### 2. Page `BirthdayPage.tsx`

- Pas de changement de bouton. Après création, le `useBirthdayPage` (ou refetch équivalent) rechargera la page et affichera désormais la cagnotte (bouton "Participer au cadeau" → `/f/:id`).
- Pour s'assurer du rafraîchissement : passer un `onFundCreated` au `WishlistFundPickerModal` qui invalide la query / relance le fetch local de la page.

### 3. Sécurité / RLS

- L'INSERT direct dans `collective_funds` par un utilisateur authentifié est déjà autorisé par les politiques existantes (le créateur est `auth.uid()`).
- L'UPDATE de `birthday_pages.fund_id` d'un autre utilisateur n'est PAS autorisé par RLS (seul le propriétaire). Il faut donc une **Edge Function** `link-fund-to-birthday-page` (verify_jwt = true) qui :
  - Vérifie que la cagnotte appartient bien au caller (`creator_id = auth.uid()`).
  - Vérifie que la page d'anniversaire cible n'a pas déjà de `fund_id` actif lié.
  - Effectue l'UPDATE avec `service_role`.
- La fonction est appelée juste après la création de la cagnotte côté client.

### 4. Aucun changement nécessaire à `CollectiveCheckout`

Il reste utilisé pour : (a) self-funds, (b) cas business existants, (c) commandes de cagnottes complétées. Ce flux n'est plus emprunté pour "lancer une cagnotte pour un ami".

## Fichiers modifiés / créés

- `src/components/WishlistFundPickerModal.tsx` — nouveau handler `createPublicFundForFriend`, branchement conditionnel.
- `src/pages/BirthdayPage.tsx` — passe `onFundCreated` qui retrigger le fetch de la page (`fetchBirthdayPageData`).
- `supabase/functions/link-fund-to-birthday-page/index.ts` — nouvelle Edge Function (JWT vérifié, ownership checks).
- `supabase/config.toml` — déclaration de la nouvelle fonction.

## Résultat utilisateur

Visiteur sur la page de Leslie → clique "Créer une cagnotte pour Leslie" → choisit un cadeau de la wishlist de Leslie → cagnotte publique créée et liée à la page de Leslie → atterrit sur `/f/:id` avec partage + contribution → tous les autres amis voient désormais "Participer au cadeau" sur la page d'anniversaire de Leslie.
