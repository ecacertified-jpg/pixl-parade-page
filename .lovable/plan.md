## Plan : Protéger les colonnes de paiement (Option A)

Migrer les 4 colonnes sensibles de `business_accounts` (`wave_merchant_phone`, `mobile_money_merchant_phone`, `wave_payment_link`, `payment_info`) vers une nouvelle table `business_payment_info` avec RLS stricte (propriétaire + admin uniquement).

### 1. Migration SQL

**Créer `business_payment_info`** :
- `id uuid PK`, `business_account_id uuid UNIQUE FK → business_accounts(id) ON DELETE CASCADE`
- `wave_merchant_phone text`, `mobile_money_merchant_phone text`, `wave_payment_link text`, `payment_info jsonb`
- `created_at`, `updated_at` + trigger `update_updated_at_column`

**RLS** :
- SELECT/INSERT/UPDATE/DELETE : propriétaire (`business_accounts.user_id = auth.uid()`)
- SELECT/ALL admin via `is_active_admin(auth.uid())`

**Migration des données** existantes : `INSERT INTO business_payment_info SELECT … FROM business_accounts WHERE l'une des 4 colonnes est non nulle`.

**Supprimer** les 4 colonnes de `business_accounts` (et les retirer de la vue `business_public_info` si présentes).

**Fonction helper** `get_business_payment_info(p_business_id uuid)` SECURITY DEFINER pour usage côté checkout (renvoie uniquement `wave_payment_link` + `wave_merchant_phone` masqué — utile si checkout doit afficher le lien Wave du vendeur côté client). À cadrer si besoin réel ; sinon checkout passe par edge function.

### 2. Fichiers code à adapter

| Fichier | Changement |
|---|---|
| `src/types/business.ts` | Retirer les 4 champs de `Business`, créer `BusinessPaymentInfo` |
| `src/components/AddBusinessModal.tsx` | Lire/écrire les 4 champs via `business_payment_info` (upsert après création du business) |
| `src/components/BusinessProfileSettings.tsx` | Idem : charger/sauver depuis nouvelle table |
| `src/components/AdminEditBusinessModal.tsx` | Idem côté admin |
| `src/pages/BusinessDashboard.tsx` | Adapter requêtes affichant ces champs |
| `src/pages/Checkout.tsx` | Charger `wave_payment_link`/Mobile Money via la nouvelle table (le buyer doit pouvoir lire) → **edge function `get-business-checkout-info`** qui renvoie les infos minimales nécessaires (montant, lien Wave) |
| `src/hooks/useBusinessQualityScore.ts` | Joindre la nouvelle table pour le score |
| `src/integrations/supabase/types.ts` | Régénéré automatiquement |

### 3. Point clé : accès buyer au lien Wave

Le buyer (non-propriétaire) doit obtenir `wave_payment_link` au checkout. Solution : **edge function `get-business-payment-link`** (JWT vérifié) qui :
- accepte `business_account_id`
- vérifie que l'appelant a une commande/contribution en cours liée à ce business
- renvoie uniquement `wave_payment_link` + `wave_merchant_phone` (rien d'autre)

Cela évite d'exposer la table en SELECT public.

### 4. Marquer le finding comme résolu

Après migration + adaptation code, marquer le finding `business_accounts` payment columns comme `mark_as_fixed`.

### Détails techniques

- Nouvelle table privée → la vue `business_public_info` reste inchangée (elle n'expose déjà pas ces colonnes).
- Pas de breaking change pour les pages publiques vendeur (ces 4 champs n'y figurent pas).
- Migration de données idempotente avec `ON CONFLICT (business_account_id) DO NOTHING`.
- Index sur `business_account_id` (unique déjà = index).