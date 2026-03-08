

## Plan: Masquer les infos personnelles des prestataires et afficher le support JOIE DE VIVRE

### Constat
Les pages boutiques publiques (`/boutique/:businessId`) affichent actuellement le telephone et l'email personnels du prestataire via `VendorContactCard`. Ces infos doivent etre masquees.

### Modifications

#### 1. `src/pages/VendorShop.tsx`
Remplacer les props `phone` et `email` du `VendorContactCard` par les coordonnees de support JOIE DE VIVRE pour les boutiques en Cote d'Ivoire :
- `phone`: `+225 05 46 56 66 46`
- `email`: `contact@joiedevivre-africa.com`

Pour les autres pays, utiliser les coordonnees du `legalEntity` correspondant dans `countries.ts`.

```tsx
import { getCountryConfig } from "@/config/countries";

// ...
const countryConfig = getCountryConfig(vendor.countryCode || 'CI');

<VendorContactCard
  address={vendor.address}
  phone={countryConfig.legalEntity.phone}
  email={countryConfig.legalEntity.email}
  countryCode={vendor.countryCode}
/>
```

#### 2. `src/components/VendorContactCard.tsx`
Renommer le titre de la section "Contact & Infos" en "Support & Infos" pour clarifier que ce sont les coordonnees du support et non du prestataire.

### Fichiers modifies
- `src/pages/VendorShop.tsx`
- `src/components/VendorContactCard.tsx`

