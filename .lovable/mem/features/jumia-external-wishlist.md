---
name: Jumia external wishlist
description: Bouton "Ajouter depuis Jumia.ci" dans le catalogue de souhaits + cagnotte avec versement Wave au bénéficiaire
type: feature
---
Le catalogue de souhaits (`/wishlist-catalog`) propose un bouton orange "Ajouter depuis Jumia.ci" sous la barre de recherche. Le modal `JumiaImportModal` accepte une URL produit, appelle l'edge function `fetch-external-product-meta` (allowlist Jumia/Amazon/AliExpress/Alibaba/Shein/Temu/eBay, parse Open Graph + JSON-LD) et stocke le résultat dans la table `external_favorites` (RLS owner-only). Les favoris externes apparaissent dans la grille avec un badge orange via `ExternalFavoriteCard` et un CTA "Lancer une cagnotte" qui pré-remplit `ExternalProductFundModal` (nouveau prop `preset`).

À 100%, l'edge function `process-fund-completion` distingue les plateformes "self-purchase" (set `SELF_PURCHASE_PLATFORMS = {'Jumia'}`) : statut `awaiting_beneficiary_purchase` au lieu de `pending`, et la page `FundPreview` affiche un panneau orange avec deux CTA — "Recevoir mes fonds (Wave)" → `https://pay.wave.com/` + "Acheter sur Jumia" → URL produit. Les autres plateformes externes restent en achat manuel admin via `/admin/external-purchases`.