

## Plan : Taux de majoration des prix (markup) depuis Admin

### Concept
Ajouter un paramètre `price_markup_rate` dans les paramètres financiers Admin. Ce taux sera appliqué automatiquement aux prix affichés aux clients sur les pages publiques (boutiques, produits). Le prestataire garde son prix d'origine dans son back-office.

### 1. Ajouter le paramètre en base

Insérer une nouvelle entrée dans `platform_settings` :
```sql
INSERT INTO platform_settings (setting_key, setting_value, setting_category, description)
VALUES ('price_markup_rate', '{"value": 0, "unit": "percent"}', 'finance', 'Taux de majoration appliqué aux prix des produits affichés aux clients');
```

### 2. Modifier `src/pages/Admin/Settings.tsx`

- Ajouter `price_markup_rate` dans `financeSettings` state (à côté de `commission_rate`)
- Ajouter un champ Input dans l'onglet Finance : "Taux de majoration des prix (%)" avec description explicative
- Sauvegarder via `handleSaveFinance`

### 3. Ajouter la validation dans `src/hooks/usePlatformSettings.ts`

Ajouter un case `price_markup_rate` dans `validateSetting` (0-100%).

### 4. Créer un utilitaire `src/utils/applyMarkup.ts`

```typescript
export function applyMarkup(price: number, markupRate: number): number {
  return Math.round(price * (1 + markupRate / 100));
}
```

### 5. Appliquer le markup dans `src/hooks/useVendorProducts.ts`

- Fetcher le `price_markup_rate` depuis `platform_settings` au chargement
- Appliquer `applyMarkup()` au prix de chaque produit dans le mapping

C'est le point central : tous les prix affichés côté client (boutique, partage, cagnotte, favoris, etc.) passent par ce hook, donc le markup sera appliqué partout automatiquement.

### 6. Appliquer aussi dans les pages produit autonomes

Vérifier si `/p/:productId` ou d'autres pages chargent les prix directement (hors `useVendorProducts`) et appliquer le markup là aussi.

### Fichiers concernés
- `platform_settings` table (INSERT data)
- `src/pages/Admin/Settings.tsx` (modifier)
- `src/hooks/usePlatformSettings.ts` (modifier validation)
- `src/utils/applyMarkup.ts` (nouveau)
- `src/hooks/useVendorProducts.ts` (modifier)
- Autres hooks/pages affichant des prix côté client si nécessaire

