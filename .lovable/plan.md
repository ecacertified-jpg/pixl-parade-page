

# Plan : Créer une commande test et invoquer check-delivery-confirmation-reminder

## Etapes

### 1. Insérer une commande test en statut `delivered`

Utiliser le profil **Françoise** (`user_id: 16bddba6-...`, phone `+2250708895257`) comme client, avec le business **Adama** (`bc6cda67-...`). La colonne `delivery_delivered_at` sera fixée à `NOW() - INTERVAL '25 hours'`.

```sql
INSERT INTO business_orders (
  business_account_id, customer_id, order_summary, total_amount, currency,
  donor_phone, beneficiary_phone, delivery_address, payment_method,
  status, delivery_delivered_at, delivery_status
) VALUES (
  '