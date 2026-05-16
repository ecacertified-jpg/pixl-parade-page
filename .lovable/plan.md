## Objectif

Ajouter un bouton "Ajouter depuis Jumia.ci" dans la boutique principale (`/shop`), sous la barre de recherche produits, qui permet à l'utilisateur de coller un lien produit Jumia et de lancer immédiatement une cagnotte JDV pour ce produit (sans passer par la wishlist).

## Comportement

1. Sur l'onglet "Produits" de `/shop`, juste sous l'input de recherche, afficher un bouton orange pleine largeur identique au design de `/wishlist-catalog` (même style, même icône `ShoppingBag`).
2. Au clic → ouverture d'une variante du modal Jumia (mode "cagnotte").
3. L'utilisateur colle l'URL → bouton "Aperçu" appelle `fetch-external-product-meta` (déjà existant, allowlist Jumia incluse) → pré-remplit nom, prix, image, plateforme.
4. Le CTA principal du modal devient "Lancer une cagnotte" (au lieu de "Ajouter à mes souhaits"). À la soumission, le modal se ferme et ouvre `ExternalProductFundModal` avec un `preset` (productUrl, productName, productImageUrl, estimatedPrice, platform).
5. La cagnotte créée suit le flow existant `SELF_PURCHASE_PLATFORMS = {'Jumia'}` : à 100%, le bénéficiaire reçoit ses fonds via Wave et achète lui-même sur Jumia (voir mémo [Jumia external wishlist]).

## Changements de code

### 1. `src/components/wishlist/JumiaImportModal.tsx`
- Ajouter une prop optionnelle `mode?: "favorite" | "fund"` (défaut `"favorite"` pour ne rien casser sur `/wishlist-catalog`).
- Ajouter une prop optionnelle `onLaunchFund?: (preset: { productUrl, productName, productImageUrl, estimatedPrice, platform }) => void`.
- En mode `"fund"` : ne pas appeler `useAddExternalFavorite`. Le bouton de soumission devient "Lancer une cagnotte" et appelle `onLaunchFund(preset)` puis `onClose()`. Texte du modal légèrement adapté ("Une cagnotte JDV sera lancée pour ce produit").

### 2. `src/pages/Shop.tsx`
- Importer `JumiaImportModal`, `ExternalProductFundModal`, `ShoppingBag` (lucide), `useCountry` (déjà importé via `effectiveCountryFilter`).
- États locaux : `jumiaModalOpen`, `fundPreset`.
- Insérer le bouton orange juste après l'input de recherche produits (~ligne 488), uniquement quand `activeTab === "products"`, mêmes classes Tailwind que `/wishlist-catalog` (`border-orange-300 text-orange-700 hover:bg-orange-50 …`).
- Monter `<JumiaImportModal mode="fund" isOpen={jumiaModalOpen} onClose={…} countryCode={profileCountryCode} onLaunchFund={setFundPreset} />` et `<ExternalProductFundModal isOpen={!!fundPreset} onClose={() => setFundPreset(null)} preset={fundPreset} />` en bas du JSX.

## Hors scope

- Pas de changement DB, RLS, edge functions — la table `collective_funds` supporte déjà `is_external_product` / `external_platform`, l'edge `fetch-external-product-meta` couvre déjà Jumia, et `process-fund-completion` gère déjà le statut `awaiting_beneficiary_purchase`.
- Pas d'ajout au panier ni de checkout direct sur Jumia.
- L'onglet "Expériences" ne reçoit pas le bouton.
- Pas de changement sur `/wishlist-catalog` (mode par défaut préservé).

## Détails techniques

- `JumiaImportModal` exporte déjà `defaultPlatformUrl` / `defaultPlatformLabel` — on peut réutiliser les valeurs Jumia par défaut.
- `ExternalProductFundModal` accepte déjà la prop `preset` au format `{ productUrl, productName, productImageUrl, estimatedPrice, platform }` (cf. usage dans `WishlistCatalog.tsx` lignes 429-443).
- Aucun nouveau secret, aucune migration.
