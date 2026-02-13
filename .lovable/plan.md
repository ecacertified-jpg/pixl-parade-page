
# Corriger l'affichage du pays sur les produits de la boutique

## Probleme

La boutique "Ese Shop" (id: `13c6285e...`) a bien `country_code = 'BJ'` en base, mais ses produits ont encore `country_code = 'CI'`. Le trigger `trg_propagate_business_country` ne s'est pas declenche car le `country_code` de la boutique n'a pas ete mis a jour apres la creation des produits, ou les produits existaient avant la correction.

Sur la page VendorShop, le badge pays utilise `product.country_code` au lieu du `country_code` de la boutique parente, ce qui affiche le mauvais drapeau.

## Corrections

### 1. Correction en base : synchroniser les produits

Mettre a jour tous les produits dont le `country_code` ne correspond pas a celui de leur boutique parente :

```sql
UPDATE products p
SET country_code = ba.country_code
FROM business_accounts ba
WHERE p.business_id = ba.id
  AND p.country_code IS DISTINCT FROM ba.country_code;
```

### 2. Correction dans le code : VendorShop.tsx

Modifier le composant `ProductCard` interne pour recevoir et utiliser le `countryCode` de la boutique (deja disponible via `vendor.countryCode`) plutot que `product.country_code`.

- Ajouter une prop `vendorCountryCode` a `ProductCardProps`
- Passer `vendor.countryCode` lors de l'appel a `ProductCard`
- Utiliser `vendorCountryCode` dans le `CountryBadge` au lieu de `product.country_code`

Cela garantit que meme si un produit a un `country_code` obsolete, la boutique affiche toujours le bon pays.

## Fichiers concernes

| Fichier | Action | Description |
|---------|--------|-------------|
| `supabase/migrations/[new].sql` | Creer | Synchroniser les country_code des produits |
| `src/pages/VendorShop.tsx` | Modifier | Utiliser le country_code de la boutique dans ProductCard |
