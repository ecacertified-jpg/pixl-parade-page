

## Plan : Architecture de Split de Paiement Wave

### Contexte actuel

- Le prix prestataire est stocke dans `products.price`
- Le prix client = `applyMarkup(price, markup_rate)` ou `markup_rate` vient de `platform_settings.price_markup_rate`
- Au checkout, le client paie le prix majore. La commande (`business_orders`) enregistre `total_amount` = prix majore
- Aucun champ Wave marchand n'existe sur `business_accounts`
- La table `payment_transactions` existe deja (liee aux fonds collectifs)

### Architecture du split

```text
CLIENT paie 12 000 F (prix majore)
         │
         ▼
   [Edge Function: process-wave-payment]
         │
         ├──► Enregistre payment_transaction (montant total)
         │
         ├──► Calcule le split :
         │      prix_prestataire = 10 000 F (prix DB)
         │      commission_jdv   =  2 000 F (12 000 - 10 000)
         │
         ├──► Enregistre dans payment_splits :
         │      • vendor_amount: 10 000 → Wave du prestataire
         │      • platform_amount: 2 000 → Wave JDV
         │
         └──► [Futur] Appel Wave Transfer API pour dispatcher
```

### Modifications prevues

#### 1. Migration SQL

**a) Ajouter `wave_merchant_phone` a `business_accounts`**
```sql
ALTER TABLE business_accounts 
  ADD COLUMN wave_merchant_phone text;
```

**b) Creer la table `payment_splits`**
```sql
CREATE TABLE payment_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  business_order_id uuid REFERENCES business_orders(id),
  total_client_amount numeric NOT NULL,
  vendor_amount numeric NOT NULL,
  platform_amount numeric NOT NULL,
  currency text DEFAULT 'XOF',
  markup_rate numeric NOT NULL,
  vendor_wave_phone text,
  platform_wave_phone text,
  vendor_transfer_status text DEFAULT 'pending',
  platform_transfer_status text DEFAULT 'pending',
  vendor_transfer_ref text,
  platform_transfer_ref text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);
-- RLS : admins + business owner du business_order
```

**c) Ajouter `platform_wave_phone` dans `platform_settings`**
Insertion d'un parametre pour le numero Wave de JDV.

#### 2. Formulaire prestataire — champ Wave

**`src/components/business/BusinessProfileForm.tsx`** (ou equivalent)
- Ajouter un champ "Numero Wave marchand" dans le formulaire de profil business
- Sauvegarde dans `business_accounts.wave_merchant_phone`

**`src/pages/Admin/Settings.tsx`**
- Ajouter un champ "Numero Wave JDV" dans l'onglet Finance
- Stocke dans `platform_settings` avec cle `platform_wave_phone`

#### 3. Edge Function `process-wave-payment`

Logique serveur invoquee apres confirmation du paiement Wave :

```typescript
// 1. Recevoir: order_id, business_order_id, total_client_amount
// 2. Recuperer le prix original du produit (sans markup)
// 3. Calculer: vendor_amount = sum(prix_original * qty)
//             platform_amount = total_client_amount - vendor_amount
// 4. Recuperer wave_merchant_phone du prestataire
// 5. Recuperer platform_wave_phone de platform_settings
// 6. Inserer dans payment_splits
// 7. [Simulation] Marquer comme "simulated"
// 8. [Production] Appeler Wave Transfer API x2
```

#### 4. Checkout — enregistrer le split

**`src/pages/Checkout.tsx`**
- Apres creation de la `business_order`, appeler `process-wave-payment` via `supabase.functions.invoke()`
- Passer les prix originaux des produits (avant markup) dans les donnees de la commande pour permettre le calcul du split cote serveur

#### 5. Back-office admin — visualisation des splits

**`src/pages/Admin/`** (futur)
- Dashboard des commissions percues
- Historique des splits par commande
- Statut des transferts (pending/completed/failed)

### Donnees stockees par commande

| Champ | Exemple |
|-------|---------|
| total_client_amount | 12 000 F |
| vendor_amount | 10 000 F |
| platform_amount | 2 000 F |
| markup_rate | 20% |
| vendor_wave_phone | +225 07 07 07 07 |
| vendor_transfer_status | pending → completed |
| platform_transfer_status | pending → completed |

### Securite
- Le calcul du split se fait COTE SERVEUR (edge function) pour eviter la manipulation
- Les prix originaux sont relus depuis la DB, jamais depuis le client
- RLS sur `payment_splits` : lecture par admin + business owner concerne

### Fichiers concernes
- Migration SQL (3 changements)
- `src/pages/Admin/Settings.tsx` (champ Wave JDV)
- Formulaire profil business (champ Wave marchand)
- `supabase/functions/process-wave-payment/index.ts` (nouveau)
- `src/pages/Checkout.tsx` (appel edge function apres commande)

