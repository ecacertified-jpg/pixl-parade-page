

## Plan : Rappel automatique 24h après livraison non confirmée

### Approche

Créer une nouvelle Edge Function `check-delivery-confirmation-reminder` déclenchée par un CRON job toutes les heures. Elle cherche les commandes livrées depuis 24h+ dont le statut est toujours `delivered` (pas encore `receipt_confirmed` ni `refund_requested`) et envoie un rappel SMS/Push au client.

### Modifications

**1. Nouvelle Edge Function : `supabase/functions/check-delivery-confirmation-reminder/index.ts`**
- Requête : `business_orders` avec `status = 'delivered'` et `delivery_delivered_at <= now() - 24h`
- Anti-spam : vérifier qu'aucune notification de type `delivery_confirmation_reminder` n'existe déjà pour cet `order_id` dans `notifications`
- Pour chaque commande trouvée :
  - **In-app** : notification avec `type: 'delivery_confirmation_reminder'`, `action_url: '/orders'`
  - **Push** : via `sendWebPushNotification` aux abonnements actifs du client
  - **SMS/WhatsApp** : via le routage WhatsApp-first existant (template ou fallback SMS)
- Message : "Rappel : Votre commande #XXXXXXXX a été livrée il y a 24h. Confirmez la réception et notez le vendeur sur joiedevivre-africa.com/orders"

**2. Config : `supabase/config.toml`**
- Ajouter `[functions.check-delivery-confirmation-reminder]` avec `verify_jwt = false`

**3. CRON job (via SQL insert)**
- Planifier toutes les heures : `0 * * * *`
- Appel avec `service_role` key vers la fonction

### Flux

```text
CRON (toutes les heures)
       ↓
check-delivery-confirmation-reminder
       ↓
SELECT business_orders WHERE status='delivered'
  AND delivery_delivered_at <= now()-24h
       ↓
Pour chaque commande sans rappel existant :
  → In-app + Push + SMS/WhatsApp
  "Rappel : confirmez la réception de votre commande"
```

### Fichiers impactés
- `supabase/functions/check-delivery-confirmation-reminder/index.ts` (nouveau)
- `supabase/config.toml` (nouvelle entrée)
- SQL insert pour le CRON job

