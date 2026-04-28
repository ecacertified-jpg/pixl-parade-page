---
name: External product funds
description: Cagnottes JDV pour acheter un produit hébergé sur une plateforme externe (Amazon, Jumia, etc.)
type: feature
---
Les utilisateurs peuvent créer une cagnotte JDV ciblant un produit externe via le modal `ExternalProductFundModal`. La cagnotte porte les champs `is_external_product`, `external_product_url`, `external_product_name`, `external_product_image_url`, `external_platform` sur `collective_funds`. À 100%, l'edge function `process-fund-completion` insère un `external_purchase_requests` (statut `pending`) au lieu d'un `business_order`. Les admins gèrent l'achat manuel via `/admin/external-purchases` (statuts: pending → purchased → shipped → delivered). RLS: SELECT pour créateur+bénéficiaire+admin, écriture admin uniquement (via `is_admin(auth.uid())`).
