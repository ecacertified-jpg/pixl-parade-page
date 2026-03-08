
# Architecture de Split de Paiement Wave

## Implémenté ✅

### 1. Migration SQL
- Colonne `wave_merchant_phone` ajoutée à `business_accounts`
- Table `payment_splits` créée avec RLS (admins + business owners)
- Paramètre `platform_wave_phone` inséré dans `platform_settings`

### 2. Edge Function `process-wave-payment`
- Calcule le split côté serveur à partir des prix originaux des produits (sans markup)
- `vendor_amount` = somme des prix DB × quantité
- `platform_amount` = montant payé client − vendor_amount
- Enregistre dans `payment_splits` avec statut `simulated`
- Récupère les numéros Wave du prestataire et de la plateforme

### 3. Formulaire prestataire (`AddBusinessModal`)
- Champ "Numéro Wave marchand" ajouté dans la section Informations de paiement
- Sauvegardé dans `business_accounts.wave_merchant_phone`

### 4. Admin Settings (onglet Finance)
- Champ "Numéro Wave JDV" ajouté pour recevoir les commissions
- Stocké dans `platform_settings.platform_wave_phone`

### 5. Checkout
- Après création d'une `business_order` Wave, appel non-bloquant à `process-wave-payment`
- Le split est enregistré automatiquement en arrière-plan

### Statut transferts
- Mode simulation : `vendor_transfer_status` et `platform_transfer_status` = `simulated`
- Production future : appels Wave Transfer API pour dispatcher les fonds
