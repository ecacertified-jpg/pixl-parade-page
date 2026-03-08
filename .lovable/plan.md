

## Plan : Split de paiement Mobile Money (Orange/MTN)

Architecture identique au split Wave existant, adaptee pour le mode de paiement `mobile` (Orange Money / MTN Mobile Money).

### 1. Migration SQL

**a) Ajouter `mobile_money_merchant_phone` a `business_accounts`**
```sql
ALTER TABLE business_accounts ADD COLUMN mobile_money_merchant_phone text;
```

**b) Ajouter `platform_mobile_money_phone` dans `platform_settings`**
```sql
INSERT INTO platform_settings (setting_key, setting_value, setting_category, description)
VALUES ('platform_mobile_money_phone', '{"value": ""}', 'finance', 
        'Numéro Mobile Money JDV pour recevoir les commissions Orange/MTN');
```

Pas besoin de nouvelle table `payment_splits` — elle existe deja et supporte `payment_method` comme colonne.

### 2. Edge Function `process-mobile-money-payment`

Clone de `process-wave-payment` avec :
- `payment_method` filtre sur `mobile` au lieu de `wave`
- Lecture de `mobile_money_merchant_phone` au lieu de `wave_merchant_phone`
- Lecture de `platform_mobile_money_phone` au lieu de `platform_wave_phone`
- Insertion dans `payment_splits` avec `payment_method: 'mobile_money'`
- Meme logique de calcul : vendor_amount = sum(prix DB * qty), platform_amount = total - vendor

### 3. Formulaires prestataire (4 fichiers)

Ajouter un champ "Numero Mobile Money marchand" (type tel, placeholder "+225 07 XX XX XX XX") dans :
- `src/components/AddBusinessModal.tsx` — apres le champ Wave
- `src/components/admin/AdminEditBusinessModal.tsx`
- `src/components/admin/AdminAddBusinessToOwnerModal.tsx`
- `src/pages/Admin/CountryBusinessesPage.tsx` — ajout dans le select + interface

Champ sauvegarde dans `business_accounts.mobile_money_merchant_phone`.

### 4. Admin Settings — onglet Finance

Dans `src/pages/Admin/Settings.tsx` :
- Ajouter `platform_mobile_money_phone` dans le state `financeSettings`
- Charger depuis `getSetting('platform_mobile_money_phone')`
- Sauvegarder dans `handleSaveFinance`
- Ajouter un champ Input "Numero Mobile Money JDV" apres le champ Wave

### 5. Checkout — integration

Dans `src/pages/Checkout.tsx` ligne ~391, ajouter un bloc similaire pour `paymentMethod === 'mobile'` :
```typescript
if (paymentMethod === 'mobile' && businessOrderResult?.[0]?.id) {
  supabase.functions.invoke('process-mobile-money-payment', {
    body: { business_order_id: businessOrderResult[0].id }
  });
}
```

### 6. Types

Ajouter `mobile_money_merchant_phone?: string` dans `src/types/business.ts`.

### Fichiers concernes
- 1 migration SQL (colonne + insert setting)
- 1 edge function creee : `process-mobile-money-payment`
- `src/types/business.ts`
- `src/components/AddBusinessModal.tsx`
- `src/components/admin/AdminEditBusinessModal.tsx`
- `src/components/admin/AdminAddBusinessToOwnerModal.tsx`
- `src/pages/Admin/CountryBusinessesPage.tsx`
- `src/pages/Admin/Settings.tsx`
- `src/pages/Checkout.tsx`
- `supabase/config.toml`

