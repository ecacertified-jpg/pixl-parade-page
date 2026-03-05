

# Fix: Country flag display and proximity filtering in Shop

## Problems identified

1. **No country filter applied**: `effectiveCountryFilter` is imported (line 43) but **never used** in the `filteredProducts` filter (lines 252-262). All products from all countries are shown regardless of the user's detected country.

2. **Wrong flag on Benin products**: Products show the flag from `product.countryCode` which comes from `product.country_code || businessInfo?.countryCode` (line 110 in `useShopProducts.ts`). If the product's own `country_code` is incorrectly set to 'CI' in the database, the business fallback never kicks in. This is a data issue compounded by the missing filter.

3. **No CI fallback when geolocation fails**: When geolocation fails, all products are shown instead of defaulting to CI-only products.

## Changes

### 1. `src/pages/Shop.tsx` — Add country filtering + CI fallback

In the `filteredProducts` filter (line 252), add a `matchesCountry` condition:
- If `effectiveCountryFilter` is set (not null), only show products where `product.countryCode === effectiveCountryFilter`
- If `effectiveCountryFilter` is null (show all mode), show everything

For the geolocation fallback: when `userLocation` is null (geolocation failed/denied) AND `effectiveCountryFilter` is null, default to showing only CI products.

### 2. `src/hooks/useShopProducts.ts` — Prioritize business country_code

Change line 110 to prioritize the business's `country_code` over the product's own `country_code`, since the business country is more reliably set via triggers:
```typescript
const effectiveCountryCode = businessInfo?.countryCode || product.country_code || null;
```

### Files impacted
| File | Change |
|------|--------|
| `src/pages/Shop.tsx` | Add country filter to `filteredProducts`, add CI fallback logic |
| `src/hooks/useShopProducts.ts` | Swap priority: business countryCode first |

