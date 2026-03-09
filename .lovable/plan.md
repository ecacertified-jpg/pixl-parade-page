
# Architecture de Split de Paiement Wave & Mobile Money

## Implémenté ✅

### 1. Migration SQL
- Colonne `wave_merchant_phone` ajoutée à `business_accounts`
- Colonne `mobile_money_merchant_phone` ajoutée à `business_accounts`
- Table `payment_splits` créée avec RLS (admins + business owners)
- Paramètre `platform_wave_phone` inséré dans `platform_settings`
- Paramètre `platform_mobile_money_phone` inséré dans `platform_settings`

### 2. Edge Functions
- `process-wave-payment` : split pour paiements Wave
- `process-mobile-money-payment` : split pour paiements Mobile Money (Orange/MTN)
- Même logique : vendor_amount = prix DB × qty, platform_amount = total client − vendor
- Enregistrement dans `payment_splits` avec statut `simulated`

### 3. Formulaires prestataire
- Champ "Numéro Wave marchand" dans AddBusinessModal, AdminEditBusinessModal, AdminAddBusinessToOwnerModal
- Champ "Numéro Mobile Money marchand (Orange/MTN)" dans les mêmes formulaires
- Sauvegardés dans `business_accounts.wave_merchant_phone` et `mobile_money_merchant_phone`

### 4. Admin Settings (onglet Finance)
- Champ "Numéro Wave JDV" pour recevoir les commissions Wave
- Champ "Numéro Mobile Money JDV (Orange/MTN)" pour recevoir les commissions Mobile Money
- Stockés dans `platform_settings`

### 5. Checkout
- Après création d'une `business_order` Wave → appel non-bloquant à `process-wave-payment`
- Après création d'une `business_order` Mobile → appel non-bloquant à `process-mobile-money-payment`

### 6. Tableau de bord Commissions
- Page `/admin/commissions` avec KPIs, graphique temporel, et tableau détaillé des splits

### 7. Rappel confirmation livraison
- Edge Function `check-delivery-confirmation-reminder` (CRON horaire)
- Rappel In-app + Push + SMS/WhatsApp 24h après livraison non confirmée
- Anti-spam : vérification notification existante avant envoi

### Statut transferts
- Mode simulation : `vendor_transfer_status` et `platform_transfer_status` = `simulated`
- Production future : appels Wave/Mobile Money Transfer API pour dispatcher les fonds

## En attente ⏳

### Intégration API Wave Production
- **Étape** : Démarche administrative auprès de Wave CI
- **Portail** : https://developer.wave.com
- **Contact** : developers@wave.com / partners@wave.com
- **Documents requis** : RCCM, attestation fiscale, pièce d'identité dirigeant
- **Clés à obtenir** : `WAVE_API_KEY`, `WAVE_WEBHOOK_SECRET`
- **Action post-obtention** : Stocker dans Supabase secrets, remplacer `WavePaymentSimulation` par Wave Checkout API, configurer webhook
